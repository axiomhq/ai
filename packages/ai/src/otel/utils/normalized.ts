import type {
  LanguageModelV1Prompt,
  LanguageModelV1FunctionToolCall,
  LanguageModelV1TextPart,
  LanguageModelV1ToolCallPart,
} from '@ai-sdk/providerv1';
import type {
  LanguageModelV2Prompt,
  LanguageModelV2ToolCall,
  LanguageModelV2TextPart,
  LanguageModelV2ToolCallPart,
} from '@ai-sdk/providerv2';
import type { OpenAIMessage, OpenAIUserContentPart } from '../vercelTypes';

/**
 * Normalized tool call interface that can represent both V1 and V2 tool calls
 */
export interface NormalizedToolCall {
  toolCallId: string;
  toolName: string;
  args: string; // Always a JSON string for consistency
  toolCallType: 'function';
}

/**
 * Normalized result interface for both V1 and V2 generation results
 */
export interface NormalizedResult {
  text?: string;
  toolCalls?: NormalizedToolCall[];
  response?: { id?: string; modelId?: string };
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
  finishReason?: string;
  providerMetadata?: any;
}

/**
 * Normalizes a V1 tool call to the common format
 */
function normalizeV1ToolCall(toolCall: LanguageModelV1FunctionToolCall): NormalizedToolCall {
  return {
    toolCallId: toolCall.toolCallId,
    toolName: toolCall.toolName,
    args: typeof toolCall.args === 'string' ? toolCall.args : JSON.stringify(toolCall.args),
    toolCallType: 'function',
  };
}

/**
 * Normalizes a V2 tool call to the common format
 */
function normalizeV2ToolCall(toolCall: LanguageModelV2ToolCall): NormalizedToolCall {
  return {
    toolCallId: toolCall.toolCallId,
    toolName: toolCall.toolName,
    args:
      typeof toolCall.args === 'string'
        ? toolCall.args.replace(/:\s+/g, ':') // Clean up spacing inconsistencies
        : JSON.stringify(toolCall.args),
    toolCallType: 'function',
  };
}

/**
 * Normalizes an array of V1 tool calls
 */
export function normalizeV1ToolCalls(
  toolCalls: LanguageModelV1FunctionToolCall[],
): NormalizedToolCall[] {
  return toolCalls.map(normalizeV1ToolCall);
}

/**
 * Normalizes an array of V2 tool calls
 */
export function normalizeV2ToolCalls(toolCalls: LanguageModelV2ToolCall[]): NormalizedToolCall[] {
  return toolCalls.map(normalizeV2ToolCall);
}

//////////////

/**
 * Converts a V1 prompt to OpenAI message format
 */
export function promptV1ToOpenAI(prompt: LanguageModelV1Prompt): OpenAIMessage[] {
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
          content: message.content.map((part): OpenAIUserContentPart => {
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
                // Convert unknown content types to text for compatibility
                return {
                  type: 'text',
                  text:
                    `[${part.type}]` +
                    (typeof part === 'object' && part !== null
                      ? JSON.stringify(part)
                      : String(part)),
                };
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
 * Converts a V2 prompt to OpenAI message format
 */
export function promptV2ToOpenAI(prompt: LanguageModelV2Prompt): OpenAIMessage[] {
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
        const textContent = message.content.find(
          (part): part is LanguageModelV2TextPart => part.type === 'text',
        );
        const toolCalls = message.content.filter(
          (part): part is LanguageModelV2ToolCallPart => part.type === 'tool-call',
        );

        results.push({
          role: 'assistant',
          content: textContent?.text || null,
          ...(toolCalls.length > 0
            ? {
                tool_calls: toolCalls.map((part) => ({
                  id: part.toolCallId,
                  function: {
                    name: part.toolName,
                    arguments:
                      typeof part.args === 'string' ? part.args : JSON.stringify(part.args),
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
          content: message.content.map((part: any) => {
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
 * Shared post-processing logic for updating prompts with tool calls and results
 * TODO: BEFORE MERGE - use or delete
 */
export function updatePromptWithToolCalls(
  originalPrompt: OpenAIMessage[],
  toolCalls: NormalizedToolCall[],
  toolResults: Map<string, unknown>,
  assistantText?: string | null,
): OpenAIMessage[] {
  const updatedPrompt = [...originalPrompt];

  // Add assistant message with tool calls
  updatedPrompt.push({
    role: 'assistant',
    content: assistantText || null,
    tool_calls: toolCalls.map((toolCall) => ({
      id: toolCall.toolCallId,
      function: {
        name: toolCall.toolName,
        arguments: toolCall.args,
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
