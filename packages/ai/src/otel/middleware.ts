import {
  type LanguageModelV1,
  type LanguageModelV1CallOptions,
  type LanguageModelV1StreamPart,
} from '@ai-sdk/providerv1';
import {
  type LanguageModelV2,
  type LanguageModelV2CallOptions,
  type LanguageModelV2Middleware,
  type LanguageModelV2StreamPart,
  type LanguageModelV2Content,
  type LanguageModelV2ToolCall,
  type LanguageModelV2Usage,
  type LanguageModelV2ResponseMetadata,
  type LanguageModelV2FinishReason,
} from '@ai-sdk/providerv2';
import { type LanguageModelV1Middleware } from 'aiv4';

import { type Span } from '@opentelemetry/api';
import { Attr } from './semconv/attributes';
import type { OpenAIMessage } from './vercelTypes';
import { createSimpleCompletion } from './completionUtils';
import {
  appendToolCalls,
  extractToolResultsFromPromptV2,
  extractToolResultsFromRawPrompt,
} from '../util/promptUtils';
import { sanitizeMultimodalContent } from './utils/contentSanitizer';
import { setAttributeIfNotRedacted, RedactionKind } from './utils/redaction';
import {
  setScopeAttributes,
  setBaseAttributes,
  setRequestParameterAttributes,
  withSpanHandling,
  determineOutputTypeV1,
  determineOutputTypeV2,
  createStreamChildSpan,
  handleStreamError,
  type CommonSpanContext,
} from './utils/wrapperUtils';
import {
  promptV1ToOpenAI,
  promptV2ToOpenAI,
  normalizeV1ToolCalls,
  normalizeV2ToolCalls,
} from './utils/normalized';
import {
  ToolCallAggregator,
  TextAggregator,
  StreamStats,
  ToolCallAggregatorV2,
  TextAggregatorV2,
  StreamStatsV2,
} from './streaming/aggregators';

export interface AxiomTelemetryConfig {
  // Future configuration options can be added here
}

interface GenAiSpanContextV1 extends CommonSpanContext {
  originalPrompt: OpenAIMessage[];
  rawCall?: {
    rawPrompt?: any[];
    rawSettings?: any;
  };
}

interface GenAiSpanContextV2 extends CommonSpanContext {
  originalPrompt: OpenAIMessage[];
  originalV2Prompt: any[];
}

/**
 * Creates Axiom telemetry middleware for LanguageModelV1
 */
export function axiomAIMiddlewareV1(/* _config?: AxiomTelemetryConfig */): LanguageModelV1Middleware {
  return {
    wrapGenerate: async ({ doGenerate, params, model }) => {
      return withSpanHandling(model.modelId, async (span, commonContext) => {
        const context: GenAiSpanContextV1 = {
          ...commonContext,
          originalPrompt: [],
          rawCall: undefined,
        };

        // Pre-call setup
        setScopeAttributes(span);
        setPreCallAttributesV1(span, params, context, model);

        const res = await doGenerate();

        // Store rawCall data in context for access in post-call processing
        context.rawCall = res.rawCall as { rawPrompt?: any[]; rawSettings?: any };

        // Post-call processing
        await setPostCallAttributesV1(span, res, context, model);

        return res;
      });
    },

    wrapStream: async ({ doStream, params, model }) => {
      return withSpanHandling(model.modelId, async (span, commonContext) => {
        const context: GenAiSpanContextV1 = {
          ...commonContext,
          originalPrompt: [],
          rawCall: undefined,
        };

        // Pre-call setup
        setScopeAttributes(span);
        setPreCallAttributesV1(span, params, context, model);

        const { stream, ...head } = await doStream();

        // Create child span for stream processing
        const childSpan = createStreamChildSpan(span, `chat ${model.modelId} stream`);

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
                  handleStreamError(childSpan, err);
                  childSpan.end();
                  controller.error(err);
                }
              },
              async flush(controller) {
                try {
                  await setPostCallAttributesV1(
                    span,
                    {
                      ...head,
                      ...stats.result,
                      toolCalls:
                        toolAggregator.result.length > 0 ? toolAggregator.result : undefined,
                      text: textAggregator.text,
                    },
                    context,
                    model,
                  );

                  childSpan.end();
                  controller.terminate();
                } catch (err) {
                  handleStreamError(childSpan, err);
                  childSpan.end();
                  controller.error(err);
                }
              },
            }),
          ),
        };
      });
    },
  };
}

/**
 * Creates unified Axiom telemetry middleware that works with both V1 and V2 models
 */
