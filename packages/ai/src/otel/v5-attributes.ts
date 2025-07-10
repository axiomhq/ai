/**
 * V5-specific attribute mapping for OpenTelemetry spans.
 *
 * This module provides enhanced attribute handling for AI SDK v5 features
 * including providerOptions, new content types, and enhanced metadata.
 */

import type { Span } from '@opentelemetry/api';
import { Attr } from './semconv/attributes';
import { currentUnixTime } from '../util/currentUnixTime';
import type {
  LanguageModelV2CallOptions,
  LanguageModelV2GenerateResult,
  LanguageModelV2Usage,
  LanguageModelV2CallWarning,
  ModelMessage,
  ContentPart,
  LanguageModelV2ToolCall,
  LanguageModelV2FinishReason,
} from './vercel-v5';
import type { SharedModelInfo, SharedUsageInfo } from './vercel-shared';
import { detectProvider, setProviderConfigAttributes } from './provider-options';

/**
 * V5-specific interfaces for enhanced attribute handling
 */
export interface V5ModelInfo extends SharedModelInfo {
  providerOptions?: Record<string, unknown>;
}

export interface V5UsageInfo extends SharedUsageInfo {
  // V5 may have additional usage metrics
  totalTokens?: number;
}

export interface V5ResultInfo {
  response?: { id?: string; modelId?: string; timestamp?: Date };
  finishReason?: LanguageModelV2FinishReason;
  usage?: V5UsageInfo;
  text?: string;
  toolCalls?: LanguageModelV2ToolCall[];
  providerMetadata?: Record<string, unknown>;
  warnings?: LanguageModelV2CallWarning[];
}

export interface V5ContentAttributes {
  textParts: number;
  imageParts: number;
  fileParts: number;
  reasoningParts: number;
  toolCallParts: number;
  toolResultParts: number;
  totalParts: number;
  // File-specific attributes
  fileTypes?: string[];
  fileSizes?: number[];
  imageTypes?: string[];
  // Reasoning-specific attributes
  reasoningLength?: number;
}

/**
 * Enhanced content type specific handling for V5 features
 */
export function analyzeV5Content(messages: ModelMessage[]): V5ContentAttributes {
  const attributes: V5ContentAttributes = {
    textParts: 0,
    imageParts: 0,
    fileParts: 0,
    reasoningParts: 0,
    toolCallParts: 0,
    toolResultParts: 0,
    totalParts: 0,
    fileTypes: [],
    fileSizes: [],
    imageTypes: [],
    reasoningLength: 0,
  };

  for (const message of messages) {
    for (const part of message.content) {
      attributes.totalParts++;

      switch (part.type) {
        case 'text':
          attributes.textParts++;
          break;
        case 'image':
          attributes.imageParts++;
          if (part.mimeType) {
            attributes.imageTypes!.push(part.mimeType);
          }
          break;
        case 'file':
          attributes.fileParts++;
          if (part.mimeType) {
            attributes.fileTypes!.push(part.mimeType);
          }
          // Try to estimate file size if possible
          if (typeof part.image === 'string') {
            // Base64 encoded data
            attributes.fileSizes!.push(Math.floor(part.image.length * 0.75));
          } else if (part.image instanceof Uint8Array) {
            attributes.fileSizes!.push(part.image.length);
          }
          break;
        case 'reasoning':
          attributes.reasoningParts++;
          if (part.reasoning) {
            attributes.reasoningLength = (attributes.reasoningLength || 0) + part.reasoning.length;
          }
          break;
        case 'tool-call':
          attributes.toolCallParts++;
          break;
        case 'tool-result':
          attributes.toolResultParts++;
          break;
      }
    }
  }

  return attributes;
}

/**
 * Process V5 messages to create OpenTelemetry-compatible prompt structure
 */
export function processV5Messages(messages: ModelMessage[]): any[] {
  const results: any[] = [];

  for (const message of messages) {
    switch (message.role) {
      case 'system':
        results.push({
          role: 'system',
          content: message.content.find((part) => part.type === 'text')?.text || '',
        });
        break;
      case 'user':
        results.push({
          role: 'user',
          content: message.content.map((part) => processV5ContentPart(part)),
        });
        break;
      case 'assistant':
        const textPart = message.content.find((part) => part.type === 'text');
        const toolCallParts = message.content.filter((part) => part.type === 'tool-call');
        const reasoningParts = message.content.filter((part) => part.type === 'reasoning');

        results.push({
          role: 'assistant',
          content: textPart?.text || null,
          ...(toolCallParts.length > 0
            ? {
                tool_calls: toolCallParts.map((part) => ({
                  id: part.toolCallId,
                  type: 'function',
                  function: {
                    name: part.toolName,
                    arguments:
                      typeof part.args === 'string' ? part.args : JSON.stringify(part.args),
                  },
                })),
              }
            : {}),
          ...(reasoningParts.length > 0
            ? {
                reasoning: reasoningParts.map((part) => part.reasoning).join('\n'),
              }
            : {}),
        });
        break;
      case 'tool':
        for (const part of message.content) {
          if (part.type === 'tool-result') {
            results.push({
              role: 'tool',
              tool_call_id: part.toolCallId,
              content: typeof part.result === 'string' ? part.result : JSON.stringify(part.result),
            });
          }
        }
        break;
    }
  }

  return results;
}

