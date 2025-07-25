/**
 * Utility functions for formatting tool calls in completion array format
 */

import type { LanguageModelV1FunctionToolCall } from '@ai-sdk/providerv1';
import { sanitizeMultimodalContent } from './utils/contentSanitizer';
import type {
  CompletionArray,
  FormatToolCallsOptions,
  FormattedCompletionResult,
} from './completionTypes';
import type { OpenAIMessage, OpenAIAssistantMessage, OpenAIToolMessage } from './vercelTypes';

/**
 * Converts OpenAI messages to completion array format
 */
function convertToCompletionMessages(messages: OpenAIMessage[]): OpenAIMessage[] {
  return messages.map((message): OpenAIMessage => {
    switch (message.role) {
      case 'system':
        return {
          role: 'system',
          content: message.content,
        };

      case 'user':
        return {
          role: 'user',
          content: sanitizeMultimodalContent(message.content) as string | any[],
        };

      case 'assistant':
        return {
          role: 'assistant',
          content: sanitizeMultimodalContent(message.content) as string | null,
          tool_calls: message.tool_calls?.map((toolCall) => ({
            id: toolCall.id,
            type: 'function' as const,
            function: {
              name: toolCall.function.name,
              arguments: toolCall.function.arguments,
            },
          })),
        };

      case 'tool':
        return {
          role: 'tool',
          content: message.content,
          tool_call_id: message.tool_call_id,
        };

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
  }>,
): OpenAIToolMessage[] {
  return toolResults.map((result) => ({
    role: 'tool' as const,
    content: typeof result.result === 'string' ? result.result : JSON.stringify(result.result),
    tool_call_id: result.toolCallId,
  }));
}

/**
 * Main function to format tool calls in completion array format
 * Transforms AI SDK tool calls into the completion array structure
 */
export function formatToolCallsInCompletion(
  options: FormatToolCallsOptions,
): FormattedCompletionResult {
  const { promptMessages = [], text, toolCalls = [], toolResults = [] } = options;

  // Convert prompt messages to completion format
  const historyMessages = convertToCompletionMessages(promptMessages);

  // Create assistant message with tool calls
  const assistantMessage: OpenAIAssistantMessage = {
    role: 'assistant',
    content: text ?? (toolCalls.length > 0 ? null : ''),
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
  const toolMessages = createToolResultMessages(toolResults);

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
export function createSimpleCompletion({ text }: { text?: string }): CompletionArray {
  // Create assistant message with text only
  const assistantMessage: OpenAIAssistantMessage = {
    role: 'assistant',
    content: text ?? '',
  };

  return [assistantMessage];
}

/**
 * Formats V2 tool calls for completion array
 * Convenience function for V2 model wrapper
 */
export function formatV2ToolCallsInCompletion({
  promptMessages = [],
  text,
  toolCalls = [],
}: {
  promptMessages?: OpenAIMessage[];
  text?: string;
  toolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    args: unknown;
  }>;
}): CompletionArray {
  // Convert prompt messages
  const historyMessages = convertToCompletionMessages(promptMessages);

  // Create assistant message
  const assistantMessage: OpenAIAssistantMessage = {
    role: 'assistant',
    content: text ?? (toolCalls.length > 0 ? null : ''),
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