export function axiomAIMiddleware(config: { model: LanguageModelV1 }): LanguageModelV1Middleware;
export function axiomAIMiddleware(config: { model: LanguageModelV2 }): LanguageModelV2Middleware;
export function axiomAIMiddleware(config: { model: LanguageModelV1 | LanguageModelV2 }) {
  if (config.model.specificationVersion === 'v1') {
    return axiomAIMiddlewareV1();
  } else if (config.model.specificationVersion === 'v2') {
    return axiomAIMiddlewareV2();
  } else {
    console.warn(
      // @ts-expect-error - not allowed at type level, but users can still do it...
      `Unsupported model specification version: ${JSON.stringify(config.model.specificationVersion)}. Creating no-op middleware instead.`,
    );
    return {};
  }
}

/**
 * Creates Axiom telemetry middleware for LanguageModelV2
 */
export function axiomAIMiddlewareV2(/* _config?: AxiomTelemetryConfig */): LanguageModelV2Middleware {
  return {
    wrapGenerate: async ({ doGenerate, params, model }) => {
      return withSpanHandling(model.modelId, async (span, commonContext) => {
        const context: GenAiSpanContextV2 = {
          ...commonContext,
          originalPrompt: [],
          originalV2Prompt: [],
        };

        // Pre-call setup
        setScopeAttributes(span);
        setPreCallAttributesV2(span, params, context, model);

        const res = await doGenerate();

        // Post-call processing
        await setPostCallAttributesV2(span, res, context, model);

        return res;
      });
    },

    wrapStream: async ({ doStream, params, model }) => {
      return withSpanHandling(model.modelId, async (span, commonContext) => {
        const context: GenAiSpanContextV2 = {
          ...commonContext,
          originalPrompt: [],
          originalV2Prompt: [],
        };

        // Pre-call setup
        setScopeAttributes(span);
        setPreCallAttributesV2(span, params, context, model);

        const ret = await doStream();

        // Create child span for stream processing
        const childSpan = createStreamChildSpan(span, `chat ${model.modelId} stream`);

        const stats = new StreamStatsV2();
        const toolAggregator = new ToolCallAggregatorV2();
        const textAggregator = new TextAggregatorV2();

        return {
          ...ret,
          stream: ret.stream.pipeThrough(
            new TransformStream({
              transform(chunk: LanguageModelV2StreamPart, controller) {
                try {
                  stats.feed(chunk);
                  toolAggregator.handleChunk(chunk);
                  textAggregator.feed(chunk);

                  controller.enqueue(chunk);
                } catch (err) {
                  handleStreamError(childSpan, err);
                  childSpan.end();
                  controller.error(err);
                }
              },
              async flush(controller) {
                try {
                  const streamResult = {
                    ...stats.result,
                    content: [
                      ...(textAggregator.text
                        ? [{ type: 'text' as const, text: textAggregator.text }]
                        : []),
                      ...toolAggregator.result,
                    ],
                  };

                  await setPostCallAttributesV2(span, streamResult, context, model);

                  childSpan.end();
                  controller.terminate();
                } catch (err) {
                  handleStreamError(childSpan, err);
                  childSpan.end();
                  controller.error(err);
                }
              },
            }),
          ),
        };
      });
    },
  };
}

