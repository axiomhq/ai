import {
  type LanguageModelV1,
  type LanguageModelV1CallOptions,
  type LanguageModelV1ObjectGenerationMode,
  type LanguageModelV1Prompt,
  type LanguageModelV1FunctionToolCall,
  type LanguageModelV1FinishReason,
  type LanguageModelV1TextPart,
  type LanguageModelV1ToolCallPart,
  type LanguageModelV1StreamPart,
  type LanguageModelV1ProviderMetadata,
} from '@ai-sdk/providerv1';

import { trace, propagation, type Span } from '@opentelemetry/api';

import type { OpenAIMessage } from './vercelTypes';
import { Attr } from './semconv/attributes';
import { createGenAISpanName } from './shared';
import { currentUnixTime } from 'src/util/currentUnixTime';
import { createStartActiveSpan } from './startActiveSpan';
import { WITHSPAN_BAGGAGE_KEY } from './withSpanBaggageKey';
import { createSimpleCompletion } from './completionUtils';

export function isLanguageModelV1(model: any): model is LanguageModelV1 {
  return (
    model?.specificationVersion === 'v1' &&
    typeof model?.provider === 'string' &&
    typeof model?.modelId === 'string'
  );
}

export class AxiomWrappedLanguageModelV1 implements LanguageModelV1 {
  constructor(private model: LanguageModelV1) {}

  get specificationVersion() {
    return this.model.specificationVersion;
  }

  get provider(): string {
    return this.model.provider;
  }

  get modelId(): string {
    return this.model.modelId;
  }

  get defaultObjectGenerationMode(): LanguageModelV1ObjectGenerationMode {
    return this.model.defaultObjectGenerationMode;
  }

  get supportsImageUrls(): boolean | undefined {
    return this.model.supportsImageUrls;
  }

  get supportsStructuredOutputs(): boolean | undefined {
    return this.model.supportsStructuredOutputs;
  }

  get supportsUrl(): ((url: URL) => boolean) | undefined {
    return this.model.supportsUrl;
  }

  private async withSpanHandling<T>(operation: (span: Span) => Promise<T>): Promise<T> {
    const bag = propagation.getActiveBaggage();
    const isWithinWithSpan = bag?.getEntry(WITHSPAN_BAGGAGE_KEY)?.value === 'true';

    if (isWithinWithSpan) {
      // Reuse existing span created by withSpan
      const activeSpan = trace.getActiveSpan();
      if (!activeSpan) {
        throw new Error('Expected active span when within withSpan');
      }
      activeSpan.updateName(this.spanName());
      return operation(activeSpan);
    } else {
      // Create new span only if not within withSpan
      const tracer = trace.getTracer('@axiomhq/ai');
      const startActiveSpan = createStartActiveSpan(tracer);
      const name = this.spanName();

      return startActiveSpan(name, null, operation);
    }
  }

  async doGenerate(options: LanguageModelV1CallOptions) {
    return this.withSpanHandling(async (span) => {
      this.setScopeAttributes(span);
      this.setPreCallAttributes(span, options);

      const res = await this.model.doGenerate(options);

      const resWithToolCalls = {
        ...res,
        toolCalls: res.toolCalls || undefined,
      };

      await this.setPostCallAttributes(span, resWithToolCalls);

      return res;
    });
  }

