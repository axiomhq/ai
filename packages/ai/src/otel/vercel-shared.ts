import {
  type LanguageModelV1,
  type LanguageModelV1CallOptions,
  type LanguageModelV1Prompt,
  type LanguageModelV1FunctionToolCall,
  type LanguageModelV1FinishReason,
  type LanguageModelV1TextPart,
  type LanguageModelV1ToolCallPart,
  type LanguageModelV1ProviderMetadata,
} from '@ai-sdk/provider';

import { trace, propagation, type Span } from '@opentelemetry/api';
import { Attr } from './semconv/attributes';
import { createStartActiveSpan } from './startActiveSpan';
import { currentUnixTime } from '../util/currentUnixTime';
import { WITHSPAN_BAGGAGE_KEY } from './withSpanBaggageKey';
import { createGenAISpanName } from './shared';
import type { OpenAIMessage, OpenAIAssistantMessage } from './vercelTypes';

/**
 * Shared interfaces and types for OpenTelemetry span handling
 */
export interface SharedModelInfo {
  provider: string;
  modelId: string;
}

export interface SharedUsageInfo {
  promptTokens: number;
  completionTokens: number;
}

export interface SharedResultInfo {
  response?: { id?: string; modelId?: string };
  finishReason?: LanguageModelV1FinishReason;
  usage?: SharedUsageInfo;
  text?: string;
  toolCalls?: LanguageModelV1FunctionToolCall[];
  providerMetadata?: LanguageModelV1ProviderMetadata;
}

export interface SharedCallOptions {
  prompt: LanguageModelV1Prompt;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  seed?: number;
  stopSequences?: string[];
  responseFormat?: { type: string };
  inputFormat?: string;
  mode?: { type: string; tools?: any[]; toolChoice?: any };
  providerMetadata?: LanguageModelV1ProviderMetadata;
}

/**
 * Shared span lifecycle management
 */
export type SpanHandlerFunction<T> = (span: Span) => Promise<T>;

export async function withSpanHandling<T>(
  modelInfo: SharedModelInfo,
  operation: SpanHandlerFunction<T>,
): Promise<T> {
  const bag = propagation.getActiveBaggage();
  const isWithinWithSpan = bag?.getEntry(WITHSPAN_BAGGAGE_KEY)?.value === 'true';

  if (isWithinWithSpan) {
    // Reuse existing span created by withSpan
    const activeSpan = trace.getActiveSpan();
    if (!activeSpan) {
      throw new Error('Expected active span when within withSpan');
    }
    activeSpan.updateName(createSpanName(modelInfo.modelId));
    return operation(activeSpan);
  } else {
    // Create new span only if not within withSpan
    const tracer = trace.getTracer('@axiomhq/ai');
    const startActiveSpan = createStartActiveSpan(tracer);
    const name = createSpanName(modelInfo.modelId);

    return startActiveSpan(name, null, operation);
  }
}

/**
 * Shared span name generation
 */
export function createSpanName(modelId: string): string {
  return createGenAISpanName(Attr.GenAI.Operation.Name_Values.Chat, modelId);
}

/**
 * Shared scope attributes setting
 */
export function setScopeAttributes(span: Span): void {
  const bag = propagation.getActiveBaggage();

  // Set workflow and task attributes from baggage
  if (bag) {
    if (bag.getEntry('workflow')?.value) {
      span.setAttribute(Attr.GenAI.Operation.WorkflowName, bag.getEntry('workflow')!.value);
    }
    if (bag.getEntry('task')?.value) {
      span.setAttribute(Attr.GenAI.Operation.TaskName, bag.getEntry('task')!.value);
    }
  }
}

/**
 * Shared prompt processing utility
 */
