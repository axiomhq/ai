/**
 * OpenTelemetry integration for Axiom AI
 * 
 * This module provides OpenTelemetry instrumentation for AI SDK models and tools,
 * including support for completion array formatting with tool calls.
 */

// Core functionality
export { initAxiomAI, AxiomAIResources } from './shared';
export { createStartActiveSpan } from './startActiveSpan';
export { withSpan } from './withSpan';
export { WITHSPAN_BAGGAGE_KEY } from './withSpanBaggageKey';

// Model wrappers
export { AxiomWrappedLanguageModelV1, isLanguageModelV1 } from './AxiomWrappedLanguageModelV1';
export { AxiomWrappedLanguageModelV2, isLanguageModelV2 } from './AxiomWrappedLanguageModelV2';

// Vercel AI SDK integration
export { wrapAISDKModel } from './vercel';

// Types
export type { GenAIOperation } from './shared';
export type {
  OpenAIMessage,
  OpenAISystemMessage,
  OpenAIUserMessage,
  OpenAIAssistantMessage,
  OpenAIToolMessage,
  OpenAIUserContentPart,
  OpenAIAssistantContentPart,
  OpenAIFinishReason,
  OpenAIChoice,
  OpenAICompletion,
  OpenAIToolCall,
} from './vercelTypes';

// Completion array types and utilities
export type {
  CompletionArray,
  CompletionArrayMessage,
  CompletionAssistantMessage,
  CompletionToolMessage,
  CompletionUserMessage,
  CompletionSystemMessage,
  CompletionToolCall,
  ToolCallMetadata,
  FormatToolCallsOptions,
  FormattedCompletionResult,
} from './completionTypes';

export {
  formatToolCallsInCompletion,
  formatV1ToolCallsInCompletion,
  formatV2ToolCallsInCompletion,
  aggregateStreamingToolCalls,
  createToolCallMetadata,
} from './completionUtils';

// Semantic conventions
export { Attr } from './semconv/attributes';
