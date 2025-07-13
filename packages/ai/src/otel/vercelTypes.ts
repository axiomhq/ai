/**
 * OpenAI-compatible types derived from Vercel AI SDK Core types
 *
 * This file documents the structural differences between Vercel's Core types
 * and the pure OpenAI format needed for observability logging.
 */

import {
  type CoreAssistantMessage,
  type CoreUserMessage,
  type CoreSystemMessage,
  type CoreToolMessage,
  type FinishReason,
} from 'aiv4';

/**
 * OpenAI System Message - matches Core type exactly
 */
export type OpenAISystemMessage = CoreSystemMessage;

/**
 * User content part for multimodal messages
 * Based on OpenAI's content part structure
 */
export interface OpenAIUserContentPart {
  type: 'text' | 'image_url'; // Strict OpenAI spec types only
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto'; // Fixed: removed 'raw' to match OpenAI spec
  };
}

/**
 * Assistant content part for multimodal responses
 * Based on OpenAI's assistant content part structure
 */
export interface OpenAIAssistantContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

/**
 * OpenAI User Message - uses OpenAI content part structure
 * Differences: image_url type and additional properties for extensibility
 */
export type OpenAIUserMessage = Omit<CoreUserMessage, 'content'> & {
  content: OpenAIUserContentPart[] | string; // Allow string content or array of parts
};

/**
 * OpenAI Assistant Message - supports both text content and tool calls
 * Content can be string, null (for tool-only responses), or array of parts (multimodal)
 */
export type OpenAIAssistantMessage = Omit<CoreAssistantMessage, 'content'> & {
  content: string | null | OpenAIAssistantContentPart[]; // OpenAI supports multimodal assistant responses
  tool_calls?: OpenAIToolCall[]; // Array of tool calls made by the assistant
};

/**
 * OpenAI Tool Message - uses OpenAI field naming convention
 * Difference: tool_call_id (OpenAI) vs toolCallId (Vercel Core)
 *
 * Note: role is 'tool', content MUST be stringified JSON result
 * OpenAI spec: content is required and should contain the result of the tool call
 */
export type OpenAIToolMessage = Omit<CoreToolMessage, 'toolCallId' | 'content'> & {
  tool_call_id: string; // OpenAI uses snake_case
  content: string; // OpenAI requires stringified JSON result
};

/**
 * Union of all OpenAI message types for conversation history
 */
export type OpenAIMessage =
  | OpenAISystemMessage
  | OpenAIUserMessage
  | OpenAIAssistantMessage
  | OpenAIToolMessage;

/**
 * Extended finish reason enum that includes OpenAI-specific values
 * Note: Extends the base FinishReason from ai package with additional OpenAI values
 */
export type OpenAIFinishReason = FinishReason | 'tool_calls' | 'content_filter';

/**
 * OpenAI Choice - represents a single completion choice with finish reason
 * In the OpenAI API, finish_reason lives on the choice, not the message
 */
export interface OpenAIChoice {
  index: number;
  message: OpenAIAssistantMessage;
  finish_reason: OpenAIFinishReason; // Includes "tool_calls" and "content_filter"
}

/**
 * OpenAI Completion - Full completion response structure
 * Used for storing the final response in observability
 * For single-choice logging, you can just use the first choice
 */
export interface OpenAICompletion {
  choices: OpenAIChoice[];
}

/**
 * Tool Call structure matching OpenAI format
 * Note: This might differ from Vercel's internal tool call structure
 */
export interface OpenAIToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
  index?: number; // Optional index for streaming order preservation
}
