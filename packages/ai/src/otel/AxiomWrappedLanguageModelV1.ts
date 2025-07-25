import {
  type LanguageModelV1,
  type LanguageModelV1CallOptions,
  type LanguageModelV1ObjectGenerationMode,
  type LanguageModelV1FunctionToolCall,
  type LanguageModelV1FinishReason,
  type LanguageModelV1StreamPart,
} from '@ai-sdk/providerv1';

import { type Span } from '@opentelemetry/api';

import type { OpenAIMessage } from './vercelTypes';
import { Attr } from './semconv/attributes';

import { createSimpleCompletion } from './completionUtils';
import { appendToolCalls, extractToolResultsFromRawPrompt } from '../util/promptUtils';
import { sanitizeMultimodalContent } from './utils/contentSanitizer';
import {
  setScopeAttributes,
  setBaseAttributes,
  setRequestParameterAttributes,
  withSpanHandling,
  determineOutputTypeV1,
  createStreamChildSpan,
  handleStreamError,
  type CommonSpanContext,
} from './utils/wrapperUtils';
import { promptV1ToOpenAI, normalizeV1ToolCalls } from './utils/normalized';
import { ToolCallAggregator, TextAggregator, StreamStats } from './streaming/aggregators';

// TODO: @cje - use these instead of current `result` type
type DoGenerateReturn = Awaited<ReturnType<LanguageModelV1['doGenerate']>>;
type RawPrompt = DoGenerateReturn['rawCall']['rawPrompt'];
type RawSettings = DoGenerateReturn['rawCall']['rawSettings'];
// type DoStreamReturn = Awaited<ReturnType<LanguageModelV1['doStream']>>;

interface GenAiSpanContext extends CommonSpanContext {
  originalPrompt: OpenAIMessage[];
  rawCall?: {
    rawPrompt?: RawPrompt;
    rawSettings?: RawSettings;
  };
}

interface BuildSpanAttributesInput {
  modelId: string;
  context: GenAiSpanContext;
  result: {
    response?: { id?: string; modelId?: string };
    finishReason?: LanguageModelV1FinishReason;
    usage?: { promptTokens: number; completionTokens: number };
    text?: string;
    toolCalls?: LanguageModelV1FunctionToolCall[];
  };
}

