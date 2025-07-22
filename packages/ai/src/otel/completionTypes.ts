/**
 * Types for completion array format
 * Now using OpenAI types directly to eliminate duplication
 */

import type { OpenAIMessage, OpenAIAssistantMessage, OpenAIToolMessage } from './vercelTypes';

/**
 * Complete array of messages in conversation flow
 * Uses OpenAI message types directly since completion and prompt structures are now identical
 */
export type CompletionArray = OpenAIMessage[];

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
  }[];
}

/**
 * Result of formatting tool calls in completion array
 */
export interface FormattedCompletionResult {
  /** Complete conversation array including tool calls */
  completion: CompletionArray;
  /** Assistant message with tool calls */
  assistantMessage: OpenAIAssistantMessage;
  /** Tool result messages */
  toolMessages: OpenAIToolMessage[];
}
