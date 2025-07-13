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

import {
  type LanguageModelV2,
  type LanguageModelV2CallOptions,
  type LanguageModelV2Content,
  type LanguageModelV2FinishReason,
  type LanguageModelV2StreamPart,
  type LanguageModelV2ToolCall,
  type LanguageModelV2Usage,
  type LanguageModelV2ResponseMetadata,
} from '@ai-sdk/providerv2';

import { trace, propagation, type Span } from '@opentelemetry/api';
import { Attr } from './semconv/attributes';
import { createStartActiveSpan } from './startActiveSpan';
import { currentUnixTime } from '../util/currentUnixTime';
import { WITHSPAN_BAGGAGE_KEY } from './withSpanBaggageKey';
import { createGenAISpanName } from './shared';
import type { OpenAIMessage, OpenAIAssistantMessage } from './vercelTypes';

// Type guards for version detection
function isLanguageModelV1(model: any): model is LanguageModelV1 {
  return (
    model?.specificationVersion === 'v1' &&
    typeof model?.provider === 'string' &&
    typeof model?.modelId === 'string'
  );
}

function isLanguageModelV2(model: any): model is LanguageModelV2 {
  return (
    model?.specificationVersion === 'v2' &&
    typeof model?.provider === 'string' &&
    typeof model?.modelId === 'string'
  );
}

function formatCompletion({
  text,
  toolCalls,
}: {
  text: string | undefined;
  toolCalls: LanguageModelV1FunctionToolCall[] | undefined;
}): OpenAIAssistantMessage[] {
  return [
    {
      role: 'assistant',
      content:
        text ??
        (toolCalls && toolCalls.length > 0
          ? null // Content is null when we have no text but do have tool calls
          : ''),
      tool_calls: toolCalls?.map((toolCall, index) => ({
        id: toolCall.toolCallId,
        type: 'function' as const,
        function: {
          name: toolCall.toolName,
          arguments: toolCall.args,
        },
        index,
      })),
    },
  ];
}

