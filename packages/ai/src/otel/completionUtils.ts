/**
 * Utility functions for formatting tool calls in completion array format
 */

import type { LanguageModelV1FunctionToolCall } from '@ai-sdk/providerv1';
import type { OpenAIMessage } from './vercelTypes';
import type {
  CompletionArray,
  CompletionArrayMessage,
  CompletionAssistantMessage,
  CompletionToolMessage,
  CompletionUserMessage,
  CompletionSystemMessage,
  FormatToolCallsOptions,
  FormattedCompletionResult,
  ToolCallMetadata,
} from './completionTypes';

/**
 * Creates an ISO 8601 timestamp for the current time
 */
function createTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Converts OpenAI messages to completion array format with timestamps
 */
function convertToCompletionMessages(
  messages: OpenAIMessage[],
  includeTimestamps = true,
): CompletionArrayMessage[] {
  const timestamp = includeTimestamps ? createTimestamp() : undefined;

  return messages.map((message): CompletionArrayMessage => {
    switch (message.role) {
      case 'system':
        return {
          role: 'system',
          content: message.content,
          timestamp,
        } as CompletionSystemMessage;

      case 'user':
        return {
          role: 'user',
          content:
            typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
          timestamp,
        } as CompletionUserMessage;

      case 'assistant':
        return {
          role: 'assistant',
          content: typeof message.content === 'string' ? message.content : message.content,
          tool_calls: message.tool_calls?.map((toolCall) => ({
            id: toolCall.id,
            type: 'function' as const,
            function: {
              name: toolCall.function.name,
              arguments: toolCall.function.arguments,
            },
          })),
          timestamp,
        } as CompletionAssistantMessage;

      case 'tool':
        return {
          role: 'tool',
          content: message.content,
          tool_call_id: message.tool_call_id,
          timestamp,
        } as CompletionToolMessage;

      default:
        throw new Error(`Unknown message role: ${(message as any).role}`);
    }
  });
}

/**
 * Creates tool result messages from tool execution results
 */
function createToolResultMessages(
  toolResults: Array<{
    toolCallId: string;
    result: unknown;
    metadata?: ToolCallMetadata;
  }>,
  includeTimestamps = true,
): CompletionToolMessage[] {
  const timestamp = includeTimestamps ? createTimestamp() : undefined;

  return toolResults.map((result) => ({
    role: 'tool' as const,
    content: typeof result.result === 'string' ? result.result : JSON.stringify(result.result),
    tool_call_id: result.toolCallId,
    metadata: result.metadata,
    timestamp,
  }));
}

/**
 * Main function to format tool calls in completion array format
 * Transforms AI SDK tool calls into the completion array structure
 */
export function formatToolCallsInCompletion(
  options: FormatToolCallsOptions,
): FormattedCompletionResult {
  const {
    promptMessages = [],
    text,
    toolCalls = [],
    toolResults = [],
    includeTimestamps = true,
  } = options;

  const timestamp = includeTimestamps ? createTimestamp() : undefined;

  // Convert prompt messages to completion format
  const historyMessages = convertToCompletionMessages(promptMessages, includeTimestamps);

  // Create assistant message with tool calls
  const assistantMessage: CompletionAssistantMessage = {
    role: 'assistant',
    content: text ?? (toolCalls.length > 0 ? null : ''),
    timestamp,
  };

  // Add tool calls if present
  if (toolCalls.length > 0) {
    assistantMessage.tool_calls = toolCalls.map((toolCall) => ({
      id: toolCall.id,
      type: 'function' as const,
      function: {
        name: toolCall.toolName,
        arguments: toolCall.args,
      },
    }));
  }

  // Create tool result messages
  const toolMessages = createToolResultMessages(toolResults, includeTimestamps);

  // Build complete completion array
  const completion: CompletionArray = [...historyMessages, assistantMessage, ...toolMessages];

  return {
    completion,
    assistantMessage,
    toolMessages,
  };
}

/**
 * Creates a simple completion array with just assistant text response
 * Used for V1 model wrapper where tool calls are handled separately
 */
export function createSimpleCompletion({
  promptMessages = [],
  text,
  includeTimestamps = true,
}: {
  promptMessages?: OpenAIMessage[];
  text?: string;
  includeTimestamps?: boolean;
}): CompletionArray {
  const timestamp = includeTimestamps ? createTimestamp() : undefined;

  // Convert prompt messages
  const historyMessages = convertToCompletionMessages(promptMessages, includeTimestamps);

  // Create assistant message with text only
  const assistantMessage: CompletionAssistantMessage = {
    role: 'assistant',
    content: text ?? '',
    timestamp,
  };

  return [...historyMessages, assistantMessage];
}

/**
 * Formats V2 tool calls for completion array
 * Convenience function for V2 model wrapper
 */
export function formatV2ToolCallsInCompletion({
  promptMessages = [],
  text,
  toolCalls = [],
  includeTimestamps = true,
}: {
  promptMessages?: OpenAIMessage[];
  text?: string;
  toolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    args: unknown;
  }>;
  includeTimestamps?: boolean;
}): CompletionArray {
  const timestamp = includeTimestamps ? createTimestamp() : undefined;

  // Convert prompt messages
  const historyMessages = convertToCompletionMessages(promptMessages, includeTimestamps);

  // Create assistant message
  const assistantMessage: CompletionAssistantMessage = {
    role: 'assistant',
    content: text ?? (toolCalls.length > 0 ? null : ''),
    timestamp,
  };

  // Add tool calls if present
  if (toolCalls.length > 0) {
    assistantMessage.tool_calls = toolCalls.map((toolCall) => ({
      id: toolCall.toolCallId,
      type: 'function' as const,
      function: {
        name: toolCall.toolName,
        arguments:
          typeof toolCall.args === 'string' ? toolCall.args : JSON.stringify(toolCall.args),
      },
    }));
  }

  return [...historyMessages, assistantMessage];
}

/**
 * Aggregates tool call chunks for streaming responses
 * Handles partial tool calls and builds complete tool call objects
 */
export function aggregateStreamingToolCalls(
  chunks: Array<{
    toolCallId?: string;
    toolName?: string;
    argsTextDelta?: string;
  }>,
): LanguageModelV1FunctionToolCall[] {
  const toolCallMap = new Map<
    string,
    {
      toolCallId: string;
      toolName: string;
      args: string;
    }
  >();

  for (const chunk of chunks) {
    if (!chunk.toolCallId) continue;

    const existing = toolCallMap.get(chunk.toolCallId);
    if (existing) {
      // Append args delta
      existing.args += chunk.argsTextDelta || '';
    } else {
      // Create new tool call entry
      toolCallMap.set(chunk.toolCallId, {
        toolCallId: chunk.toolCallId,
        toolName: chunk.toolName || '',
        args: chunk.argsTextDelta || '',
      });
    }
  }

  return Array.from(toolCallMap.values()).map((call) => ({
    ...call,
    toolCallType: 'function' as const,
  }));
}

/**
 * Creates tool call metadata with timing information
 */
export function createToolCallMetadata({
  startTime,
  endTime,
  status = 'ok',
  errorMessage,
  spanId,
  tokensUsed,
}: {
  startTime: Date;
  endTime: Date;
  status?: 'ok' | 'error' | 'timeout' | 'cancelled';
  errorMessage?: string;
  spanId?: string;
  tokensUsed?: number;
}): ToolCallMetadata {
  return {
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    duration_ms: endTime.getTime() - startTime.getTime(),
    status,
    error_message: errorMessage,
    span_id: spanId,
    tokens_used: tokensUsed,
  };
}