// V1 helper functions (extracted from AxiomWrappedLanguageModelV1)
function setPreCallAttributesV1(
  span: Span,
  options: LanguageModelV1CallOptions,
  context: GenAiSpanContextV1,
  model: LanguageModelV1,
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
  context.originalPrompt = processedPrompt;

  setAttributeIfNotRedacted(span, Attr.GenAI.Prompt, JSON.stringify(sanitizeMultimodalContent(processedPrompt)), RedactionKind.Prompts);

  setBaseAttributes(span, model.provider, model.modelId);

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

async function setPostCallAttributesV1(
  span: Span,
  result: any,
  context: GenAiSpanContextV1,
  _model: LanguageModelV1,
) {
  // Update prompt to include tool calls and tool results if they exist
  if (result.toolCalls && result.toolCalls.length > 0) {
    const originalPrompt = context.originalPrompt || [];

    // Normalize the tool calls to the common format
    const normalizedToolCalls = normalizeV1ToolCalls(result.toolCalls);

    // Note: rawCall might not be available in middleware, handle gracefully
    const toolResultsMap = context.rawCall?.rawPrompt
      ? extractToolResultsFromRawPrompt(context.rawCall.rawPrompt as any[])
      : new Map();

    const updatedPrompt = appendToolCalls(
      originalPrompt,
      normalizedToolCalls,
      toolResultsMap,
      result.text,
    );

    setAttributeIfNotRedacted(span, Attr.GenAI.Prompt, JSON.stringify(sanitizeMultimodalContent(updatedPrompt)), RedactionKind.Prompts);
  }

  // Create simple completion array with just assistant text
  if (result.text) {
    const completion = createSimpleCompletion({
      text: result.text,
    });
    setAttributeIfNotRedacted(span, Attr.GenAI.Completion, JSON.stringify(completion), RedactionKind.Completions);
  }

  if (result.response?.id) {
    span.setAttribute(Attr.GenAI.Response.ID, result.response.id);
  }
  if (result.response?.modelId) {
    span.setAttribute(Attr.GenAI.Response.Model, result.response.modelId);
  }

  if (result.usage?.promptTokens) {
    if (Number.isNaN(result.usage.promptTokens)) {
      console.warn(
        'usage.promptTokens is NaN. You might need to enable `compatibility: strict`. See: https://github.com/vercel/ai/discussions/1882',
        result.usage.promptTokens,
      );
    } else {
      span.setAttribute(Attr.GenAI.Usage.InputTokens, result.usage.promptTokens);
    }
  }

  if (result.usage?.completionTokens) {
    if (Number.isNaN(result.usage.completionTokens)) {
      console.warn(
        'usage.completionTokens is NaN. You might need to enable `compatibility: strict`. See: https://github.com/vercel/ai/discussions/1882',
        result.usage.completionTokens,
      );
    } else {
      span.setAttribute(Attr.GenAI.Usage.OutputTokens, result.usage.completionTokens);
    }
  }

  if (result.finishReason) {
    span.setAttribute(Attr.GenAI.Response.FinishReasons, JSON.stringify([result.finishReason]));
  }
}

// V2 helper functions (extracted from AxiomWrappedLanguageModelV2)
function setPreCallAttributesV2(
  span: Span,
  options: LanguageModelV2CallOptions,
  context: GenAiSpanContextV2,
  model: LanguageModelV2,
) {
  setBaseAttributes(span, model.provider, model.modelId);

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

  // Store both the original V2 prompt and processed prompt for later use
  context.originalV2Prompt = options.prompt;
  context.originalPrompt = processedPrompt;

  setAttributeIfNotRedacted(span, Attr.GenAI.Prompt, JSON.stringify(sanitizeMultimodalContent(processedPrompt)), RedactionKind.Prompts);
}

async function setPostCallAttributesV2(
  span: Span,
  result: {
    response?: LanguageModelV2ResponseMetadata;
    finishReason?: LanguageModelV2FinishReason;
    usage?: LanguageModelV2Usage;
    content?: Array<LanguageModelV2Content>;
  },
  context: GenAiSpanContextV2,
  _model: LanguageModelV2,
) {
  // Check if we have tool calls in this response
  const toolCalls = result.content?.filter(
    (c) => c.type === 'tool-call',
  ) as LanguageModelV2ToolCall[];

  // Only set response metadata once per span to prevent overwriting when generateText() makes multiple calls
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
    const originalPrompt = context.originalPrompt || [];

    const normalizedToolCalls = normalizeV2ToolCalls(toolCalls);

    // Extract real tool results from the original V2 prompt structure
    const toolResultsMap = extractToolResultsFromPromptV2(context.originalV2Prompt || []);

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
    setAttributeIfNotRedacted(span, Attr.GenAI.Prompt, JSON.stringify(sanitizeMultimodalContent(updatedPrompt)), RedactionKind.Prompts);
  }

  // Process tool calls and create child spans
  if (result.content && result.content.length > 0) {
    await processToolCallsAndCreateSpansV2(span, result.content);
  } else if (result.finishReason) {
    // For non-tool responses, still create completion array
    const completion = createSimpleCompletion({
      text: '',
    });
    setAttributeIfNotRedacted(span, Attr.GenAI.Completion, JSON.stringify(completion), RedactionKind.Completions);
  }

  // Store finish reason separately as per semantic conventions (only on first call to prevent overwriting)
  if (result.finishReason && !alreadySet) {
    span.setAttribute(Attr.GenAI.Response.FinishReasons, JSON.stringify([result.finishReason]));
  }
}

async function processToolCallsAndCreateSpansV2(
  parentSpan: Span,
  content: Array<LanguageModelV2Content>,
): Promise<void> {
  // Extract text and tool calls from content
  const textContent = content.find((c) => c.type === 'text');
  const assistantText = textContent?.type === 'text' ? textContent.text : undefined;
  const toolCalls = content.filter((c) => c.type === 'tool-call') as LanguageModelV2ToolCall[];

  // Only set completion for final responses without tool calls
  if (toolCalls.length === 0) {
    // Create completion with multimodal content support
    const completion = [
      {
        role: 'assistant' as const,
        content: sanitizeMultimodalContent(
          content.length === 1 && assistantText ? assistantText : content,
        ),
      },
    ];

    // Set completion array as span attribute
    setAttributeIfNotRedacted(parentSpan, Attr.GenAI.Completion, JSON.stringify(completion), RedactionKind.Completions);
  }
}