export function isLanguageModelV1(model: unknown): model is LanguageModelV1 {
  return (
    model != null &&
    typeof model === 'object' &&
    'specificationVersion' in model &&
    'provider' in model &&
    'modelId' in model &&
    (model as any).specificationVersion === 'v1' &&
    typeof (model as any).provider === 'string' &&
    typeof (model as any).modelId === 'string'
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

  private async withSpanHandling<T>(
    operation: (span: Span, context: GenAiSpanContext) => Promise<T>,
  ): Promise<T> {
    return withSpanHandling(this.modelId, async (span, commonContext) => {
      const context: GenAiSpanContext = {
        ...commonContext,
        originalPrompt: [],
        rawCall: undefined,
      };
      return operation(span, context);
    });
  }

  async doGenerate(options: LanguageModelV1CallOptions) {
    return this.withSpanHandling(async (span, context) => {
      setScopeAttributes(span);
      this.setPreCallAttributes(span, options, context);

      const res = await this.model.doGenerate(options);

      // Store rawCall data in context for access in post-call processing
      context.rawCall = res.rawCall;

      const attrs = buildSpanAttributes({ modelId: this.modelId, context, result: res });
      span.setAttributes(attrs);

      return res;
    });
  }

  async doStream(options: LanguageModelV1CallOptions) {
    return this.withSpanHandling(async (span, context) => {
      setScopeAttributes(span);
      this.setPreCallAttributes(span, options, context);

      const { stream, ...head } = await this.model.doStream(options);

      // `this` is not available in the transform callback, so we need to capture values here
      const modelId = this.modelId;
      const spanContext = context;

      // Create child span for stream processing
      const childSpan = createStreamChildSpan(span, `chat ${modelId} stream`);

      const stats = new StreamStats();
      const toolAggregator = new ToolCallAggregator();
      const textAggregator = new TextAggregator();

      return {
        ...head,
        stream: stream.pipeThrough(
          new TransformStream({
            transform(chunk: LanguageModelV1StreamPart, controller) {
              try {
                stats.feed(chunk);
                toolAggregator.handleChunk(chunk);
                textAggregator.feed(chunk);

                controller.enqueue(chunk);
              } catch (err) {
                // Handle errors in stream processing
                handleStreamError(childSpan, err);
                childSpan.end();
                controller.error(err);
              }
            },
            async flush(controller) {
              try {
                const attrs = buildSpanAttributes({
                  modelId,
                  context: spanContext,
                  result: {
                    ...head,
                    ...stats.result,
                    toolCalls: toolAggregator.result.length > 0 ? toolAggregator.result : undefined,
                    text: textAggregator.text,
                  },
                });
                span.setAttributes(attrs);

                // End child span successfully
                childSpan.end();
                controller.terminate();
              } catch (err) {
                // Handle errors in stream finalization
                handleStreamError(childSpan, err);
                childSpan.end();
                controller.error(err);
              }
            },
          }),
        ),
      };
    });
  }

  private setPreCallAttributes(
    span: Span,
    options: LanguageModelV1CallOptions,
    context: GenAiSpanContext,
  ) {
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
    const processedPrompt = promptV1ToOpenAI(prompt);

    // Store the original prompt for later use in post-call processing
    context.originalPrompt = processedPrompt;

    span.setAttribute(
      Attr.GenAI.Prompt,
      JSON.stringify(sanitizeMultimodalContent(processedPrompt)),
    );

    setBaseAttributes(span, this.model.provider, this.modelId);

    const outputType = determineOutputTypeV1({ responseFormat, mode });
    if (outputType) {
      span.setAttribute(Attr.GenAI.Output.Type, outputType);
    }

    setRequestParameterAttributes(span, {
      maxTokens,
      frequencyPenalty,
      presencePenalty,
      temperature,
      topP,
      topK,
      seed,
      stopSequences,
    });
  }
}

function buildSpanAttributes(
  input: BuildSpanAttributesInput,
): Record<string, string | number | boolean | string[]> {
  const attributes: Record<string, string | number | boolean | string[]> = {};
  const { result, context } = input;

  // Update prompt to include tool calls and tool results if they exist
  // (we're putting the tool calls/results on the prompt for semantic
  // reasons, but we only have access to them post-call with the vercel sdk)
  if (result.toolCalls && result.toolCalls.length > 0) {
    const originalPrompt = context.originalPrompt || [];

    // Normalize the tool calls to the common format
    const normalizedToolCalls = normalizeV1ToolCalls(result.toolCalls);

    const toolResultsMap = extractToolResultsFromRawPrompt(
      (context.rawCall?.rawPrompt as any[]) || [],
    );

    const updatedPrompt = appendToolCalls(
      originalPrompt,
      normalizedToolCalls,
      toolResultsMap,
      result.text,
    );

    attributes[Attr.GenAI.Prompt] = JSON.stringify(sanitizeMultimodalContent(updatedPrompt));
  }

  // Create simple completion array with just assistant text
  if (result.text) {
    const completion = createSimpleCompletion({
      text: result.text,
    });
    attributes[Attr.GenAI.Completion] = JSON.stringify(completion);
  }

  if (result.response?.id) {
    attributes[Attr.GenAI.Response.ID] = result.response.id;
  }
  if (result.response?.modelId) {
    attributes[Attr.GenAI.Response.Model] = result.response.modelId;
  }

  if (result.usage?.promptTokens) {
    if (Number.isNaN(result.usage.promptTokens)) {
      console.warn(
        'usage.promptTokens is NaN. You might need to enable `compatibility: strict`. See: https://github.com/vercel/ai/discussions/1882',
        result.usage.promptTokens,
      );
    } else {
      attributes[Attr.GenAI.Usage.InputTokens] = result.usage.promptTokens;
    }
  }

  if (result.usage?.completionTokens) {
    if (Number.isNaN(result.usage.completionTokens)) {
      console.warn(
        'usage.completionTokens is NaN. You might need to enable `compatibility: strict`. See: https://github.com/vercel/ai/discussions/1882',
        result.usage.completionTokens,
      );
    } else {
      attributes[Attr.GenAI.Usage.OutputTokens] = result.usage.completionTokens;
    }
  }

  if (result.finishReason) {
    attributes[Attr.GenAI.Response.FinishReasons] = JSON.stringify([result.finishReason]);
  }

  return attributes;
}