/**
 * Process individual V5 content parts with enhanced metadata
 */
function processV5ContentPart(part: ContentPart): any {
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
          url: part.image?.toString() || '',
          ...(part.mimeType ? { mime_type: part.mimeType } : {}),
        },
      };
    case 'file':
      return {
        type: 'file',
        file_url: {
          url: part.image?.toString() || '',
          ...(part.mimeType ? { mime_type: part.mimeType } : {}),
        },
      };
    case 'reasoning':
      return {
        type: 'reasoning',
        reasoning: part.reasoning,
      };
    default:
      return part;
  }
}

/**
 * Format V5 completion with enhanced content support
 */
export function formatV5Completion({
  text,
  toolCalls,
  reasoning,
}: {
  text: string | undefined;
  toolCalls: LanguageModelV2ToolCall[] | undefined;
  reasoning?: string;
}): any {
  return {
    role: 'assistant',
    content: text ?? (toolCalls && toolCalls.length > 0 ? null : ''),
    ...(toolCalls && toolCalls.length > 0
      ? {
          tool_calls: toolCalls.map((toolCall, index) => ({
            id: toolCall.toolCallId,
            type: 'function',
            function: {
              name: toolCall.toolName,
              arguments:
                typeof toolCall.args === 'string' ? toolCall.args : JSON.stringify(toolCall.args),
            },
            index,
          })),
        }
      : {}),
    ...(reasoning ? { reasoning } : {}),
  };
}

/**
 * Set V5-specific pre-call attributes with enhanced provider options handling
 */
export function setV5PreCallAttributes(
  span: Span,
  modelInfo: V5ModelInfo,
  options: LanguageModelV2CallOptions,
): void {
  const {
    prompt,
    maxOutputTokens,
    temperature,
    topP,
    topK,
    presencePenalty,
    frequencyPenalty,
    seed,
    stopSequences,
    responseFormat,
    tools,
    toolChoice,
    providerOptions,
  } = options;

  // Set basic operation attributes
  span.setAttributes({
    [Attr.GenAI.Operation.Name]: Attr.GenAI.Operation.Name_Values.Chat,
    [Attr.GenAI.Output.Type]: Attr.GenAI.Output.Type_Values.Text,
    [Attr.GenAI.Request.Model]: modelInfo.modelId,
    [Attr.GenAI.Provider]: modelInfo.provider,
    [Attr.GenAI.System]: Attr.GenAI.System_Values.Vercel,
  });

  // Set V5-specific prompt attributes with enhanced content analysis
  const processedPrompt = processV5Messages(prompt);
  span.setAttribute(Attr.GenAI.Prompt, JSON.stringify(processedPrompt));

  // Analyze content composition
  const contentAttributes = analyzeV5Content(prompt);
  span.setAttributes({
    'gen_ai.prompt.content.text_parts': contentAttributes.textParts,
    'gen_ai.prompt.content.image_parts': contentAttributes.imageParts,
    'gen_ai.prompt.content.file_parts': contentAttributes.fileParts,
    'gen_ai.prompt.content.reasoning_parts': contentAttributes.reasoningParts,
    'gen_ai.prompt.content.tool_call_parts': contentAttributes.toolCallParts,
    'gen_ai.prompt.content.tool_result_parts': contentAttributes.toolResultParts,
    'gen_ai.prompt.content.total_parts': contentAttributes.totalParts,
  });

  // Set file-specific attributes
  if (contentAttributes.fileTypes && contentAttributes.fileTypes.length > 0) {
    span.setAttribute(
      'gen_ai.prompt.content.file_types',
      JSON.stringify(contentAttributes.fileTypes),
    );
  }
  if (contentAttributes.fileSizes && contentAttributes.fileSizes.length > 0) {
    span.setAttribute(
      'gen_ai.prompt.content.file_sizes',
      JSON.stringify(contentAttributes.fileSizes),
    );
  }
  if (contentAttributes.imageTypes && contentAttributes.imageTypes.length > 0) {
    span.setAttribute(
      'gen_ai.prompt.content.image_types',
      JSON.stringify(contentAttributes.imageTypes),
    );
  }
  if (contentAttributes.reasoningLength && contentAttributes.reasoningLength > 0) {
    span.setAttribute('gen_ai.prompt.content.reasoning_length', contentAttributes.reasoningLength);
  }

  // Set request parameters
  if (maxOutputTokens !== undefined) {
    span.setAttribute(Attr.GenAI.Request.MaxTokens, maxOutputTokens);
  }
  if (temperature !== undefined) {
    span.setAttribute(Attr.GenAI.Request.Temperature, temperature);
  }
  if (topP !== undefined) {
    span.setAttribute(Attr.GenAI.Request.TopP, topP);
  }
  if (topK !== undefined) {
    span.setAttribute(Attr.GenAI.Request.TopK, topK);
  }
  if (presencePenalty !== undefined) {
    span.setAttribute(Attr.GenAI.Request.PresencePenalty, presencePenalty);
  }
  if (frequencyPenalty !== undefined) {
    span.setAttribute(Attr.GenAI.Request.FrequencyPenalty, frequencyPenalty);
  }
  if (seed !== undefined) {
    span.setAttribute(Attr.GenAI.Request.Seed, seed);
  }
  if (stopSequences && stopSequences.length > 0) {
    span.setAttribute(Attr.GenAI.Request.StopSequences, JSON.stringify(stopSequences));
  }

  // Set response format
  if (responseFormat) {
    span.setAttribute(Attr.GenAI.Output.Type, responseFormat.type);
    if (responseFormat.schema) {
      span.setAttribute(
        'gen_ai.request.response_format.schema',
        JSON.stringify(responseFormat.schema),
      );
    }
  }

  // Set tool configuration
  if (tools && tools.length > 0) {
    span.setAttribute('gen_ai.request.tools_count', tools.length);
    span.setAttribute(
      'gen_ai.request.tools',
      JSON.stringify(
        tools.map((tool) => ({
          type: tool.type,
          name: tool.name,
          description: tool.description,
          has_parameters: !!tool.parameters,
        })),
      ),
    );
  }

  if (toolChoice) {
    span.setAttribute('gen_ai.request.tool_choice', JSON.stringify(toolChoice));
  }

  // Set V5-specific provider options (both model and request level)
  setV5ProviderAttributes(span, modelInfo, providerOptions);
}

