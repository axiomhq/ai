import type { LanguageModelV1FunctionToolCall } from '@ai-sdk/providerv1';
import type { NormalizedToolCall } from '../otel/utils/normalized';
import type { LanguageModelV2Prompt } from '@ai-sdk/providerv2';
import type { LanguageModelV3Prompt } from '@ai-sdk/providerv3';
import type { OpenAIMessage } from '../otel/vercelTypes';

export type ToolResultMap = Map<string, unknown>;

/**
 * Appends tool calls and their results to a conversation prompt.
 *
 * This function takes an existing conversation prompt and adds:
 * 1. An assistant message containing the tool calls
 * 2. Tool result messages for each tool call with results
 *
 * @param prompt - The existing conversation prompt
 * @param toolCalls - The tool calls made by the assistant
 * @param toolResults - Map of tool names to their results
 * @param assistantContent - Optional assistant message content to include with tool calls
 * @returns Updated prompt with tool calls and results appended
 */
export function appendToolCalls(
  prompt: OpenAIMessage[],
  toolCalls: LanguageModelV1FunctionToolCall[] | NormalizedToolCall[],
  toolResults: ToolResultMap,
  assistantContent?: string | null,
): OpenAIMessage[] {
  const updatedPrompt = [...prompt];

  // Add assistant message with tool calls
  updatedPrompt.push({
    role: 'assistant',
    content: assistantContent || null,
    tool_calls: toolCalls.map((toolCall) => ({
      id: toolCall.toolCallId,
      function: {
        name: toolCall.toolName,
        arguments:
          typeof toolCall.args === 'string' ? toolCall.args : JSON.stringify(toolCall.args),
      },
      type: 'function',
    })),
  });

  // Add tool result messages with real data
  for (const toolCall of toolCalls) {
    const realToolResult = toolResults.get(toolCall.toolName);

    if (realToolResult) {
      updatedPrompt.push({
        role: 'tool',
        tool_call_id: toolCall.toolCallId,
        content: JSON.stringify(realToolResult),
      });
    }
  }

  return updatedPrompt;
}

/**
 * Extracts tool results from a raw prompt array.
 *
 * Searches through different message formats to find tool results:
 * - Google AI format: user messages with functionResponse parts
 * - OpenAI format: tool role messages (future enhancement)
 *
 * @param rawPrompt - The raw prompt array from the model provider
 * @returns Map of tool names to their results
 */
// TODO: @cje - This should be typed based on the specific provider's raw prompt format
// but it needs to handle multiple providers (Google AI, OpenAI, etc.)
export function extractToolResultsFromRawPrompt(rawPrompt: any[]): Map<string, unknown> {
  const toolResultsMap = new Map<string, unknown>();

  if (!Array.isArray(rawPrompt)) {
    return toolResultsMap;
  }

  // Look for tool results in different message formats
  for (const message of rawPrompt) {
    // Google AI format: user message with functionResponse parts
    if (message?.role === 'user' && Array.isArray(message.parts)) {
      for (const part of message.parts) {
        if (part?.functionResponse) {
          const functionResponse = part.functionResponse;
          if (functionResponse.name && functionResponse.response) {
            // Store by function name since that's what we have access to
            toolResultsMap.set(
              functionResponse.name,
              functionResponse.response.content || functionResponse.response,
            );
          }
        }
      }
    }

    // OpenAI format: tool role messages with tool_call_id
    if (message?.role === 'tool' && message?.tool_call_id && message?.content) {
      // For OpenAI format, we'd need to map back from tool_call_id to tool name
      // This is more complex as we'd need to track the tool calls first
      // For now, we'll skip this but it could be implemented later
    }
  }

  return toolResultsMap;
}

/**
 * Extracts tool results from a V2 prompt structure.
 *
 * V2 prompts use a "parts" array structure where:
 * - Tool calls are in assistant messages as 'tool-call' parts
 * - Tool results are in 'tool' role messages as 'tool-result' parts with 'output' property
 *
 * @param prompt - The V2 prompt array
 * @returns Map of tool names to their results
 */
export function extractToolResultsFromPromptV2(
  prompt: LanguageModelV2Prompt,
): Map<string, unknown> {
  const idToName = new Map<string, string>();
  const results = new Map<string, unknown>();

  // 1. Collect tool-call ids → names from assistant messages
  for (const message of prompt) {
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === 'tool-call') {
          idToName.set(part.toolCallId, part.toolName);
        }
      }
    }
  }

  // 2. Collect tool results from tool role messages
  for (const message of prompt) {
    if (message.role === 'tool' && Array.isArray(message.content)) {
      for (const part of message.content) {
        // In V2, tool result parts have toolCallId and result properties
        if (part.toolCallId && part.output !== undefined) {
          const toolName = idToName.get(part.toolCallId);
          if (toolName) {
            results.set(toolName, part.output);
          }
        }
      }
    }
  }

  return results;
}

/**
 * Extracts tool results from a V3 prompt structure.
 *
 * V3 prompts are very similar to V2 but with slightly different typing:
 * - Tool calls are in assistant messages as 'tool-call' parts
 * - Tool results are in 'tool' role messages as 'tool-result' parts with 'output' property
 * - Also includes 'tool-approval-response' parts which we skip
 *
 * @param prompt - The V3 prompt array
 * @returns Map of tool names to their results
 */
export function extractToolResultsFromPromptV3(
  prompt: LanguageModelV3Prompt,
): Map<string, unknown> {
  const idToName = new Map<string, string>();
  const results = new Map<string, unknown>();

  // 1. Collect tool-call ids → names from assistant messages
  for (const message of prompt) {
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === 'tool-call') {
          idToName.set(part.toolCallId, part.toolName);
        }
      }
    }
  }

  // 2. Collect tool results from tool role messages
  for (const message of prompt) {
    if (message.role === 'tool' && Array.isArray(message.content)) {
      for (const part of message.content) {
        // In V3, tool result parts have toolCallId and output properties
        // Skip tool-approval-response parts
        if (part.type === 'tool-result' && part.toolCallId && part.output !== undefined) {
          const toolName = idToName.get(part.toolCallId);
          if (toolName) {
            results.set(toolName, part.output);
          }
        }
      }
    }
  }

  return results;
}