  async doStream(options: LanguageModelV1CallOptions) {
    return this.withSpanHandling(async (span) => {
      const startTime = currentUnixTime(); // Unix timestamp

      this.setScopeAttributes(span);

      this.setPreCallAttributes(span, options);

      const ret = await this.model.doStream(options);

      // `this` is not available in the transform callback, so we need to capture values here
      const modelId = this.modelId;

      // Track streaming metrics
      let timeToFirstToken: number | undefined = undefined;
      let usage:
        | {
            promptTokens: number;
            completionTokens: number;
          }
        | undefined = undefined;
      let fullText: string | undefined = undefined;
      const toolCallsMap: Record<string, LanguageModelV1FunctionToolCall> = {};
      let finishReason: LanguageModelV1FinishReason | undefined = undefined;
      let responseId: string | undefined = undefined;
      let responseModelId: string | undefined = undefined;
      let responseProviderMetadata: LanguageModelV1ProviderMetadata | undefined = undefined;

      return {
        ...ret,
        stream: ret.stream.pipeThrough(
          new TransformStream({
            transform(chunk: LanguageModelV1StreamPart, controller) {
              // Track time to first token
              if (timeToFirstToken === undefined) {
                timeToFirstToken = currentUnixTime() - startTime;
                span.setAttribute('gen_ai.response.time_to_first_token', timeToFirstToken);
              }

              switch (chunk.type) {
                case 'response-metadata':
                  if (chunk.id) {
                    responseId = chunk.id;
                  }
                  if (chunk.modelId) {
                    responseModelId = chunk.modelId;
                  }
                  // @ts-expect-error - not included on vercel types but have seen references to this elsewhere. need to check out
                  if (chunk.providerMetadata) {
                    // @ts-expect-error - not included on vercel types but have seen references to this elsewhere. need to check out
                    responseProviderMetadata = chunk.providerMetadata;
                  }
                  break;
                case 'text-delta':
                  if (fullText === undefined) {
                    fullText = '';
                  }
                  fullText += chunk.textDelta;
                  break;
                case 'tool-call':
                  toolCallsMap[chunk.toolCallId] = {
                    toolCallType: chunk.toolCallType,
                    toolCallId: chunk.toolCallId,
                    toolName: chunk.toolName,
                    args: chunk.args,
                  } as LanguageModelV1FunctionToolCall;
                  break;
                case 'tool-call-delta':
                  if (toolCallsMap[chunk.toolCallId] === undefined) {
                    toolCallsMap[chunk.toolCallId] = {
                      toolCallType: chunk.toolCallType,
                      toolCallId: chunk.toolCallId,
                      toolName: chunk.toolName,
                      args: '',
                    } as LanguageModelV1FunctionToolCall;
                  }
                  toolCallsMap[chunk.toolCallId].args += chunk.argsTextDelta;
                  break;
                case 'finish':
                  usage = chunk.usage;
                  finishReason = chunk.finishReason;
                  break;
              }

              controller.enqueue(chunk);
            },
            async flush(controller) {
              // Convert toolCallsMap to array for postProcessOutput
              const toolCallsArray: LanguageModelV1FunctionToolCall[] = Object.values(toolCallsMap);

              // Construct result object for helper function
              const streamResult = {
                response:
                  responseId || responseModelId
                    ? {
                        id: responseId,
                        modelId: responseModelId,
                      }
                    : undefined,
                finishReason,
                usage,
                text: fullText,
                toolCalls: toolCallsArray.length > 0 ? toolCallsArray : undefined,
                providerMetadata: responseProviderMetadata,
              };

              await AxiomWrappedLanguageModelV1.setPostCallAttributesStatic(
                span,
                modelId,
                streamResult,
              );

              controller.terminate();
            },
          }),
        ),
      };
    });
  }

  private spanName(): string {
    return createGenAISpanName(Attr.GenAI.Operation.Name_Values.Chat, this.modelId);
  }

  private setScopeAttributes(span: Span) {
    const bag = propagation.getActiveBaggage();

    // Set workflow and task attributes from baggage
    if (bag) {
      const capability = bag.getEntry('capability')?.value;
      if (capability) {
        span.setAttribute(Attr.GenAI.Capability.Name, capability);
      }

      const step = bag.getEntry('step')?.value;
      if (step) {
        span.setAttribute(Attr.GenAI.Step.Name, step);
      }
    }
  }

  private determineOutputType({
    responseFormat,
    mode,
  }: {
    responseFormat: LanguageModelV1CallOptions['responseFormat'];
    mode: LanguageModelV1CallOptions['mode'];
  }): string | undefined {
    if (responseFormat?.type) {
      switch (responseFormat.type) {
        case 'json':
          return Attr.GenAI.Output.Type_Values.Json;
        case 'text':
          return Attr.GenAI.Output.Type_Values.Text;
      }
    }

    if (mode?.type === 'object-json' || mode?.type === 'object-tool') {
      return Attr.GenAI.Output.Type_Values.Json;
    }

    if (mode?.type === 'regular') {
      return Attr.GenAI.Output.Type_Values.Text;
    }

    return undefined;
  }

