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
  LanguageModelV2ToolResultOutput,
} from '@ai-sdk/providerv2';
import type {
  LanguageModelV3Prompt,
  LanguageModelV3ToolCall,
  LanguageModelV3TextPart,
  LanguageModelV3ToolCallPart,
  LanguageModelV3ToolResultOutput,
} from '@ai-sdk/providerv3';
import type { OpenAIMessage, OpenAIContentPart } from '../vercelTypes';

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
      typeof toolCall.input === 'string'
        ? toolCall.input.replace(/:\s+/g, ':')
        : JSON.stringify(toolCall.input),
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

/**
 * Normalizes a V3 tool call to the common format
 * V3 tool calls use `input` as a JSON string (similar to V2 but always string)
 */
function normalizeV3ToolCall(toolCall: LanguageModelV3ToolCall): NormalizedToolCall {
  return {
    toolCallId: toolCall.toolCallId,
    toolName: toolCall.toolName,
    args: toolCall.input, // V3 input is always a string
    toolCallType: 'function',
  };
}

/**
 * Normalizes an array of V3 tool calls
 */
export function normalizeV3ToolCalls(toolCalls: LanguageModelV3ToolCall[]): NormalizedToolCall[] {
  return toolCalls.map(normalizeV3ToolCall);
}

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
          content: message.content.map((part): OpenAIContentPart => {
            switch (part.type) {
              case 'text':
                return {
                  type: 'text',
                  text: part.text,
                };
              case 'image':
                return {
                  type: 'image_url',
                  image_url: {
                    url: part.image.toString(),
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
                      typeof part.input === 'string' ? part.input : JSON.stringify(part.input),
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
                };
              case 'image':
                return {
                  type: 'image_url',
                  image_url: {
                    url: part.image.toString(),
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
            content: formatV2ToolCallOutput(part.output),
          });
        }
        break;
    }
  }

  return results;
}

function formatV2ToolCallOutput(output: LanguageModelV2ToolResultOutput) {
  switch (output.type) {
    case 'text':
      return output.value;
    case 'json':
      return typeof output.value === 'string' ? output.value : JSON.stringify(output.value);
    case 'error-text':
      return output.value;
    case 'error-json':
      return typeof output.value === 'string' ? output.value : JSON.stringify(output.value);
    case 'content':
      return JSON.stringify(output.value);
  }
}

/**
 * Converts a V3 prompt to OpenAI message format
 * V3 is very similar to V2 but with slightly different type structure
 */
export function promptV3ToOpenAI(prompt: LanguageModelV3Prompt): OpenAIMessage[] {
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
          (part): part is LanguageModelV3TextPart => part.type === 'text',
        );
        const toolCalls = message.content.filter(
          (part): part is LanguageModelV3ToolCallPart => part.type === 'tool-call',
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
                    // V3 input can be unknown (usually object), convert to string
                    arguments:
                      typeof part.input === 'string' ? part.input : JSON.stringify(part.input),
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
                };
              case 'file':
                // V3 files - represent as text with media type info
                return {
                  type: 'text',
                  text: `[file: ${part.mediaType}]`,
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
          // Skip tool-approval-response parts - they don't have output
          if (part.type === 'tool-result') {
            results.push({
              role: 'tool',
              tool_call_id: part.toolCallId,
              content: formatV3ToolCallOutput(part.output),
            });
          }
        }
        break;
    }
  }

  return results;
}

function formatV3ToolCallOutput(output: LanguageModelV3ToolResultOutput) {
  switch (output.type) {
    case 'text':
      return output.value;
    case 'json':
      return typeof output.value === 'string' ? output.value : JSON.stringify(output.value);
    case 'error-text':
      return output.value;
    case 'error-json':
      return typeof output.value === 'string' ? output.value : JSON.stringify(output.value);
    case 'content':
      return JSON.stringify(output.value);
    case 'execution-denied':
      return output.reason ?? 'Execution denied';
  }
}
