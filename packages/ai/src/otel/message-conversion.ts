/**
 * Message conversion utilities for AI SDK v5 support.
 *
 * This module provides conversion functions between v5 message formats and v4 formats
 * to enable telemetry and instrumentation of v5 models using the existing v4 infrastructure.
 *
 * Key conversions:
 * - v5 ModelMessage[] -> v4 LanguageModelV1Prompt
 * - v5 content types (FilePart, ReasoningPart) -> v4 equivalents
 * - v5 providerOptions -> v4 providerMetadata
 * - v4 completion format -> v5 completion format
 */

import type {
  LanguageModelV1Prompt,
  LanguageModelV1Message,
  LanguageModelV1TextPart,
  LanguageModelV1ImagePart,
  LanguageModelV1FilePart,
  LanguageModelV1ReasoningPart,
  LanguageModelV1ToolCallPart,
  LanguageModelV1ToolResultPart,
  LanguageModelV1FunctionToolCall,
  LanguageModelV1ProviderMetadata,
  LanguageModelV1FinishReason,
} from '@ai-sdk/provider';

import type { SharedUsageInfo } from './vercel-shared';

// V5 type imports - these are the interfaces we defined in vercel-v5.ts
import type {
  LanguageModelV2Usage,
  LanguageModelV2FinishReason,
  LanguageModelV2ToolCall,
  LanguageModelV2GenerateResult,
} from './vercel-v5';

/**
 * Enhanced v5 content part types with new AI SDK v5 features
 */
export interface V5FilePart {
  type: 'file';
  data: string | URL | Uint8Array | ArrayBuffer | Buffer;
  filename?: string;
  mimeType: string;
  providerOptions?: Record<string, unknown>;
}

export interface V5ReasoningPart {
  type: 'reasoning';
  text: string;
  providerOptions?: Record<string, unknown>;
}

export interface V5TextPart {
  type: 'text';
  text: string;
  providerOptions?: Record<string, unknown>;
}

export interface V5ImagePart {
  type: 'image';
  image: string | URL | Uint8Array | ArrayBuffer | Buffer;
  mimeType?: string;
  providerOptions?: Record<string, unknown>;
}

export interface V5ToolCallPart {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: unknown;
  providerOptions?: Record<string, unknown>;
}

export interface V5ToolResultPart {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  result: unknown;
  isError?: boolean;
  providerOptions?: Record<string, unknown>;
}

export type V5ContentPart =
  | V5TextPart
  | V5ImagePart
  | V5FilePart
  | V5ReasoningPart
  | V5ToolCallPart
  | V5ToolResultPart;

/**
 * Enhanced v5 message types
 */
export interface V5SystemMessage {
  role: 'system';
  content: string;
  providerOptions?: Record<string, unknown>;
}

export interface V5UserMessage {
  role: 'user';
  content: Array<V5TextPart | V5ImagePart | V5FilePart>;
  providerOptions?: Record<string, unknown>;
}

export interface V5AssistantMessage {
  role: 'assistant';
  content: Array<V5TextPart | V5FilePart | V5ReasoningPart | V5ToolCallPart>;
  providerOptions?: Record<string, unknown>;
}

export interface V5ToolMessage {
  role: 'tool';
  content: Array<V5ToolResultPart>;
  providerOptions?: Record<string, unknown>;
}

export type V5ModelMessage = V5SystemMessage | V5UserMessage | V5AssistantMessage | V5ToolMessage;

/**
 * Type guards for v5 content parts
 */
export function isV5TextPart(part: unknown): part is V5TextPart {
  return (
    typeof part === 'object' &&
    part !== null &&
    (part as any).type === 'text' &&
    typeof (part as any).text === 'string'
  );
}

export function isV5ImagePart(part: unknown): part is V5ImagePart {
  return (
    typeof part === 'object' &&
    part !== null &&
    (part as any).type === 'image' &&
    (part as any).image !== undefined
  );
}

export function isV5FilePart(part: unknown): part is V5FilePart {
  return (
    typeof part === 'object' &&
    part !== null &&
    (part as any).type === 'file' &&
    (part as any).data !== undefined &&
    typeof (part as any).mimeType === 'string'
  );
}

