import {
  type LanguageModelV2,
  type LanguageModelV2CallOptions,
  type LanguageModelV2Content,
  type LanguageModelV2FinishReason,
  type LanguageModelV2StreamPart,
  type LanguageModelV2ToolCall,
  type LanguageModelV2Usage,
  type LanguageModelV2ResponseMetadata,
  type LanguageModelV2Prompt,
} from '@ai-sdk/providerv2';

import { type Span } from '@opentelemetry/api';
import { Attr } from './semconv/attributes';
import type { OpenAIMessage } from './vercelTypes';
import { createSimpleCompletion } from './completionUtils';
import { appendToolCalls, extractToolResultsFromPromptV2 } from '../util/promptUtils';
import {
  setScopeAttributes,
  setBaseAttributes,
  setRequestParameterAttributes,
  withSpanHandling,
  determineOutputTypeV2,
  type CommonSpanContext,
} from './utils/wrapperUtils';
import { promptV2ToOpenAI, normalizeV2ToolCalls } from './utils/normalized';

interface GenAiSpanContext extends CommonSpanContext {
  originalPrompt: OpenAIMessage[];
  originalV2Prompt: LanguageModelV2Prompt;
}

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

  private async withSpanHandling<T>(
    operation: (span: Span, context: GenAiSpanContext) => Promise<T>,
  ): Promise<T> {
    return withSpanHandling(this.modelId, async (span, commonContext) => {
      const context: GenAiSpanContext = {
        ...commonContext,
        originalPrompt: [],
        originalV2Prompt: [],
      };
      return operation(span, context);
    });
  }

  async doGenerate(options: LanguageModelV2CallOptions) {
    return this.withSpanHandling(async (span, context) => {
      setScopeAttributes(span);
      this.setPreCallAttributes(span, options, context);

      const res = await this.model.doGenerate(options);

      // Convert prompt to OpenAI messages for completion array
      const promptMessages = promptV2ToOpenAI(options.prompt);

      await this.setPostCallAttributes(span, res, promptMessages, context);

      return res;
    });
  }

  async doStream(options: LanguageModelV2CallOptions) {
    return this.withSpanHandling(async (span, context) => {
      setScopeAttributes(span);
      this.setPreCallAttributes(span, options, context);

      // Convert prompt to OpenAI messages for completion array
      const promptMessages = promptV2ToOpenAI(options.prompt);

      const ret = await this.model.doStream(options);

      // `this` is not available in the transform callback, so we need to capture the model ID and context here
      const modelId = this.modelId;
      const spanContext = context;

      // Track streaming metrics
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

              await AxiomWrappedLanguageModelV2.setPostCallAttributesStatic(
                span,
                modelId,
                streamResult,
                promptMessages,
                spanContext,
              );

              controller.terminate();
            },
          }),
        ),
      };
    });
  }

  private setPreCallAttributes(
    span: Span,
    options: LanguageModelV2CallOptions,
    context: GenAiSpanContext,
  ) {
    setBaseAttributes(span, this.model.provider, this.modelId);

    const outputType = determineOutputTypeV2(options);
    if (outputType) {
      span.setAttribute(Attr.GenAI.Output.Type, outputType);
    }

    setRequestParameterAttributes(span, {
      maxTokens: options.maxOutputTokens,
      frequencyPenalty: options.frequencyPenalty,
      presencePenalty: options.presencePenalty,
      temperature: options.temperature,
      topP: options.topP,
      topK: options.topK,
      seed: options.seed,
      stopSequences: options.stopSequences,
    });

    const processedPrompt = promptV2ToOpenAI(options.prompt);

    // Store both the original V2 prompt and processed prompt for later use in post-call processing
    context.originalV2Prompt = options.prompt;
    context.originalPrompt = processedPrompt;

    span.setAttribute(Attr.GenAI.Prompt, JSON.stringify(processedPrompt));
  }

  private static async processToolCallsAndCreateSpans(
    parentSpan: Span,
    content: Array<LanguageModelV2Content>,
    _promptMessages?: OpenAIMessage[],
  ): Promise<void> {
    // Extract text and tool calls from content
    const textContent = content.find((c) => c.type === 'text');
    const assistantText = textContent?.type === 'text' ? textContent.text : undefined;
    const toolCalls = content.filter((c) => c.type === 'tool-call') as LanguageModelV2ToolCall[];

    // Only set completion for final responses without tool calls
    // Tool call responses will be followed by additional calls, so we wait for the final response
    if (toolCalls.length === 0 && assistantText) {
      // Create simple completion array with assistant text only (mirroring V1 behavior)
      // Tool calls are handled in the prompt, not completion
      const completion = createSimpleCompletion({
        text: assistantText,
      });

      // Set completion array as span attribute
      parentSpan.setAttribute(Attr.GenAI.Completion, JSON.stringify(completion));
    }
  }

  private static async setPostCallAttributesStatic(
    span: Span,
    _modelId: string,
    result: {
      response?: LanguageModelV2ResponseMetadata;
      finishReason?: LanguageModelV2FinishReason;
      usage?: LanguageModelV2Usage;
      content?: Array<LanguageModelV2Content>;
    },
    promptMessages?: OpenAIMessage[],
    context?: GenAiSpanContext,
  ) {
    // Check if we have tool calls in this response
    const toolCalls = result.content?.filter(
      (c) => c.type === 'tool-call',
    ) as LanguageModelV2ToolCall[];

    // Only set response metadata once per span to prevent overwriting when generateText() makes multiple calls
    // For tool calls, we want to preserve the first call's metadata (tool-calls, token count)
    // For non-tool calls, we set the metadata normally
    const alreadySet = (span as any).attributes?.[Attr.GenAI.Response.FinishReasons] !== undefined;

    if (!alreadySet) {
      if (result.response?.id) {
        span.setAttribute(Attr.GenAI.Response.ID, result.response.id);
      }
      if (result.response?.modelId) {
        span.setAttribute(Attr.GenAI.Response.Model, result.response.modelId);
      }

      if (result.usage?.inputTokens !== undefined) {
        span.setAttribute(Attr.GenAI.Usage.InputTokens, result.usage.inputTokens);
      }
      if (result.usage?.outputTokens !== undefined) {
        span.setAttribute(Attr.GenAI.Usage.OutputTokens, result.usage.outputTokens);
      }
    }

    // Update prompt to include tool calls and tool results if they exist
    if (toolCalls && toolCalls.length > 0) {
      const originalPrompt = context?.originalPrompt || [];

      const normalizedToolCalls = normalizeV2ToolCalls(toolCalls);

      // Extract real tool results from the original V2 prompt structure
      const toolResultsMap = extractToolResultsFromPromptV2(context?.originalV2Prompt || []);

      // Extract assistant text content from the response
      const textContent = result.content?.find((c) => c.type === 'text');
      const assistantText = textContent?.type === 'text' ? textContent.text : undefined;

      // Use the standard prompt utility to append tool calls
      const updatedPrompt = appendToolCalls(
        originalPrompt,
        normalizedToolCalls,
        toolResultsMap,
        assistantText,
      );

      // Update the prompt attribute with the complete conversation history
      span.setAttribute(Attr.GenAI.Prompt, JSON.stringify(updatedPrompt));
    }

    // Process tool calls and create child spans
    if (result.content && result.content.length > 0) {
      await AxiomWrappedLanguageModelV2.processToolCallsAndCreateSpans(
        span,
        result.content,
        promptMessages,
      );
    } else if (result.finishReason) {
      // For non-tool responses, still create completion array
      const completion = createSimpleCompletion({
        text: '',
      });
      span.setAttribute(Attr.GenAI.Completion, JSON.stringify(completion));
    }

    // Store finish reason separately as per semantic conventions (only on first call to prevent overwriting)
    if (result.finishReason && !alreadySet) {
      span.setAttribute(Attr.GenAI.Response.FinishReasons, JSON.stringify([result.finishReason]));
    }
  }

  private async setPostCallAttributes(
    span: Span,
    result: {
      response?: LanguageModelV2ResponseMetadata;
      finishReason?: LanguageModelV2FinishReason;
      usage?: LanguageModelV2Usage;
      content?: Array<LanguageModelV2Content>;
    },
    promptMessages?: OpenAIMessage[],
    context?: GenAiSpanContext,
  ) {
    await AxiomWrappedLanguageModelV2.setPostCallAttributesStatic(
      span,
      this.modelId,
      result,
      promptMessages,
      context,
    );
  }
}