/**
 * Set V5-specific post-call attributes with enhanced metadata
 */
export function setV5PostCallAttributes(
  span: Span,
  result: V5ResultInfo,
  startTime?: number,
): void {
  // Set response metadata
  if (result.response?.id) {
    span.setAttribute(Attr.GenAI.Response.ID, result.response.id);
  }
  if (result.response?.modelId) {
    span.setAttribute(Attr.GenAI.Response.Model, result.response.modelId);
  }
  if (result.response?.timestamp) {
    span.setAttribute('gen_ai.response.timestamp', result.response.timestamp.toISOString());
  }

  // Set usage attributes with V5 enhancements
  if (result.usage) {
    span.setAttribute(Attr.GenAI.Usage.InputTokens, result.usage.promptTokens);
    span.setAttribute(Attr.GenAI.Usage.OutputTokens, result.usage.completionTokens);
    if (result.usage.totalTokens) {
      span.setAttribute('gen_ai.usage.total_tokens', result.usage.totalTokens);
    }
  }

  // Set completion with V5 enhancements
  if (result.finishReason && (result.text || result.toolCalls)) {
    // Extract reasoning from text if present (this is a simplified approach)
    const reasoning = extractReasoningFromText(result.text);

    const completion = formatV5Completion({
      text: result.text,
      toolCalls: result.toolCalls,
      reasoning,
    });
    span.setAttribute(Attr.GenAI.Completion, JSON.stringify(completion));
    span.setAttribute('gen_ai.response.finish_reasons', JSON.stringify([result.finishReason]));
  }

  // Set tool-specific attributes
  if (result.toolCalls && result.toolCalls.length > 0) {
    span.setAttribute('gen_ai.response.tool_calls_count', result.toolCalls.length);
    span.setAttribute(
      'gen_ai.response.tool_calls',
      JSON.stringify(
        result.toolCalls.map((toolCall) => ({
          id: toolCall.toolCallId,
          name: toolCall.toolName,
          type: toolCall.type,
          args_length:
            typeof toolCall.args === 'string'
              ? toolCall.args.length
              : JSON.stringify(toolCall.args).length,
        })),
      ),
    );
  }

  // Set provider metadata
  if (result.providerMetadata && Object.keys(result.providerMetadata).length > 0) {
    span.setAttribute(
      Attr.GenAI.Response.ProviderMetadata,
      JSON.stringify(result.providerMetadata),
    );
  }

  // Set warnings
  if (result.warnings && result.warnings.length > 0) {
    span.setAttribute('gen_ai.response.warnings', JSON.stringify(result.warnings));
    span.setAttribute('gen_ai.response.warnings_count', result.warnings.length);
  }

  // Set timing attributes
  if (startTime) {
    const endTime = currentUnixTime();
    span.setAttribute('gen_ai.response.duration', endTime - startTime);
  }
}

