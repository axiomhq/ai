import {
  type LanguageModelV1,
  type LanguageModelV1CallOptions,
  type LanguageModelV1Prompt,
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
  type LanguageModelV2Prompt,
} from '@ai-sdk/providerv2';
import {
  type LanguageModelV3,
  type LanguageModelV3CallOptions,
  type LanguageModelV3Middleware,
  type LanguageModelV3StreamPart,
  type LanguageModelV3Content,
  type LanguageModelV3ToolCall,
  type LanguageModelV3Usage,
  type LanguageModelV3ResponseMetadata,
  type LanguageModelV3FinishReason,
  type LanguageModelV3Prompt,
} from '@ai-sdk/providerv3';
import { type LanguageModelV1Middleware } from 'aiv4';

import { type Span } from '@opentelemetry/api';
import { Attr } from './semconv/attributes';
import { createSimpleCompletion } from './completionUtils';
import {
  appendToolCalls,
  extractToolResultsFromPromptV2,
  extractToolResultsFromPromptV3,
  extractToolResultsFromRawPrompt,
} from '../util/promptUtils';
import { sanitizeMultimodalContent } from './utils/contentSanitizer';
import {
  setScopeAttributes,
  setBaseAttributes,
  setRequestParameterAttributes,
  withSpanHandling,
  determineOutputTypeV1,
  determineOutputTypeV2,
  determineOutputTypeV3,
  classifyToolError,
  createStreamChildSpan,
  ensureNumber,
  type GenAiSpanContextV1,
  type GenAiSpanContextV2,
  type GenAiSpanContextV3,
} from './utils/wrapperUtils';
import {
  promptV1ToOpenAI,
  promptV2ToOpenAI,
  promptV3ToOpenAI,
  normalizeV1ToolCalls,
  normalizeV2ToolCalls,
  normalizeV3ToolCalls,
} from './utils/normalized';
import {
  ToolCallAggregator,
  TextAggregator,
  StreamStats,
  ToolCallAggregatorV2,
  TextAggregatorV2,
  StreamStatsV2,
  ToolCallAggregatorV3,
  TextAggregatorV3,
  StreamStatsV3,
} from './streaming/aggregators';
import type { AxiomPromptMetadata } from '../types/metadata';
import { getRedactionPolicy, handleMaybeRedactedAttribute } from './utils/redaction';

export interface AxiomTelemetryConfig {
  // Future configuration options can be added here
}

const appendPromptMetadataToSpan = (
  span: Span,
  messages: LanguageModelV1Prompt | LanguageModelV2Prompt | LanguageModelV3Prompt,
) => {
  const lastMessage = messages?.[messages.length - 1];

  let axiomMeta: AxiomPromptMetadata | undefined;

  if ('providerMetadata' in lastMessage) {
    axiomMeta = lastMessage?.providerMetadata?._axiomMeta as AxiomPromptMetadata | undefined;
  } else if ('providerOptions' in lastMessage) {
    axiomMeta = lastMessage?.providerOptions?._axiomMeta as AxiomPromptMetadata | undefined;
  }

  if (axiomMeta) {
    if (axiomMeta.id) span.setAttribute(Attr.GenAI.PromptMetadata.ID, axiomMeta.id);
    if (axiomMeta.name) span.setAttribute(Attr.GenAI.PromptMetadata.Name, axiomMeta.name);
    if (axiomMeta.slug) span.setAttribute(Attr.GenAI.PromptMetadata.Slug, axiomMeta.slug);
    if (axiomMeta.version) span.setAttribute(Attr.GenAI.PromptMetadata.Version, axiomMeta.version);
  }
};

/**
 * Creates Axiom telemetry middleware for LanguageModelV1
 */