function formatCompletionV2(content: Array<LanguageModelV2Content>): OpenAIAssistantMessage[] {
  const textContent = content.find((c) => c.type === 'text');
  const toolCalls = content.filter((c) => c.type === 'tool-call') as LanguageModelV2ToolCall[];

  return [
    {
      role: 'assistant',
      content: textContent?.type === 'text' ? textContent.text : toolCalls.length > 0 ? null : '',
      tool_calls: toolCalls?.map((toolCall, index) => ({
        id: toolCall.toolCallId,
        type: 'function' as const,
        function: {
          name: toolCall.toolName,
          arguments: JSON.stringify(toolCall.args),
        },
        index,
      })),
    },
  ];
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

function postProcessPromptV2(prompt: any[]): OpenAIMessage[] {
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
        const textContent = message.content.find((part: any) => part.type === 'text');
        const toolCalls = message.content.filter((part: any) => part.type === 'tool-call');
        results.push({
          role: 'assistant',
          content: textContent?.text || null,
          ...(toolCalls.length > 0
            ? {
                tool_calls: toolCalls.map((part: any) => ({
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
          content: message.content.map((part: any) => {
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

/**
 * Wraps an AI SDK model to provide OpenTelemetry instrumentation.
 *
 * Supports both AI SDK v4 (providerv1) and v5 (providerv2) models.
 * Automatically detects the model version and applies appropriate instrumentation.
 *
 * Features:
 * - OpenTelemetry span creation with semantic conventions
 * - Request/response attribute tracking
 * - Token usage monitoring (v1: promptTokens/completionTokens, v2: inputTokens/outputTokens)
 * - Streaming response instrumentation
 * - Tool call tracking and formatting
 * - Compatible with withSpan for nested instrumentation
 *
 * @param model - Language model implementing LanguageModelV1 or LanguageModelV2 interface
 * @returns Wrapped model with identical interface but added instrumentation
 *
 * @example
 * ```typescript
 * // V1 model (AI SDK v4)
 * import { openai } from '@ai-sdk/openai';
 * const model = wrapAISDKModel(openai('gpt-4o-mini'));
 *
 * // V2 model (AI SDK v5)
 * import { openai } from '@ai-sdk/openai';
 * const modelV2 = wrapAISDKModel(openai('gpt-4o-mini')); // v5 model
 *
 * // Usage with generateText
 * import { generateText } from 'ai';
 * const result = await generateText({
 *   model,
 *   prompt: 'Hello world'
 * });
 * ```
 */
export function wrapAISDKModel<T extends LanguageModelV1 | LanguageModelV2>(model: T): T {
  if (isLanguageModelV2(model)) {
    return new AxiomWrappedLanguageModelV2(model) as never as T;
  } else if (isLanguageModelV1(model)) {
    return new AxiomWrappedLanguageModelV1(model) as never as T;
  } else {
    console.warn('Unsupported AI SDK model. Not wrapping.');
    return model;
  }
}

class AxiomWrappedLanguageModelV1 implements LanguageModelV1 {
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

      this.setPostCallAttributes(span, resWithToolCalls);

      return res;
    });
  }

  async doStream(options: LanguageModelV1CallOptions) {
    return this.withSpanHandling(async (span) => {
      const startTime = currentUnixTime(); // Unix timestamp

      this.setScopeAttributes(span);

      this.setPreCallAttributes(span, options);

      const ret = await this.model.doStream(options);

      // `this` is not available in the transform callback, so we need to capture the model ID here
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

              AxiomWrappedLanguageModelV1.setPostCallAttributesStatic(span, modelId, streamResult);

              controller.terminate();
            },
          }),
        ),
      };
    });
  }

  private spanName(): string {
    // TODO: do we ever want to not use "chat"?
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
      [Attr.GenAI.Output.Type]: Attr.GenAI.Output.Type_Values.Text,
      [Attr.GenAI.Request.Model]: this.modelId,
    });

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

    // Set stop sequences
    if (stopSequences && stopSequences.length > 0) {
      span.setAttribute(Attr.GenAI.Request.StopSequences, JSON.stringify(stopSequences));
    }

    // Set response format
    if (responseFormat) {
      span.setAttribute(Attr.GenAI.Output.Type, responseFormat.type);
    }

    // Set mode information
    if (mode.type === 'regular' && mode.tools) {
      span.setAttribute('gen_ai.request.tools_count', mode.tools.length);
      if (mode.toolChoice) {
        span.setAttribute(
          'gen_ai.request.tool_choice',
          typeof mode.toolChoice === 'string' ? mode.toolChoice : JSON.stringify(mode.toolChoice),
        );
      }
    }
  }

  // this is static because we would need to hold a reference to the instance in `executeStream` otherwise
  private static setPostCallAttributesStatic(
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

    // Set completion in proper format
    if (result.finishReason && (result.text || result.toolCalls)) {
      const completion = formatCompletion({
        text: result.text,
        toolCalls: result.toolCalls,
      });
      span.setAttribute(Attr.GenAI.Completion, JSON.stringify(completion));

      // Store finish reason separately as per semantic conventions
      span.setAttribute('gen_ai.response.finish_reasons', JSON.stringify([result.finishReason]));
    }
  }

  private setPostCallAttributes(
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
    AxiomWrappedLanguageModelV1.setPostCallAttributesStatic(span, this.modelId, result);
  }
}

class AxiomWrappedLanguageModelV2 implements LanguageModelV2 {
  constructor(private model: LanguageModelV2) {}

  get specificationVersion() {
    return this.model.specificationVersion;
  }

  get provider(): string {
    return this.model.provider;
  }

  get modelId(): string {
    return this.model.modelId;
  }

  get supportedUrls(): Record<string, RegExp[]> | PromiseLike<Record<string, RegExp[]>> {
    return this.model.supportedUrls;
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

  async doGenerate(options: LanguageModelV2CallOptions) {
    return this.withSpanHandling(async (span) => {
      this.setScopeAttributes(span);
      this.setPreCallAttributes(span, options);

      const res = await this.model.doGenerate(options);

      this.setPostCallAttributes(span, res);

      return res;
    });
  }

  async doStream(options: LanguageModelV2CallOptions) {
    return this.withSpanHandling(async (span) => {
      const startTime = currentUnixTime(); // Unix timestamp

      this.setScopeAttributes(span);
      this.setPreCallAttributes(span, options);

      const ret = await this.model.doStream(options);

      // `this` is not available in the transform callback, so we need to capture the model ID here
      const modelId = this.modelId;

      // Track streaming metrics
      let timeToFirstToken: number | undefined = undefined;
      let usage: LanguageModelV2Usage | undefined = undefined;
      let fullText: string | undefined = undefined;
      const toolCallsMap: Record<string, LanguageModelV2ToolCall> = {};
      let finishReason: LanguageModelV2FinishReason | undefined = undefined;
      let responseMetadata: LanguageModelV2ResponseMetadata | undefined = undefined;

      return {
        ...ret,
        stream: ret.stream.pipeThrough(
          new TransformStream({
            transform(chunk: LanguageModelV2StreamPart, controller) {
              // Track time to first token
              if (timeToFirstToken === undefined && chunk.type === 'text') {
                timeToFirstToken = currentUnixTime() - startTime;
                span.setAttribute('gen_ai.response.time_to_first_token', timeToFirstToken);
              }

              switch (chunk.type) {
                case 'response-metadata':
                  responseMetadata = {
                    id: chunk.id,
                    modelId: chunk.modelId,
                    timestamp: chunk.timestamp,
                  };
                  break;
                case 'text':
                  if (fullText === undefined) {
                    fullText = '';
                  }
                  fullText += chunk.text;
                  break;
                case 'tool-call':
                  toolCallsMap[chunk.toolCallId] = chunk;
                  break;
                case 'finish':
                  usage = chunk.usage;
                  finishReason = chunk.finishReason;
                  break;
              }

              controller.enqueue(chunk);
            },
            async flush(controller) {
              // Convert toolCallsMap to array
              const toolCallsArray: LanguageModelV2ToolCall[] = Object.values(toolCallsMap);

              // Construct result object for helper function
              const streamResult = {
                response: responseMetadata,
                finishReason,
                usage,
                content: [
                  ...(fullText ? [{ type: 'text' as const, text: fullText }] : []),
                  ...toolCallsArray,
                ],
              };

              AxiomWrappedLanguageModelV2.setPostCallAttributesStatic(span, modelId, streamResult);

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

  private setPreCallAttributes(span: Span, options: LanguageModelV2CallOptions) {
    // Set request attributes
    span.setAttributes({
      [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
      [Attr.GenAI.Output.Type]: Attr.GenAI.Output.Type_Values.Text,
      [Attr.GenAI.Request.Model]: this.modelId,
    });

    // Set optional request attributes
    if (options.maxOutputTokens !== undefined) {
      span.setAttribute(Attr.GenAI.Request.MaxTokens, options.maxOutputTokens);
    }
    if (options.frequencyPenalty !== undefined) {
      span.setAttribute(Attr.GenAI.Request.FrequencyPenalty, options.frequencyPenalty);
    }
    if (options.presencePenalty !== undefined) {
      span.setAttribute(Attr.GenAI.Request.PresencePenalty, options.presencePenalty);
    }
    if (options.temperature !== undefined) {
      span.setAttribute(Attr.GenAI.Request.Temperature, options.temperature);
    }
    if (options.topP !== undefined) {
      span.setAttribute(Attr.GenAI.Request.TopP, options.topP);
    }
    if (options.topK !== undefined) {
      span.setAttribute(Attr.GenAI.Request.TopK, options.topK);
    }
    if (options.seed !== undefined) {
      span.setAttribute(Attr.GenAI.Request.Seed, options.seed);
    }

    // Set stop sequences
    if (options.stopSequences && options.stopSequences.length > 0) {
      span.setAttribute(Attr.GenAI.Request.StopSequences, JSON.stringify(options.stopSequences));
    }

    // Set response format
    if (options.responseFormat) {
      span.setAttribute(Attr.GenAI.Output.Type, options.responseFormat.type);
    }

    // Set prompt attributes (full conversation history)
    const processedPrompt = postProcessPromptV2(options.prompt);
    span.setAttribute(Attr.GenAI.Prompt, JSON.stringify(processedPrompt));
  }

  // Static method for setting post-call attributes
  private static setPostCallAttributesStatic(
    span: Span,
    _modelId: string,
    result: {
      response?: LanguageModelV2ResponseMetadata;
      finishReason?: LanguageModelV2FinishReason;
      usage?: LanguageModelV2Usage;
      content?: Array<LanguageModelV2Content>;
    },
  ) {
    // Set response attributes
    if (result.response?.id) {
      span.setAttribute(Attr.GenAI.Response.ID, result.response.id);
    }
    if (result.response?.modelId) {
      span.setAttribute(Attr.GenAI.Response.Model, result.response.modelId);
    }

    // Set usage attributes (v2 uses different token naming)
    if (result.usage) {
      if (result.usage.inputTokens !== undefined) {
        span.setAttribute(Attr.GenAI.Usage.InputTokens, result.usage.inputTokens);
      }
      if (result.usage.outputTokens !== undefined) {
        span.setAttribute(Attr.GenAI.Usage.OutputTokens, result.usage.outputTokens);
      }
    }

    // Set completion in proper format
    if (result.finishReason && result.content) {
      const completion = formatCompletionV2(result.content);
      span.setAttribute(Attr.GenAI.Completion, JSON.stringify(completion));

      // Store finish reason separately as per semantic conventions
      span.setAttribute('gen_ai.response.finish_reasons', JSON.stringify([result.finishReason]));
    }
  }

  private setPostCallAttributes(
    span: Span,
    result: {
      response?: LanguageModelV2ResponseMetadata;
      finishReason?: LanguageModelV2FinishReason;
      usage?: LanguageModelV2Usage;
      content?: Array<LanguageModelV2Content>;
    },
  ) {
    AxiomWrappedLanguageModelV2.setPostCallAttributesStatic(span, this.modelId, result);
  }
}
