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
import type { OpenAIAssistantMessage, OpenAIMessage } from './vercelTypes';

export function isLanguageModelV2(model: any): model is LanguageModelV2 {
  return (
    model?.specificationVersion === 'v2' &&
    typeof model?.provider === 'string' &&
    typeof model?.modelId === 'string'
  );
}

export class AxiomWrappedLanguageModelV2 implements LanguageModelV2 {
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
      const startTime = currentUnixTime();

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
              const toolCallsArray: LanguageModelV2ToolCall[] = Object.values(toolCallsMap);

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

  private determineOutputType(options: LanguageModelV2CallOptions): string | undefined {
    if (options.responseFormat?.type) {
      switch (options.responseFormat.type) {
        case 'json':
          return Attr.GenAI.Output.Type_Values.Json;
        case 'text':
          return Attr.GenAI.Output.Type_Values.Text;
      }
    }

    // (v2 types don't have `mode`)

    return undefined;
  }

  private setPreCallAttributes(span: Span, options: LanguageModelV2CallOptions) {
    span.setAttributes({
      [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
      [Attr.GenAI.Request.Model]: this.modelId,
      [Attr.GenAI.Provider]: this.model.provider,
    });
    
    // Check for tools in options (V2 handles tools differently than V1)
    // Tools might be encoded in prompt or other fields
    if ('tools' in options && Array.isArray((options as any).tools)) {
      const tools = (options as any).tools;
      const availableTools = tools.map((tool: any) => ({
        type: tool.type || 'function',
        function: {
          name: tool.name || tool.function?.name,
          description: tool.description || tool.function?.description,
          parameters: tool.parameters || tool.function?.parameters,
        },
      }));
      span.setAttribute('gen_ai.request.tools', JSON.stringify(availableTools));
    }

    const outputType = this.determineOutputType(options);
    if (outputType) {
      span.setAttribute(Attr.GenAI.Output.Type, outputType);
    }

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

    if (options.stopSequences && options.stopSequences.length > 0) {
      span.setAttribute(Attr.GenAI.Request.StopSequences, JSON.stringify(options.stopSequences));
    }

    const processedPrompt = postProcessPromptV2(options.prompt);
    span.setAttribute(Attr.GenAI.Prompt, JSON.stringify(processedPrompt));
  }

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
    if (result.response?.id) {
      span.setAttribute(Attr.GenAI.Response.ID, result.response.id);
    }
    if (result.response?.modelId) {
      span.setAttribute(Attr.GenAI.Response.Model, result.response.modelId);
    }

    if (result.usage) {
      if (result.usage.inputTokens !== undefined) {
        span.setAttribute(Attr.GenAI.Usage.InputTokens, result.usage.inputTokens);
      }
      if (result.usage.outputTokens !== undefined) {
        span.setAttribute(Attr.GenAI.Usage.OutputTokens, result.usage.outputTokens);
      }
    }

    if (result.finishReason && result.content) {
      const completion = formatCompletionV2(result.content);
      span.setAttribute(Attr.GenAI.Completion, JSON.stringify(completion));

      span.setAttribute(Attr.GenAI.Response.FinishReasons, JSON.stringify([result.finishReason]));
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