export function axiomAIMiddlewareV1(/* _config?: AxiomTelemetryConfig */): LanguageModelV1Middleware {
  return {
    wrapGenerate: async ({ doGenerate, params, model }) => {
      return withSpanHandling(
        model.modelId,
        async (span, commonContext, _lease) => {
          const context = commonContext as GenAiSpanContextV1;

          appendPromptMetadataToSpan(span, params.prompt);

          // Pre-call setup
          setScopeAttributes(span);
          setPreCallAttributesV1(span, params, context, model);

          const res = await doGenerate();

          // Store rawCall data in context for access in post-call processing
          context.rawCall = res.rawCall as { rawPrompt?: any[]; rawSettings?: any };

          // Post-call processing
          await setPostCallAttributesV1(span, res, context, model);

          return res;
        },
        { version: 'v1' },
      );
    },

    wrapStream: async ({ doStream, params, model }) => {
      return withSpanHandling(
        model.modelId,
        async (span, commonContext, lease) => {
          const context = commonContext as GenAiSpanContextV1;

          appendPromptMetadataToSpan(span, params.prompt);

          // Pre-call setup
          setScopeAttributes(span);
          setPreCallAttributesV1(span, params, context, model);

          const { stream, ...head } = await doStream();

          // Create child span for stream processing (provides granular visibility)
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
                    classifyToolError(err, childSpan);
                    childSpan.end();
                    if (lease.owned) lease.end();
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
                    if (lease.owned) lease.end();
                    controller.terminate();
                  } catch (err) {
                    classifyToolError(err, childSpan);
                    childSpan.end();
                    if (lease.owned) lease.end();
                    controller.error(err);
                  }
                },
              }),
            ),
          };
        },
        { streaming: true, version: 'v1' }, // Don't auto-end span, we'll end it when stream completes
      );
    },
  };
}

/**
 * Creates unified Axiom telemetry middleware that works with V1, V2 and V3 models
 */