/**
 * Set V5-specific content attributes for individual parts
 */
export function setV5ContentAttributes(span: Span, part: ContentPart, prefix: string): void {
  switch (part.type) {
    case 'file':
      if (part.mimeType) {
        span.setAttribute(`${prefix}.file.mime_type`, part.mimeType);
      }
      if (typeof part.image === 'string') {
        span.setAttribute(`${prefix}.file.size_estimate`, Math.floor(part.image.length * 0.75));
      } else if (part.image instanceof Uint8Array) {
        span.setAttribute(`${prefix}.file.size`, part.image.length);
      }
      break;
    case 'reasoning':
      if (part.reasoning) {
        span.setAttribute(`${prefix}.reasoning.length`, part.reasoning.length);
      }
      break;
    case 'image':
      if (part.mimeType) {
        span.setAttribute(`${prefix}.image.mime_type`, part.mimeType);
      }
      break;
    case 'tool-call':
      span.setAttribute(`${prefix}.tool_call.name`, part.toolName || 'unknown');
      span.setAttribute(`${prefix}.tool_call.id`, part.toolCallId || 'unknown');
      if (part.args) {
        const argsStr = typeof part.args === 'string' ? part.args : JSON.stringify(part.args);
        span.setAttribute(`${prefix}.tool_call.args_length`, argsStr.length);
      }
      break;
    case 'tool-result':
      span.setAttribute(`${prefix}.tool_result.id`, part.toolCallId || 'unknown');
      if (part.result) {
        const resultStr =
          typeof part.result === 'string' ? part.result : JSON.stringify(part.result);
        span.setAttribute(`${prefix}.tool_result.length`, resultStr.length);
      }
      break;
  }
}

/**
 * Helper function to extract reasoning from text (simplified approach)
 */
function extractReasoningFromText(text?: string): string | undefined {
  if (!text) return undefined;

  // Look for common reasoning patterns
  const reasoningPatterns = [
    /<thinking>(.*?)<\/thinking>/s,
    /<reasoning>(.*?)<\/reasoning>/s,
    /\*\*Reasoning:\*\*(.*?)(\n\n|\*\*|$)/s,
  ];

  for (const pattern of reasoningPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Convert V5 usage to shared format
 */
export function convertV5Usage(usage: LanguageModelV2Usage): V5UsageInfo {
  return {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
  };
}

/**
 * Set V5-specific provider attributes
 */
export function setV5ProviderAttributes(
  span: Span,
  modelInfo: V5ModelInfo,
  requestProviderOptions?: Record<string, unknown>,
): void {
  try {
    // Handle model-level provider options
    if (modelInfo.providerOptions) {
      const provider = detectProvider(modelInfo.providerOptions);
      if (provider) {
        setProviderConfigAttributes(span, modelInfo.providerOptions, provider);
      }
    }

    // Handle request-level provider options
    if (requestProviderOptions) {
      const provider = detectProvider(requestProviderOptions);
      if (provider) {
        setProviderConfigAttributes(span, requestProviderOptions, provider);
      }
    }

    // Set provider options presence flags
    span.setAttributes({
      'gen_ai.provider.has_model_options': Boolean(
        modelInfo.providerOptions && Object.keys(modelInfo.providerOptions).length > 0,
      ),
      'gen_ai.provider.has_request_options': Boolean(
        requestProviderOptions && Object.keys(requestProviderOptions).length > 0,
      ),
    });

    // Set combined provider config counts
    const totalModelOptions = modelInfo.providerOptions
      ? Object.keys(modelInfo.providerOptions).length
      : 0;
    const totalRequestOptions = requestProviderOptions
      ? Object.keys(requestProviderOptions).length
      : 0;

    span.setAttribute('gen_ai.provider.total_options', totalModelOptions + totalRequestOptions);
  } catch (error) {
    console.warn('Failed to set V5 provider attributes:', error);
  }
}

/**
 * Convert V5 result to shared format for compatibility
 */
export function convertV5Result(result: LanguageModelV2GenerateResult): V5ResultInfo {
  return {
    response: result.response,
    finishReason: result.finishReason,
    usage: result.usage ? convertV5Usage(result.usage) : undefined,
    text: result.text,
    toolCalls: result.toolCalls,
    providerMetadata: result.providerMetadata,
    warnings: result.warnings,
  };
}
