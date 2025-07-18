/**
 * Types for completion array format including tool calls and metadata
 * Based on the completion array structure from TODO.md
 */

import type { OpenAIMessage } from './vercelTypes';

/**
 * Base message with timestamp for completion array
 */
export interface CompletionMessage {
  /** ISO 8601 timestamp when message was created */
  timestamp?: string;
}

/**
 * User message in completion array
 */
export interface CompletionUserMessage extends CompletionMessage {
  role: 'user';
  content: string;
}

/**
 * Assistant message in completion array
 */
export interface CompletionAssistantMessage extends CompletionMessage {
  role: 'assistant';
  content: string | null;
  tool_calls?: CompletionToolCall[];
}

/**
 * Tool result message in completion array
 */
export interface CompletionToolMessage extends CompletionMessage {
  role: 'tool';
  content: string;
  tool_call_id: string;
  metadata?: ToolCallMetadata;
}

/**
 * System message in completion array
 */
export interface CompletionSystemMessage extends CompletionMessage {
  role: 'system';
  content: string;
}

/**
 * Tool call within an assistant message
 */
export interface CompletionToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

/**
 * Metadata for tool execution
 */
export interface ToolCallMetadata {
  /** ISO 8601 timestamp when tool execution started */
  start_time: string;
  /** ISO 8601 timestamp when tool execution ended */
  end_time: string;
  /** Execution time in milliseconds */
  duration_ms: number;
  /** Execution status */
  status: 'ok' | 'error' | 'timeout' | 'cancelled';
  /** Error message if status !== "ok" */
  error_message?: string;
  /** Link to child span for cross-referencing */
  span_id?: string;
  /** Tokens used if tool uses LLM */
  tokens_used?: number;
}

/**
 * Union of all completion message types
 */
export type CompletionArrayMessage =
  | CompletionUserMessage
  | CompletionAssistantMessage
  | CompletionToolMessage
  | CompletionSystemMessage;

/**
 * Complete array of messages in conversation flow
 */
export type CompletionArray = CompletionArrayMessage[];

/**
 * Parameters for formatting tool calls in completion array
 */
export interface FormatToolCallsOptions {
  /** Messages from the prompt/conversation history */
  promptMessages?: OpenAIMessage[];
  /** Assistant response text content */
  text?: string;
  /** Tool calls made by the assistant */
  toolCalls?: {
    id: string;
    toolName: string;
    args: string; // JSON string
  }[];
  /** Tool results to include */
  toolResults?: {
    toolCallId: string;
    result: unknown;
    metadata?: ToolCallMetadata;
  }[];
  /** Whether to include timestamps */
  includeTimestamps?: boolean;
}

/**
 * Result of formatting tool calls in completion array
 */
export interface FormattedCompletionResult {
  /** Complete conversation array including tool calls */
  completion: CompletionArray;
  /** Assistant message with tool calls */
  assistantMessage: CompletionAssistantMessage;
  /** Tool result messages */
  toolMessages: CompletionToolMessage[];
}