export function axiomAIMiddleware(config: { model: LanguageModelV1 }): LanguageModelV1Middleware;
export function axiomAIMiddleware(config: { model: LanguageModelV2 }): LanguageModelV2Middleware;
export function axiomAIMiddleware(config: { model: LanguageModelV3 }): LanguageModelV3Middleware;
export function axiomAIMiddleware(config: {
  model: LanguageModelV1 | LanguageModelV2 | LanguageModelV3;
}) {
  if (config.model.specificationVersion === 'v1') {
    return axiomAIMiddlewareV1();
  } else if (config.model.specificationVersion === 'v2') {
    return axiomAIMiddlewareV2();
  } else if (config.model.specificationVersion === 'v3') {
    return axiomAIMiddlewareV3();
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
      return withSpanHandling(
        model.modelId,
        async (span, commonContext, _lease) => {
          const context = commonContext as GenAiSpanContextV2;

          appendPromptMetadataToSpan(span, params.prompt);

          // Pre-call setup
          setScopeAttributes(span);
          setPreCallAttributesV2(span, params, context, model);

          const res = await doGenerate();

          // Post-call processing
          await setPostCallAttributesV2(span, res, context, model);

          return res;
        },
        { version: 'v2' },
      );
    },

    wrapStream: async ({ doStream, params, model }) => {
      return withSpanHandling(
        model.modelId,
        async (span, commonContext, lease) => {
          const context = commonContext as GenAiSpanContextV2;

          appendPromptMetadataToSpan(span, params.prompt);

          // Pre-call setup
          setScopeAttributes(span);
          setPreCallAttributesV2(span, params, context, model);

          const ret = await doStream();

          // Create child span for stream processing (provides granular visibility)
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
                    classifyToolError(err, childSpan);
                    childSpan.end();
                    if (lease.owned) lease.end();
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
                    if (lease.owned) lease.end();
                    controller.terminate();
                  } catch (err) {
                    classifyToolError(err, childSpan);
                    childSpan.end();
                    if (lease.owned) lease.end();
                    controller.error(err);
                  }
                },
              }),
            ),
          };
        },
        { streaming: true, version: 'v2' }, // Don't auto-end span, we'll end it when stream completes
      );
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
  const redactionPolicy = getRedactionPolicy();

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

  handleMaybeRedactedAttribute(
    span,
    Attr.GenAI.Input.Messages,
    JSON.stringify(sanitizeMultimodalContent(processedPrompt)),
    redactionPolicy.captureMessageContent,
  );

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
  const redactionPolicy = getRedactionPolicy();

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

    handleMaybeRedactedAttribute(
      span,
      Attr.GenAI.Input.Messages,
      JSON.stringify(sanitizeMultimodalContent(updatedPrompt)),
      redactionPolicy.captureMessageContent,
    );
  }

  // Create simple completion array with just assistant text
  if (result.text) {
    const completion = createSimpleCompletion({
      text: result.text,
    });
    handleMaybeRedactedAttribute(
      span,
      Attr.GenAI.Output.Messages,
      JSON.stringify(completion),
      redactionPolicy.captureMessageContent,
    );
  }

  if (result.response?.id) {
    span.setAttribute(Attr.GenAI.Response.ID, result.response.id);
  }
  if (result.response?.modelId) {
    span.setAttribute(Attr.GenAI.Response.Model, result.response.modelId);
  }

  const inputTokens = ensureNumber(result.usage?.promptTokens);
  if (inputTokens !== undefined) {
    span.setAttribute(Attr.GenAI.Usage.InputTokens, inputTokens);
  }

  const outputTokens = ensureNumber(result.usage?.completionTokens);
  if (outputTokens !== undefined) {
    span.setAttribute(Attr.GenAI.Usage.OutputTokens, outputTokens);
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
  const redactionPolicy = getRedactionPolicy();

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

  handleMaybeRedactedAttribute(
    span,
    Attr.GenAI.Input.Messages,
    JSON.stringify(sanitizeMultimodalContent(processedPrompt)),
    redactionPolicy.captureMessageContent,
  );
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
  const redactionPolicy = getRedactionPolicy();

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

    const inputTokens = ensureNumber(result.usage?.inputTokens);
    if (inputTokens !== undefined) {
      span.setAttribute(Attr.GenAI.Usage.InputTokens, inputTokens);
    }

    const outputTokens = ensureNumber(result.usage?.outputTokens);
    if (outputTokens !== undefined) {
      span.setAttribute(Attr.GenAI.Usage.OutputTokens, outputTokens);
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
    handleMaybeRedactedAttribute(
      span,
      Attr.GenAI.Input.Messages,
      JSON.stringify(sanitizeMultimodalContent(updatedPrompt)),
      redactionPolicy.captureMessageContent,
    );
  }

  // Process tool calls and create child spans
  if (result.content && result.content.length > 0) {
    await processToolCallsAndCreateSpansV2(span, result.content);
  } else if (result.finishReason) {
    // For non-tool responses, still create completion array
    const completion = createSimpleCompletion({
      text: '',
    });
    handleMaybeRedactedAttribute(
      span,
      Attr.GenAI.Output.Messages,
      JSON.stringify(completion),
      redactionPolicy.captureMessageContent,
    );
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
  const redactionPolicy = getRedactionPolicy();

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
    handleMaybeRedactedAttribute(
      parentSpan,
      Attr.GenAI.Output.Messages,
      JSON.stringify(completion),
      redactionPolicy.captureMessageContent,
    );
  }
}

/**
 * Creates Axiom telemetry middleware for LanguageModelV3
 */