export function isV5ReasoningPart(part: unknown): part is V5ReasoningPart {
  return (
    typeof part === 'object' &&
    part !== null &&
    (part as any).type === 'reasoning' &&
    typeof (part as any).text === 'string'
  );
}

export function isV5ToolCallPart(part: unknown): part is V5ToolCallPart {
  return (
    typeof part === 'object' &&
    part !== null &&
    (part as any).type === 'tool-call' &&
    typeof (part as any).toolCallId === 'string' &&
    typeof (part as any).toolName === 'string'
  );
}

export function isV5ToolResultPart(part: unknown): part is V5ToolResultPart {
  return (
    typeof part === 'object' &&
    part !== null &&
    (part as any).type === 'tool-result' &&
    typeof (part as any).toolCallId === 'string' &&
    typeof (part as any).toolName === 'string'
  );
}

/**
 * Type guard for v5 content parts
 */
export function isV5ContentPart(part: unknown): part is V5ContentPart {
  return (
    isV5TextPart(part) ||
    isV5ImagePart(part) ||
    isV5FilePart(part) ||
    isV5ReasoningPart(part) ||
    isV5ToolCallPart(part) ||
    isV5ToolResultPart(part)
  );
}

/**
 * Convert v5 data content to v4 format
 */
function convertDataContent(
  data: string | URL | Uint8Array | ArrayBuffer | Buffer,
): string | URL | Uint8Array {
  if (typeof data === 'string' || data instanceof URL) {
    return data;
  }

  if (data instanceof Uint8Array) {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  if (Buffer.isBuffer(data)) {
    return new Uint8Array(data);
  }

  throw new Error(`Unsupported data content type: ${typeof data}`);
}

/**
 * Convert a v5 content part to v4 format
 */
export function convertV5ContentPart(
  part: V5ContentPart,
):
  | LanguageModelV1TextPart
  | LanguageModelV1ImagePart
  | LanguageModelV1FilePart
  | LanguageModelV1ReasoningPart
  | LanguageModelV1ToolCallPart
  | LanguageModelV1ToolResultPart {
  const providerMetadata = part.providerOptions as LanguageModelV1ProviderMetadata;

  switch (part.type) {
    case 'text':
      return {
        type: 'text',
        text: part.text,
        providerMetadata,
      };

    case 'image':
      const imageData = convertDataContent(part.image);
      // v4 image type only accepts Uint8Array | URL, not string
      if (typeof imageData === 'string') {
        throw new Error(
          'String image data is not supported in v4 format. Use Uint8Array or URL instead.',
        );
      }
      return {
        type: 'image',
        image: imageData,
        mimeType: part.mimeType,
        providerMetadata,
      };

    case 'file':
      // Convert file data to base64 string if it's binary data
      let fileData: string | URL;
      if (typeof part.data === 'string' || part.data instanceof URL) {
        fileData = part.data;
      } else {
        // Convert binary data to base64
        const uint8Array = convertDataContent(part.data);
        if (uint8Array instanceof Uint8Array) {
          fileData = Buffer.from(uint8Array).toString('base64');
        } else {
          throw new Error('Failed to convert file data to base64');
        }
      }

      return {
        type: 'file',
        filename: part.filename,
        data: fileData,
        mimeType: part.mimeType,
        providerMetadata,
      };

    case 'reasoning':
      return {
        type: 'reasoning',
        text: part.text,
        providerMetadata,
      };

    case 'tool-call':
      return {
        type: 'tool-call',
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        args: part.args,
        providerMetadata,
      };

    case 'tool-result':
      return {
        type: 'tool-result',
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        result: part.result,
        isError: part.isError,
        providerMetadata,
      };

    default:
      throw new Error(`Unsupported v5 content part type: ${(part as any).type}`);
  }
}

/**
 * Convert a v5 message to v4 format
 */
export function convertV5MessageToV4(message: V5ModelMessage): LanguageModelV1Message {
  const providerMetadata = message.providerOptions as LanguageModelV1ProviderMetadata;

  switch (message.role) {
    case 'system':
      return {
        role: 'system',
        content: message.content,
        providerMetadata,
      };

    case 'user':
      return {
        role: 'user',
        content: message.content.map(convertV5ContentPart) as Array<
          LanguageModelV1TextPart | LanguageModelV1ImagePart | LanguageModelV1FilePart
        >,
        providerMetadata,
      };

    case 'assistant':
      return {
        role: 'assistant',
        content: message.content.map(convertV5ContentPart) as Array<
          | LanguageModelV1TextPart
          | LanguageModelV1FilePart
          | LanguageModelV1ReasoningPart
          | LanguageModelV1ToolCallPart
        >,
        providerMetadata,
      };

    case 'tool':
      return {
        role: 'tool',
        content: message.content.map(convertV5ContentPart) as Array<LanguageModelV1ToolResultPart>,
        providerMetadata,
      };

    default:
      throw new Error(`Unsupported v5 message role: ${(message as any).role}`);
  }
}

/**
 * Convert v5 ModelMessage[] to v4 LanguageModelV1Prompt
 */
export function convertV5ToV4Prompt(messages: V5ModelMessage[]): LanguageModelV1Prompt {
  if (!Array.isArray(messages)) {
    throw new Error('Messages must be an array');
  }

  if (messages.length === 0) {
    return [];
  }

  try {
    return messages.map(convertV5MessageToV4);
  } catch (error) {
    throw new Error(
      `Failed to convert v5 messages to v4 prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Convert v5 tool calls to v4 format with enhanced type handling
 */
export function convertV5ToolCalls(
  toolCalls: LanguageModelV2ToolCall[],
  options: {
    preserveTypeInfo?: boolean;
    validateArgs?: boolean;
    includeMetadata?: boolean;
  } = {},
): LanguageModelV1FunctionToolCall[] {
  if (!Array.isArray(toolCalls)) {
    return [];
  }

  const { preserveTypeInfo = false, validateArgs = false, includeMetadata = false } = options;

  return toolCalls.map((toolCall) => {
    let processedArgs = toolCall.args;

    // Validate arguments if requested
    if (validateArgs && toolCall.args) {
      try {
        // Ensure args can be serialized/deserialized
        const serialized = JSON.stringify(toolCall.args);
        processedArgs = JSON.parse(serialized);
      } catch (error) {
        console.warn(`Failed to validate tool call args for ${toolCall.toolName}:`, error);
        processedArgs = toolCall.args;
      }
    }

    // Preserve type information if requested
    if (preserveTypeInfo && typeof processedArgs === 'object' && processedArgs !== null) {
      processedArgs = {
        ...processedArgs,
        __toolCallType: toolCall.type,
        __toolName: toolCall.toolName,
      };
    }

    const converted: LanguageModelV1FunctionToolCall = {
      toolCallType: 'function' as const,
      toolCallId: toolCall.toolCallId,
      toolName: toolCall.toolName,
      args: processedArgs,
    };

    // Include metadata if requested and available
    if (includeMetadata && (toolCall as any).__metadata) {
      (converted as any).__metadata = (toolCall as any).__metadata;
    }

    return converted;
  });
}

/**
 * Convert v5 tool results to v4 format with enhanced type handling
 */
export function convertV5ToolResults(
  toolResults: V5ToolResultPart[],
  options: {
    preserveTypeInfo?: boolean;
    validateResults?: boolean;
    includeMetadata?: boolean;
    trackTiming?: boolean;
  } = {},
): LanguageModelV1ToolResultPart[] {
  if (!Array.isArray(toolResults)) {
    return [];
  }

  const { preserveTypeInfo = false, validateResults = false, includeMetadata = false, trackTiming = false } = options;

  return toolResults.map((result) => {
    let processedResult = result.result;

    // Validate result if requested
    if (validateResults && result.result) {
      try {
        // Ensure result can be serialized/deserialized
        const serialized = JSON.stringify(result.result);
        processedResult = JSON.parse(serialized);
      } catch (error) {
        console.warn(`Failed to validate tool result for ${result.toolName}:`, error);
        processedResult = result.result;
      }
    }

    // Preserve type information if requested
    if (preserveTypeInfo && typeof processedResult === 'object' && processedResult !== null) {
      processedResult = {
        ...processedResult,
        __toolName: result.toolName,
        __toolCallId: result.toolCallId,
        __isError: result.isError,
      };
    }

    const converted: LanguageModelV1ToolResultPart = {
      type: 'tool-result' as const,
      toolCallId: result.toolCallId,
      toolName: result.toolName,
      result: processedResult,
      isError: result.isError,
    };

    // Include metadata if requested and available
    if (includeMetadata && (result as any).__metadata) {
      (converted as any).__metadata = (result as any).__metadata;
    }

    // Include timing information if requested and available
    if (trackTiming && (result as any).executionTime) {
      (converted as any).__executionTime = (result as any).executionTime;
    }

    return converted;
  });
}

/**
 * Convert v5 tool schema to v4 format
 */
export function convertV5ToolSchema(
  schema: any,
  options: {
    preserveExtensions?: boolean;
    validateSchema?: boolean;
  } = {},
): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  const { preserveExtensions = true, validateSchema = false } = options;

  // Basic schema validation
  if (validateSchema) {
    if (schema.type && typeof schema.type !== 'string') {
      console.warn('Invalid schema type:', schema.type);
    }
  }

  // Convert schema while preserving structure
  const converted: any = { ...schema };

  // Handle v5-specific schema extensions
  if (preserveExtensions) {
    if (schema.additionalProperties !== undefined) {
      converted.additionalProperties = schema.additionalProperties;
    }
    if (schema.required && Array.isArray(schema.required)) {
      converted.required = [...schema.required];
    }
  }

  return converted;
}

/**
 * Convert v5 tool choice to v4 format
 */
export function convertV5ToolChoice(
  toolChoice: any,
  options: {
    preserveExtensions?: boolean;
    strictMode?: boolean;
  } = {},
): any {
  if (!toolChoice || typeof toolChoice !== 'object') {
    return toolChoice;
  }

  const { preserveExtensions = true, strictMode = false } = options;

  const converted: any = {
    type: toolChoice.type,
  };

  // Handle tool name for specific tool choice
  if (toolChoice.type === 'tool' && toolChoice.toolName) {
    converted.toolName = toolChoice.toolName;
  }

  // Preserve v5-specific extensions
  if (preserveExtensions) {
    if (toolChoice.schema) {
      converted.schema = convertV5ToolSchema(toolChoice.schema, { preserveExtensions, validateSchema: strictMode });
    }
    if (toolChoice.strictMode !== undefined) {
      converted.strictMode = toolChoice.strictMode;
    }
    if (toolChoice.fallbackBehavior) {
      converted.fallbackBehavior = toolChoice.fallbackBehavior;
    }
  }

  return converted;
}

/**
 * Convert v5 providerOptions to v4 providerMetadata
 */
export function convertProviderOptions(
  providerOptions?: Record<string, unknown>,
): LanguageModelV1ProviderMetadata | undefined {
  if (!providerOptions || typeof providerOptions !== 'object') {
    return undefined;
  }

  // Use enhanced provider options conversion
  const { convertProviderOptionsToV4 } = require('./provider-options');
  const result = convertProviderOptionsToV4(providerOptions, {
    validate: false,
    sanitize: 'none' as any,
  });

  if (result.errors.length > 0) {
    console.warn('Provider options conversion errors:', result.errors);
  }

  return result.converted as LanguageModelV1ProviderMetadata;
}

/**
 * Extract provider options from v5 message or content
 */
export function extractProviderOptions(
  input: V5ModelMessage | V5ContentPart | { providerOptions?: Record<string, unknown> },
): Record<string, unknown> | undefined {
  if (typeof input === 'object' && input !== null && 'providerOptions' in input) {
    return input.providerOptions;
  }
  return undefined;
}

/**
 * Merge multiple v5 content parts appropriately
 */
export function mergeV5Content(contentParts: V5ContentPart[]): V5ContentPart[] {
  if (!Array.isArray(contentParts)) {
    return [];
  }

  // For now, just return the parts as-is
  // In the future, we might want to merge adjacent text parts or handle other optimizations
  return contentParts.filter((part) => part && typeof part === 'object' && part.type);
}

/**
 * Convert v4 completion format to v5 format
 */
export function convertV4ToV5Completion(v4Result: {
  response?: { id?: string; modelId?: string };
  finishReason?: LanguageModelV1FinishReason;
  usage?: SharedUsageInfo;
  text?: string;
  toolCalls?: LanguageModelV1FunctionToolCall[];
  providerMetadata?: LanguageModelV1ProviderMetadata;
}): Partial<LanguageModelV2GenerateResult> {
  const v5ToolCalls = v4Result.toolCalls?.map((toolCall) => ({
    type: 'function' as const,
    toolCallId: toolCall.toolCallId,
    toolName: toolCall.toolName,
    args: toolCall.args,
  }));

  const v5Usage: LanguageModelV2Usage | undefined = v4Result.usage
    ? {
        promptTokens: v4Result.usage.promptTokens,
        completionTokens: v4Result.usage.completionTokens,
        totalTokens: v4Result.usage.promptTokens + v4Result.usage.completionTokens,
      }
    : undefined;

  return {
    response: v4Result.response
      ? {
          id: v4Result.response.id,
          timestamp: new Date(),
          modelId: v4Result.response.modelId,
        }
      : {
          timestamp: new Date(),
        },
    finishReason: v4Result.finishReason as LanguageModelV2FinishReason,
    usage: v5Usage,
    text: v4Result.text,
    toolCalls: v5ToolCalls,
    providerMetadata: v4Result.providerMetadata,
  };
}

/**
 * Convert v5 finish reason to v4 format
 */
export function convertV5FinishReason(
  finishReason: LanguageModelV2FinishReason,
): LanguageModelV1FinishReason {
  // Most finish reasons are compatible between v4 and v5
  switch (finishReason) {
    case 'stop':
    case 'length':
    case 'content-filter':
    case 'tool-calls':
    case 'error':
    case 'other':
      return finishReason;
    default:
      // Fallback to 'other' for unknown finish reasons
      return 'other';
  }
}

/**
 * Convert v5 usage to v4 format
 */
export function convertV5Usage(usage: LanguageModelV2Usage): SharedUsageInfo {
  return {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
  };
}

/**
 * Utility function to safely convert unknown v5 messages to v4 format
 */
export function safeConvertV5ToV4Prompt(messages: unknown): LanguageModelV1Prompt {
  if (!Array.isArray(messages)) {
    throw new Error('Messages must be an array');
  }

  // Type-check and convert each message
  const convertedMessages: LanguageModelV1Message[] = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    if (typeof message !== 'object' || message === null) {
      throw new Error(`Message at index ${i} is not an object`);
    }

    if (!('role' in message) || typeof (message as any).role !== 'string') {
      throw new Error(`Message at index ${i} does not have a valid role`);
    }

    try {
      const convertedMessage = convertV5MessageToV4(message as V5ModelMessage);
      convertedMessages.push(convertedMessage);
    } catch (error) {
      throw new Error(
        `Failed to convert message at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  return convertedMessages;
}

/**
 * Validate that a content part is valid v5 format
 */
export function validateV5ContentPart(part: unknown): asserts part is V5ContentPart {
  if (typeof part !== 'object' || part === null) {
    throw new Error('Content part must be an object');
  }

  if (!('type' in part) || typeof (part as any).type !== 'string') {
    throw new Error('Content part must have a valid type');
  }

  const partType = (part as any).type;

  switch (partType) {
    case 'text':
      if (typeof (part as any).text !== 'string') {
        throw new Error('Text part must have a text property');
      }
      break;
    case 'image':
      if (!(part as any).image) {
        throw new Error('Image part must have an image property');
      }
      break;
    case 'file':
      if (!(part as any).data) {
        throw new Error('File part must have a data property');
      }
      if (typeof (part as any).mimeType !== 'string') {
        throw new Error('File part must have a mimeType property');
      }
      break;
    case 'reasoning':
      if (typeof (part as any).text !== 'string') {
        throw new Error('Reasoning part must have a text property');
      }
      break;
    case 'tool-call':
      if (typeof (part as any).toolCallId !== 'string') {
        throw new Error('Tool call part must have a toolCallId property');
      }
      if (typeof (part as any).toolName !== 'string') {
        throw new Error('Tool call part must have a toolName property');
      }
      break;
    case 'tool-result':
      if (typeof (part as any).toolCallId !== 'string') {
        throw new Error('Tool result part must have a toolCallId property');
      }
      if (typeof (part as any).toolName !== 'string') {
        throw new Error('Tool result part must have a toolName property');
      }
      break;
    default:
      throw new Error(`Unsupported content part type: ${partType}`);
  }
}

/**
 * Validate that a message is valid v5 format
 */
export function validateV5Message(message: unknown): asserts message is V5ModelMessage {
  if (typeof message !== 'object' || message === null) {
    throw new Error('Message must be an object');
  }

  if (!('role' in message) || typeof (message as any).role !== 'string') {
    throw new Error('Message must have a valid role');
  }

  const role = (message as any).role;

  switch (role) {
    case 'system':
      if (typeof (message as any).content !== 'string') {
        throw new Error('System message must have string content');
      }
      break;
    case 'user':
    case 'assistant':
    case 'tool':
      if (!Array.isArray((message as any).content)) {
        throw new Error(`${role} message must have array content`);
      }
      for (const part of (message as any).content) {
        validateV5ContentPart(part);
      }
      break;
    default:
      throw new Error(`Unsupported message role: ${role}`);
  }
}

/**
 * V5 streaming chunk conversion utilities
 */

export interface V5StreamChunk {
  type: 'text-delta' | 'tool-call' | 'tool-call-delta' | 'tool-result' | 'finish' | 'error' | 'response-metadata';
  textDelta?: string;
  toolCallType?: 'function';
  toolCallId?: string;
  toolName?: string;
  args?: any;
  argsTextDelta?: string;
  result?: any;
  finishReason?: LanguageModelV2FinishReason;
  usage?: LanguageModelV2Usage;
  error?: Error;
  responseMetadata?: Record<string, unknown>;
}

export interface V4StreamChunk {
  type: 'text-delta' | 'tool-call' | 'tool-call-delta' | 'tool-result' | 'finish' | 'error';
  textDelta?: string;
  toolCallType?: 'function';
  toolCallId?: string;
  toolName?: string;
  args?: any;
  argsTextDelta?: string;
  result?: any;
  finishReason?: LanguageModelV1FinishReason;
  usage?: SharedUsageInfo;
  error?: Error;
}

/**
 * Convert v5 streaming chunk to v4 format for telemetry compatibility
 */
export function convertV5StreamChunk(chunk: V5StreamChunk): V4StreamChunk | null {
  try {
    switch (chunk.type) {
      case 'text-delta':
        return {
          type: 'text-delta',
          textDelta: chunk.textDelta,
        };
      
      case 'tool-call':
        return {
          type: 'tool-call',
          toolCallType: chunk.toolCallType || 'function',
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          args: chunk.args,
        };
      
      case 'tool-call-delta':
        return {
          type: 'tool-call-delta',
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          argsTextDelta: chunk.argsTextDelta,
        };
      
      case 'tool-result':
        return {
          type: 'tool-result',
          toolCallId: chunk.toolCallId,
          result: chunk.result,
        };
      
      case 'finish':
        return {
          type: 'finish',
          finishReason: chunk.finishReason ? convertV5FinishReason(chunk.finishReason) : undefined,
          usage: chunk.usage ? convertV5Usage(chunk.usage) : undefined,
        };
      
      case 'error':
        return {
          type: 'error',
          error: chunk.error,
        };
      
      case 'response-metadata':
        // Response metadata is handled separately in v4, don't convert
        return null;
      
      default:
        console.warn(`Unknown v5 stream chunk type: ${(chunk as any).type}`);
        return null;
    }
  } catch (error) {
    console.error('Error converting v5 stream chunk:', error);
    return null;
  }
}

/**
 * Accumulated tool call delta data
 */
export interface AccumulatedToolCall {
  toolCallId: string;
  toolName: string;
  args: string;
  argsComplete: boolean;
}

/**
 * Merge incremental tool call chunks into accumulated data
 */
export function mergeToolCallDeltas(
  accumulated: Map<string, AccumulatedToolCall>,
  chunk: V5StreamChunk,
): Map<string, AccumulatedToolCall> {
  if (chunk.type !== 'tool-call-delta' || !chunk.toolCallId) {
    return accumulated;
  }

  const existing = accumulated.get(chunk.toolCallId) || {
    toolCallId: chunk.toolCallId,
    toolName: chunk.toolName || '',
    args: '',
    argsComplete: false,
  };

  // Update tool name if provided
  if (chunk.toolName && !existing.toolName) {
    existing.toolName = chunk.toolName;
  }

  // Accumulate args text delta
  if (chunk.argsTextDelta) {
    existing.args += chunk.argsTextDelta;
  }

  // This function only handles tool-call-delta chunks, 
  // complete tool calls are handled elsewhere

  accumulated.set(chunk.toolCallId, existing);
  return accumulated;
}

/**
 * Convert accumulated streaming data to final format
 */
export function finalizeStreamingData(data: {
  fullText?: string;
  toolCalls: Map<string, AccumulatedToolCall>;
  usage?: LanguageModelV2Usage;
  finishReason?: LanguageModelV2FinishReason;
  responseMetadata?: Record<string, unknown>;
}): {
  text?: string;
  toolCalls?: LanguageModelV1FunctionToolCall[];
  usage?: SharedUsageInfo;
  finishReason?: LanguageModelV1FinishReason;
  providerMetadata?: LanguageModelV1ProviderMetadata;
} {
  const result: any = {};

  if (data.fullText) {
    result.text = data.fullText;
  }

  if (data.toolCalls.size > 0) {
    result.toolCalls = Array.from(data.toolCalls.values())
      .filter(toolCall => toolCall.argsComplete)
      .map(toolCall => ({
        toolCallType: 'function' as const,
        toolCallId: toolCall.toolCallId,
        toolName: toolCall.toolName,
        args: toolCall.args,
      }));
  }

  if (data.usage) {
    result.usage = convertV5Usage(data.usage);
  }

  if (data.finishReason) {
    result.finishReason = convertV5FinishReason(data.finishReason);
  }

  if (data.responseMetadata) {
    result.providerMetadata = convertProviderOptions(data.responseMetadata);
  }

  return result;
}

/**
 * Helper function to safely parse JSON from streaming args
 */
export function safeParseStreamingArgs(args: string): any {
  if (!args || typeof args !== 'string') {
    return args;
  }

  try {
    return JSON.parse(args);
  } catch {
    // If parsing fails, return the string as-is
    return args;
  }
}

/**
 * Validate v5 streaming chunk format
 */
export function validateV5StreamChunk(chunk: unknown): asserts chunk is V5StreamChunk {
  if (typeof chunk !== 'object' || chunk === null) {
    throw new Error('Stream chunk must be an object');
  }

  if (!('type' in chunk) || typeof (chunk as any).type !== 'string') {
    throw new Error('Stream chunk must have a valid type');
  }

  const supportedTypes = ['text-delta', 'tool-call', 'tool-call-delta', 'tool-result', 'finish', 'error', 'response-metadata'];
  if (!supportedTypes.includes((chunk as any).type)) {
    throw new Error(`Unsupported stream chunk type: ${(chunk as any).type}`);
  }

  // Type-specific validation
  switch ((chunk as any).type) {
    case 'text-delta':
      if ('textDelta' in chunk && typeof (chunk as any).textDelta !== 'string') {
        throw new Error('text-delta chunk must have string textDelta');
      }
      break;
    case 'tool-call':
      if (!('toolCallId' in chunk) || typeof (chunk as any).toolCallId !== 'string') {
        throw new Error('tool-call chunk must have string toolCallId');
      }
      break;
    case 'tool-call-delta':
      if (!('toolCallId' in chunk) || typeof (chunk as any).toolCallId !== 'string') {
        throw new Error('tool-call-delta chunk must have string toolCallId');
      }
      break;
    case 'error':
      if ('error' in chunk && !((chunk as any).error instanceof Error)) {
        throw new Error('error chunk must have Error object');
      }
      break;
  }
}