  private setPreCallAttributes(span: Span, options: LanguageModelV1CallOptions) {
    const {
      prompt,
      maxTokens,
      frequencyPenalty,
      presencePenalty,
      temperature,
      topP,
      topK,
      seed,
      stopSequences,
      responseFormat,
      mode,
    } = options;

    // Set prompt attributes (full conversation history)
    const processedPrompt = postProcessPrompt(prompt);
    span.setAttribute(Attr.GenAI.Prompt, JSON.stringify(processedPrompt));

    // Set request attributes
    span.setAttributes({
      [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
      [Attr.GenAI.Request.Model]: this.modelId,
      [Attr.GenAI.Provider]: this.model.provider,
    });

    const outputType = this.determineOutputType({ responseFormat, mode });
    if (outputType) {
      span.setAttribute(Attr.GenAI.Output.Type, outputType);
    }

    // Set optional request attributes
    if (maxTokens !== undefined) {
      span.setAttribute(Attr.GenAI.Request.MaxTokens, maxTokens);
    }
    if (frequencyPenalty !== undefined) {
      span.setAttribute(Attr.GenAI.Request.FrequencyPenalty, frequencyPenalty);
    }
    if (presencePenalty !== undefined) {
      span.setAttribute(Attr.GenAI.Request.PresencePenalty, presencePenalty);
    }
    if (temperature !== undefined) {
      span.setAttribute(Attr.GenAI.Request.Temperature, temperature);
    }
    if (topP !== undefined) {
      span.setAttribute(Attr.GenAI.Request.TopP, topP);
    }
    if (topK !== undefined) {
      span.setAttribute(Attr.GenAI.Request.TopK, topK);
    }
    if (seed !== undefined) {
      span.setAttribute(Attr.GenAI.Request.Seed, seed);
    }
    if (stopSequences && stopSequences.length > 0) {
      span.setAttribute(Attr.GenAI.Request.StopSequences, JSON.stringify(stopSequences));
    }
  }

  // this is static because we would need to hold a reference to the instance in `executeStream` otherwise
  private static async setPostCallAttributesStatic(
    span: Span,
    _modelId: string,
    result: {
      response?: { id?: string; modelId?: string };
      finishReason?: LanguageModelV1FinishReason;
      usage?: { promptTokens: number; completionTokens: number };
      text?: string;
      toolCalls?: LanguageModelV1FunctionToolCall[];
      providerMetadata?: LanguageModelV1ProviderMetadata;
    },
  ) {
    // Set response attributes
    if (result.response?.id) {
      span.setAttribute(Attr.GenAI.Response.ID, result.response.id);
    }
    if (result.response?.modelId) {
      span.setAttribute(Attr.GenAI.Response.Model, result.response.modelId);
    }

    // Set usage attributes
    if (result.usage) {
      span.setAttribute(Attr.GenAI.Usage.InputTokens, result.usage.promptTokens);
      span.setAttribute(Attr.GenAI.Usage.OutputTokens, result.usage.completionTokens);
    }

    // Create simple completion array with just assistant text
    if (result.text) {
      const completion = createSimpleCompletion({
        promptMessages: [], // Don't include conversation history for V1 compatibility
        text: result.text,
        includeTimestamps: false, // Match existing test expectations
      });
      span.setAttribute(Attr.GenAI.Completion, JSON.stringify(completion));
    }

    // Store finish reason separately as per semantic conventions
    if (result.finishReason) {
      span.setAttribute(Attr.GenAI.Response.FinishReasons, JSON.stringify([result.finishReason]));
    }
  }

  private async setPostCallAttributes(
    span: Span,
    result: {
      response?: { id?: string; modelId?: string };
      finishReason?: LanguageModelV1FinishReason;
      usage?: { promptTokens: number; completionTokens: number };
      text?: string;
      toolCalls?: LanguageModelV1FunctionToolCall[];
      providerMetadata?: LanguageModelV1ProviderMetadata;
    },
  ) {
    await AxiomWrappedLanguageModelV1.setPostCallAttributesStatic(span, this.modelId, result);
  }
}

function postProcessPrompt(prompt: LanguageModelV1Prompt): OpenAIMessage[] {
  const results: OpenAIMessage[] = [];
  for (const message of prompt) {
    switch (message.role) {
      case 'system':
        results.push({
          role: 'system',
          content: message.content,
        });
        break;
      case 'assistant':
        const textPart = message.content.find((part) => part.type === 'text') as
          | LanguageModelV1TextPart
          | undefined;
        const toolCallParts = message.content.filter(
          (part) => part.type === 'tool-call',
        ) as LanguageModelV1ToolCallPart[];
        results.push({
          role: 'assistant',
          content: textPart?.text || null,
          ...(toolCallParts.length > 0
            ? {
                tool_calls: toolCallParts.map((part) => ({
                  id: part.toolCallId,
                  function: {
                    name: part.toolName,
                    arguments: JSON.stringify(part.args),
                  },
                  type: 'function',
                })),
              }
            : {}),
        });
        break;
      case 'user':
        results.push({
          role: 'user',
          content: message.content.map((part) => {
            switch (part.type) {
              case 'text':
                return {
                  type: 'text',
                  text: part.text,
                  ...(part.providerMetadata ? { providerMetadata: part.providerMetadata } : {}),
                };
              case 'image':
                return {
                  type: 'image_url',
                  image_url: {
                    url: part.image.toString(),
                    ...(part.providerMetadata ? { providerMetadata: part.providerMetadata } : {}),
                  },
                };
              default:
                // Handle unknown content types by passing them through
                return part as any;
            }
          }),
        });
        break;
      case 'tool':
        for (const part of message.content) {
          results.push({
            role: 'tool',
            tool_call_id: part.toolCallId,
            content: JSON.stringify(part.result),
          });
        }
        break;
    }
  }
  return results;
}