export function axiomAIMiddlewareV3(/* _config?: AxiomTelemetryConfig */): LanguageModelV3Middleware {
  return {
    specificationVersion: 'v3',

    wrapGenerate: async ({ doGenerate, params, model }) => {
      return withSpanHandling(
        model.modelId,
        async (span, commonContext, _lease) => {
          const context = commonContext as GenAiSpanContextV3;

          appendPromptMetadataToSpan(span, params.prompt);

          // Pre-call setup
          setScopeAttributes(span);
          setPreCallAttributesV3(span, params, context, model);

          const res = await doGenerate();

          // Post-call processing
          await setPostCallAttributesV3(span, res, context, model);

          return res;
        },
        { version: 'v3' },
      );
    },

    wrapStream: async ({ doStream, params, model }) => {
      return withSpanHandling(
        model.modelId,
        async (span, commonContext, lease) => {
          const context = commonContext as GenAiSpanContextV3;

          appendPromptMetadataToSpan(span, params.prompt);

          // Pre-call setup
          setScopeAttributes(span);
          setPreCallAttributesV3(span, params, context, model);

          const ret = await doStream();

          // Create child span for stream processing (provides granular visibility)
          const childSpan = createStreamChildSpan(span, `chat ${model.modelId} stream`);

          const stats = new StreamStatsV3();
          const toolAggregator = new ToolCallAggregatorV3();
          const textAggregator = new TextAggregatorV3();

          return {
            ...ret,
            stream: ret.stream.pipeThrough(
              new TransformStream({
                transform(chunk: LanguageModelV3StreamPart, controller) {
                  try {
                    stats.feed(chunk);
                    toolAggregator.handleChunk(chunk);
                    textAggregator.feed(chunk);

                    controller.enqueue(chunk);
                  } catch (err) {
                    classifyToolError(err, childSpan);
                    childSpan.end();
                    if (lease.owned) lease.end();
                    controller.error(err);
                  }
                },
                async flush(controller) {
                  try {
                    const statsResult = stats.result;

                    await setPostCallAttributesV3(
                      span,
                      {
                        response: statsResult.response,
                        finishReason: statsResult.finishReason,
                        usage: statsResult.usage,
                        content:
                          toolAggregator.result.length > 0
                            ? toolAggregator.result
                            : textAggregator.text
                              ? [{ type: 'text' as const, text: textAggregator.text }]
                              : [],
                        warnings: [],
                      },
                      context,
                      model,
                    );

                    childSpan.end();
                    if (lease.owned) lease.end();
                    controller.terminate();
                  } catch (err) {
                    classifyToolError(err, childSpan);
                    childSpan.end();
                    if (lease.owned) lease.end();
                    controller.error(err);
                  }
                },
              }),
            ),
          };
        },
        { streaming: true, version: 'v3' },
      );
    },
  };
}

// V3 helper functions
function setPreCallAttributesV3(
  span: Span,
  options: LanguageModelV3CallOptions,
  context: GenAiSpanContextV3,
  model: LanguageModelV3,
) {
  const redactionPolicy = getRedactionPolicy();

  setBaseAttributes(span, model.provider, model.modelId);

  const outputType = determineOutputTypeV3(options);
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

  const processedPrompt = promptV3ToOpenAI(options.prompt);

  // Store both the original V3 prompt and processed prompt for later use
  context.originalV3Prompt = options.prompt;
  context.originalPrompt = processedPrompt;

  handleMaybeRedactedAttribute(
    span,
    Attr.GenAI.Input.Messages,
    JSON.stringify(sanitizeMultimodalContent(processedPrompt)),
    redactionPolicy.captureMessageContent,
  );
}