export function postProcessPrompt(prompt: LanguageModelV1Prompt): OpenAIMessage[] {
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

/**
 * Shared completion formatting utility
 */
export function formatCompletion({
  text,
  toolCalls,
}: {
  text: string | undefined;
  toolCalls: LanguageModelV1FunctionToolCall[] | undefined;
}): OpenAIAssistantMessage {
  return {
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
  };
}

/**
 * Shared pre-call attributes setting
 */
export function setPreCallAttributes(
  span: Span,
  modelInfo: SharedModelInfo,
  options: SharedCallOptions,
): void {
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
    inputFormat,
    mode,
    providerMetadata,
  } = options;

  // Set prompt attributes (full conversation history)
  const processedPrompt = postProcessPrompt(prompt);
  span.setAttribute(Attr.GenAI.Prompt, JSON.stringify(processedPrompt));

  // Set request attributes
  span.setAttributes({
    [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
    [Attr.GenAI.Output.Type]: Attr.GenAI.Output.Type_Values.Text,
    [Attr.GenAI.Request.Model]: modelInfo.modelId,
    [Attr.GenAI.Provider]: modelInfo.provider,
    // TODO: there is currently no good way to get the system from the vercel sdk.
    // we would need a lookup table or regex stuff or similar. fragile either way.
    // @see: docs for `ATTR_GEN_AI_SYSTEM`)
    // [Attr.GenAI.System]: "_OTHER",
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

  // Set input format
  if (inputFormat) {
    span.setAttribute('gen_ai.request.input_format', inputFormat);
  }

  // Set mode information
  if (mode) {
    span.setAttribute('gen_ai.request.mode_type', mode.type);
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

  // Set provider metadata if present in request
  if (providerMetadata && Object.keys(providerMetadata).length > 0) {
    span.setAttribute('gen_ai.request.provider_metadata', JSON.stringify(providerMetadata));
  }
}

/**
 * Shared post-call attributes setting
 */
export function setPostCallAttributes(span: Span, result: SharedResultInfo): void {
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

  // Set provider metadata if available
  if (result.providerMetadata && Object.keys(result.providerMetadata).length > 0) {
    span.setAttribute(
      Attr.GenAI.Response.ProviderMetadata,
      JSON.stringify(result.providerMetadata),
    );
  }
}

/**
 * Shared streaming utilities
 */
export interface StreamingMetrics {
  timeToFirstToken?: number;
  usage?: SharedUsageInfo;
  fullText?: string;
  toolCallsMap: Record<string, LanguageModelV1FunctionToolCall>;
  finishReason?: LanguageModelV1FinishReason;
  responseId?: string;
  responseModelId?: string;
  responseProviderMetadata?: LanguageModelV1ProviderMetadata;
}

export function createStreamingMetrics(): StreamingMetrics {
  return {
    toolCallsMap: {},
  };
}

export function updateStreamingMetrics(
  metrics: StreamingMetrics,
  startTime: number,
  span: Span,
): void {
  // Track time to first token
  if (metrics.timeToFirstToken === undefined) {
    metrics.timeToFirstToken = currentUnixTime() - startTime;
    span.setAttribute('gen_ai.response.time_to_first_token', metrics.timeToFirstToken);
  }
}

export function finalizeStreamingResult(metrics: StreamingMetrics): SharedResultInfo {
  // Convert toolCallsMap to array for postProcessOutput
  const toolCallsArray: LanguageModelV1FunctionToolCall[] = Object.values(metrics.toolCallsMap);

  return {
    response:
      metrics.responseId || metrics.responseModelId
        ? {
            id: metrics.responseId,
            modelId: metrics.responseModelId,
          }
        : undefined,
    finishReason: metrics.finishReason,
    usage: metrics.usage,
    text: metrics.fullText,
    toolCalls: toolCallsArray.length > 0 ? toolCallsArray : undefined,
    providerMetadata: metrics.responseProviderMetadata,
  };
}

/**
 * Shared error handling utilities
 */
export function handleSpanError(span: Span, error: unknown): void {
  if (error instanceof Error) {
    span.recordException(error);
    span.setStatus({
      code: 2, // SpanStatusCode.ERROR
      message: error.message,
    });
  }
}

/**
 * Shared model validation utility
 */
export function isValidLanguageModel(model: any): model is LanguageModelV1 {
  return (
    model?.specificationVersion === 'v1' &&
    typeof model?.provider === 'string' &&
    typeof model?.modelId === 'string'
  );
}

/**
 * Shared model info extraction
 */
export function extractModelInfo(model: LanguageModelV1): SharedModelInfo {
  return {
    provider: model.provider,
    modelId: model.modelId,
  };
}

/**
 * Shared call options extraction for type safety
 */
export function extractCallOptions(options: LanguageModelV1CallOptions): SharedCallOptions {
  return {
    prompt: options.prompt,
    maxTokens: options.maxTokens,
    frequencyPenalty: options.frequencyPenalty,
    presencePenalty: options.presencePenalty,
    temperature: options.temperature,
    topP: options.topP,
    topK: options.topK,
    seed: options.seed,
    stopSequences: options.stopSequences,
    responseFormat: options.responseFormat,
    inputFormat: options.inputFormat,
    mode: options.mode,
    providerMetadata: options.providerMetadata,
  };
}