async function setPostCallAttributesV3(
  span: Span,
  result: {
    response?: LanguageModelV3ResponseMetadata;
    finishReason?: LanguageModelV3FinishReason;
    usage?: LanguageModelV3Usage;
    content?: Array<LanguageModelV3Content>;
    warnings: Array<unknown>;
  },
  context: GenAiSpanContextV3,
  _model: LanguageModelV3,
) {
  const redactionPolicy = getRedactionPolicy();

  // Check if we have tool calls in this response
  const toolCalls = result.content?.filter(
    (c) => c.type === 'tool-call',
  ) as LanguageModelV3ToolCall[];

  // Only set response metadata once per span to prevent overwriting when generateText() makes multiple calls
  const alreadySet = (span as any).attributes?.[Attr.GenAI.Response.FinishReasons] !== undefined;

  if (!alreadySet) {
    if (result.response?.id) {
      span.setAttribute(Attr.GenAI.Response.ID, result.response.id);
    }
    if (result.response?.modelId) {
      span.setAttribute(Attr.GenAI.Response.Model, result.response.modelId);
    }

    // V3 has structured token usage - extract totals for OTel attributes
    // TODO: When OTel semantic conventions add support for cached/reasoning tokens,
    // add these attributes:
    // - result.usage?.inputTokens.cacheRead -> gen_ai.usage.cache_read_tokens (or similar)
    // - result.usage?.inputTokens.cacheWrite -> gen_ai.usage.cache_write_tokens (or similar)
    // - result.usage?.inputTokens.noCache -> gen_ai.usage.no_cache_tokens (or similar)
    // - result.usage?.outputTokens.reasoning -> gen_ai.usage.reasoning_tokens (or similar)
    // - result.usage?.outputTokens.text -> gen_ai.usage.text_tokens (or similar)
    // Access: result.usage?.inputTokens.cacheRead, result.usage?.outputTokens.reasoning, etc.
    const inputTokens = ensureNumber(result.usage?.inputTokens?.total);
    if (inputTokens !== undefined) {
      span.setAttribute(Attr.GenAI.Usage.InputTokens, inputTokens);
    }

    const outputTokens = ensureNumber(result.usage?.outputTokens?.total);
    if (outputTokens !== undefined) {
      span.setAttribute(Attr.GenAI.Usage.OutputTokens, outputTokens);
    }
  }

  // Update prompt to include tool calls and tool results if they exist
  if (toolCalls && toolCalls.length > 0) {
    const originalPrompt = context.originalPrompt || [];

    const normalizedToolCalls = normalizeV3ToolCalls(toolCalls);

    // Extract real tool results from the original V3 prompt structure
    const toolResultsMap = extractToolResultsFromPromptV3(context.originalV3Prompt || []);

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
    handleMaybeRedactedAttribute(
      span,
      Attr.GenAI.Input.Messages,
      JSON.stringify(sanitizeMultimodalContent(updatedPrompt)),
      redactionPolicy.captureMessageContent,
    );
  }

  // Process content and create completion
  if (result.content && result.content.length > 0) {
    await processToolCallsAndCreateSpansV3(span, result.content);
  } else if (result.finishReason) {
    // For non-tool responses, still create completion array
    const completion = createSimpleCompletion({
      text: '',
    });
    handleMaybeRedactedAttribute(
      span,
      Attr.GenAI.Output.Messages,
      JSON.stringify(completion),
      redactionPolicy.captureMessageContent,
    );
  }

  // Store finish reason - V3 uses { unified, raw } structure, use unified for OTel
  // TODO: When OTel adds support for raw finish reasons, consider adding:
  // - result.finishReason.raw -> gen_ai.response.raw_finish_reason (or similar)
  // Access: result.finishReason?.raw
  if (result.finishReason && !alreadySet) {
    span.setAttribute(
      Attr.GenAI.Response.FinishReasons,
      JSON.stringify([result.finishReason.unified]),
    );
  }
}

async function processToolCallsAndCreateSpansV3(
  parentSpan: Span,
  content: Array<LanguageModelV3Content>,
): Promise<void> {
  const redactionPolicy = getRedactionPolicy();

  // Extract text and tool calls from content
  const textContent = content.find((c) => c.type === 'text');
  const assistantText = textContent?.type === 'text' ? textContent.text : undefined;
  const toolCalls = content.filter((c) => c.type === 'tool-call') as LanguageModelV3ToolCall[];

  // TODO: When OTel adds support for tool approval flow, track these:
  // - tool-approval-request stream parts with approvalId, toolCallId
  // - tool-approval-response parts in tool messages
  // Access: content.filter(c => c.type === 'tool-approval-request')
  // Also track dynamic/providerExecuted flags on tool calls:
  // - toolCall.dynamic -> gen_ai.tool.dynamic (or similar)
  // - toolCall.providerExecuted -> gen_ai.tool.provider_executed (or similar)

  // Only set completion for final responses without tool calls
  if (toolCalls.length === 0) {
    // Create completion with multimodal content support
    // Filter out V3-specific content types that aren't text
    const sanitizableContent = content.filter(
      (c) =>
        c.type === 'text' ||
        c.type === 'reasoning' ||
        c.type === 'file' ||
        c.type === 'source' ||
        c.type === 'tool-result',
    );

    const completion = [
      {
        role: 'assistant' as const,
        content: sanitizeMultimodalContent(
          sanitizableContent.length === 1 && assistantText ? assistantText : sanitizableContent,
        ),
      },
    ];

    // Set completion array as span attribute
    handleMaybeRedactedAttribute(
      parentSpan,
      Attr.GenAI.Output.Messages,
      JSON.stringify(completion),
      redactionPolicy.captureMessageContent,
    );
  }
}
