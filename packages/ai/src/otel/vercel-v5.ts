/**
 * AxiomWrappedLanguageModelV2 implementation for AI SDK v5 support.
 *
 * This class extends the base wrapper to provide OpenTelemetry instrumentation
 * for LanguageModelV2 models from AI SDK v5. It handles the new v5 features
 * such as providerOptions, new content types, and updated streaming patterns.
 */

import type { Span } from '@opentelemetry/api';
import { BaseLanguageModelWrapper, ModelValidation } from './vercel-base';
import {
  handleSpanError,
  createStreamingMetrics,
  type SharedModelInfo,
  type SharedCallOptions,
  type SharedResultInfo,
  type StreamingMetrics,
} from './vercel-shared';
import {
  setV5PreCallAttributes,
  setV5PostCallAttributes,
  convertV5Result,
  type V5ModelInfo,
} from './v5-attributes';
import { isLanguageModelV2 } from './vercel-types';
import {
  convertV5ToolCalls,
  convertV5ToolSchema,
  convertV5ToolChoice,
  convertProviderOptions,
  convertV5FinishReason,
  convertV5Usage,
  safeConvertV5ToV4Prompt,
} from './message-conversion';
import {
  convertProviderOptionsToV4,
  validateProviderOptions,
  sanitizeProviderOptions,
  detectProvider,
  setProviderConfigAttributes,
  SanitizationLevel,
  type ProviderOptionProcessingConfig,
  DEFAULT_PROVIDER_CONFIG,
} from './provider-options';
import {
  processV5ToolCalls,
  validateToolCallTypes,
  setV5ToolCallAttributes,
  type V5ToolCall,
} from './v5-tools';

/**
 * Placeholder interfaces for v5 types until they are available in @ai-sdk/provider
 * TODO: Replace these with actual imports when v5 types are published
 */
export interface LanguageModelV2 {
  readonly specificationVersion: 'v2';
  readonly provider: string;
  readonly modelId: string;
  readonly providerOptions?: Record<string, unknown>;
  doGenerate(options: LanguageModelV2CallOptions): Promise<LanguageModelV2GenerateResult>;
  doStream(options: LanguageModelV2CallOptions): Promise<LanguageModelV2StreamResult>;
}

export interface LanguageModelV2CallOptions {
  prompt: ModelMessage[];
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  seed?: number;
  responseFormat?: { type: string; schema?: any };
  tools?: LanguageModelV2Tool[];
  toolChoice?: LanguageModelV2ToolChoice;
  headers?: Record<string, string>;
  providerOptions?: Record<string, unknown>;
  abortSignal?: AbortSignal;
}

export interface LanguageModelV2GenerateResult {
  response: {
    id?: string;
    timestamp?: Date;
    modelId?: string;
  };
  finishReason: LanguageModelV2FinishReason;
  usage?: LanguageModelV2Usage;
  text?: string;
  toolCalls?: LanguageModelV2ToolCall[];
  providerMetadata?: Record<string, unknown>;
  warnings?: LanguageModelV2CallWarning[];
}

export interface LanguageModelV2StreamResult {
  stream: ReadableStream<LanguageModelV2StreamPart>;
  response: {
    id?: string;
    timestamp?: Date;
    modelId?: string;
  };
}

export interface LanguageModelV2StreamPart {
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

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: ContentPart[];
}

export interface ContentPart {
  type: 'text' | 'image' | 'file' | 'tool-call' | 'tool-result' | 'reasoning';
  text?: string;
  image?: string | URL | Uint8Array;
  mimeType?: string;
  toolCallId?: string;
  toolName?: string;
  args?: any;
  result?: any;
  reasoning?: string;
}

export interface LanguageModelV2Tool {
  type: 'function';
  name: string;
  description?: string;
  parameters?: any;
}

export interface LanguageModelV2ToolChoice {
  type: 'auto' | 'required' | 'none' | 'tool';
  toolName?: string;
}

export interface LanguageModelV2ToolCall {
  type: 'function';
  toolCallId: string;
  toolName: string;
  args: any;
}

export interface LanguageModelV2Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens?: number;
}

export interface LanguageModelV2CallWarning {
  type: string;
  message: string;
}

export type LanguageModelV2FinishReason =
  | 'stop'
  | 'length'
  | 'content-filter'
  | 'tool-calls'
  | 'error'
  | 'other';

/**
 * AxiomWrappedLanguageModelV2 class for AI SDK v5 support.
 *
 * This class extends the base wrapper to provide telemetry for v5 models.
 * It implements the LanguageModelV2 interface while adding OpenTelemetry spans
 * and metrics to all model operations.
 */
export class AxiomWrappedLanguageModelV2
  extends BaseLanguageModelWrapper<
    LanguageModelV2,
    LanguageModelV2CallOptions,
    LanguageModelV2GenerateResult,
    LanguageModelV2StreamResult,
    LanguageModelV2StreamPart
  >
  implements LanguageModelV2
{
  constructor(model: LanguageModelV2) {
    super(model);
  }

  // LanguageModelV2 interface implementation
  get specificationVersion(): 'v2' {
    return this.model.specificationVersion;
  }

  get provider(): string {
    return this.model.provider;
  }

  get modelId(): string {
    return this.model.modelId;
  }

  get providerOptions(): Record<string, unknown> | undefined {
    return this.model.providerOptions;
  }

  async doGenerate(options: LanguageModelV2CallOptions): Promise<LanguageModelV2GenerateResult> {
    return this.handleGenerate(options);
  }

  async doStream(options: LanguageModelV2CallOptions): Promise<LanguageModelV2StreamResult> {
    return this.handleStream(options);
  }

  // Abstract method implementations

  protected isValidModel(model: unknown): model is LanguageModelV2 {
    return isLanguageModelV2(model);
  }

  protected extractModelInfo(model: LanguageModelV2): V5ModelInfo {
    return {
      provider: model.provider,
      modelId: model.modelId,
      providerOptions: model.providerOptions,
    };
  }

  protected validateModelVersion(model: LanguageModelV2): void {
    ModelValidation.validateModelVersion(model, 'v2');
  }

  protected convertCallOptions(options: LanguageModelV2CallOptions): SharedCallOptions {
    // Enhanced provider options conversion
    let providerMetadata;
    if (options.providerOptions) {
      const conversionResult = convertProviderOptionsToV4(options.providerOptions, {
        validate: true,
        sanitize: SanitizationLevel.NONE,
        extractTelemetry: false,
        preserveUnknown: true,
        strictMode: false,
      });
      
      if (conversionResult.errors.length > 0) {
        console.warn('Provider options conversion errors:', conversionResult.errors);
      }
      
      providerMetadata = conversionResult.converted;
    }

    return {
      prompt: safeConvertV5ToV4Prompt(options.prompt),
      maxTokens: options.maxOutputTokens,
      temperature: options.temperature,
      topP: options.topP,
      topK: options.topK,
      presencePenalty: options.presencePenalty,
      frequencyPenalty: options.frequencyPenalty,
      seed: options.seed,
      stopSequences: options.stopSequences,
      responseFormat: options.responseFormat,
      inputFormat: 'messages',
      mode: this.convertV5ToolsToV1Mode(options.tools, options.toolChoice),
      providerMetadata,
    };
  }

  protected convertGenerateResult(result: LanguageModelV2GenerateResult): SharedResultInfo {
    const v5Result = convertV5Result(result);
    
    // Convert V5 result to shared format for base class compatibility
    return {
      response: v5Result.response,
      finishReason: v5Result.finishReason,
      usage: v5Result.usage,
      text: v5Result.text,
      toolCalls: v5Result.toolCalls ? convertV5ToolCalls(v5Result.toolCalls, {
        preserveTypeInfo: true,
        validateArgs: true,
        includeMetadata: true,
      }) : undefined,
      providerMetadata: convertProviderOptions(v5Result.providerMetadata),
    };
  }

  /**
   * Override to use V5-specific pre-call attributes
   */
  protected setPreCallAttributes(
    span: Span,
    modelInfo: SharedModelInfo,
    _sharedOptions: SharedCallOptions,
    originalOptions: LanguageModelV2CallOptions,
  ): void {
    // Use V5-specific attributes with original options
    setV5PreCallAttributes(span, modelInfo as V5ModelInfo, originalOptions);
    
    // Enhanced provider options telemetry
    if (originalOptions.providerOptions) {
      try {
        const provider = detectProvider(originalOptions.providerOptions);
        setProviderConfigAttributes(span, originalOptions.providerOptions, provider);
      } catch (error) {
        console.warn('Failed to set provider config attributes:', error);
      }
    }
  }

  /**
   * Override to use V5-specific post-call attributes
   */
  protected setPostCallAttributes(
    span: Span,
    _sharedResult: SharedResultInfo,
    _modelInfo: SharedModelInfo,
    originalResult: LanguageModelV2GenerateResult,
  ): void {
    // Use V5-specific attributes with original result
    const v5Result = convertV5Result(originalResult);
    setV5PostCallAttributes(span, v5Result);
    
    // Add enhanced tool call attributes if present
    if (originalResult.toolCalls && originalResult.toolCalls.length > 0) {
      // Convert to V5 tool calls for enhanced processing
      const v5ToolCalls: V5ToolCall[] = originalResult.toolCalls.map(tc => ({
        type: tc.type,
        toolCallId: tc.toolCallId,
        toolName: tc.toolName,
        args: tc.args,
        metadata: {
          source: 'complete',
          validated: false,
          validationErrors: [],
          parseErrors: [],
          argsSize: typeof tc.args === 'string' ? tc.args.length : JSON.stringify(tc.args).length,
          timestamp: Date.now(),
        },
      }));
      
      // Process and validate tool calls
      const processedToolCalls = processV5ToolCalls(v5ToolCalls, {
        validate: true,
        includeMetadata: true,
        strictMode: false,
      });
      
      // Set enhanced tool call attributes
      setV5ToolCallAttributes(span, processedToolCalls.toolCalls);
      
      // Set processing summary
      span.setAttributes({
        'gen_ai.tools.processing.validated_count': processedToolCalls.summary.validated,
        'gen_ai.tools.processing.error_count': processedToolCalls.summary.errors,
        'gen_ai.tools.processing.warning_count': processedToolCalls.summary.warnings,
      });
      
      // Set errors if any
      if (processedToolCalls.errors.length > 0) {
        span.setAttribute('gen_ai.tools.processing.errors', JSON.stringify(processedToolCalls.errors));
      }
    }
  }

  protected async executeGenerate(
    options: LanguageModelV2CallOptions,
  ): Promise<LanguageModelV2GenerateResult> {
    return this.model.doGenerate(options);
  }

  protected async executeStream(
    options: LanguageModelV2CallOptions,
  ): Promise<LanguageModelV2StreamResult> {
    return this.model.doStream(options);
  }

  protected processStreamChunk(
    chunk: LanguageModelV2StreamPart,
    metrics: StreamingMetrics,
    _startTime: number,
    span: Span,
  ): void {
    try {
      switch (chunk.type) {
        case 'text-delta':
          this.processTextDelta(chunk, metrics);
          break;
        case 'tool-call':
          this.processToolCall(chunk, metrics);
          break;
        case 'tool-call-delta':
          this.processToolCallDelta(chunk, metrics);
          break;
        case 'tool-result':
          this.processToolResult(chunk, metrics);
          break;
        case 'finish':
          this.processFinish(chunk, metrics);
          break;
        case 'error':
          this.processError(chunk, span);
          break;
        case 'response-metadata':
          this.processResponseMetadata(chunk, metrics);
          break;
        default:
          // Handle unknown chunk types gracefully
          console.warn(`Unknown v5 stream chunk type: ${(chunk as any).type}`);
          break;
      }
    } catch (error) {
      console.error('Error processing stream chunk:', error);
      // Continue streaming even if chunk processing fails
    }
  }

  private processTextDelta(chunk: LanguageModelV2StreamPart, metrics: StreamingMetrics): void {
    if (chunk.textDelta) {
      if (metrics.fullText === undefined) {
        metrics.fullText = '';
      }
      metrics.fullText += chunk.textDelta;
    }
  }

  private processToolCall(chunk: LanguageModelV2StreamPart, metrics: StreamingMetrics): void {
    if (chunk.toolCallId && chunk.toolName && chunk.args !== undefined) {
      const toolCall = {
        toolCallType: 'function' as const,
        toolCallId: chunk.toolCallId,
        toolName: chunk.toolName,
        args: chunk.args,
      };
      
      // Add enhanced validation for streaming tool calls
      try {
        const v5ToolCall: V5ToolCall = {
          type: 'function',
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          args: chunk.args,
          metadata: {
            source: 'streaming',
            validated: false,
            validationErrors: [],
            parseErrors: [],
            argsSize: typeof chunk.args === 'string' ? chunk.args.length : JSON.stringify(chunk.args).length,
            timestamp: Date.now(),
          },
        };
        
        // Validate the tool call
        const validation = validateToolCallTypes(v5ToolCall);
        if (!validation.isValid) {
          console.warn(`Invalid streaming tool call ${chunk.toolCallId}:`, validation.errors);
        }
        
        // Store the enhanced tool call
        (toolCall as any).__v5Enhanced = v5ToolCall;
        (toolCall as any).__validated = validation.isValid;
        (toolCall as any).__validationErrors = validation.errors;
        
      } catch (error) {
        console.warn(`Error processing streaming tool call ${chunk.toolCallId}:`, error);
      }
      
      metrics.toolCallsMap[chunk.toolCallId] = toolCall;
    }
  }

  private processToolCallDelta(chunk: LanguageModelV2StreamPart, metrics: StreamingMetrics): void {
    if (chunk.toolCallId) {
      if (!metrics.toolCallsMap[chunk.toolCallId]) {
        metrics.toolCallsMap[chunk.toolCallId] = {
          toolCallType: 'function' as const,
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName || '',
          args: '',
        };
      }
      
      const existingToolCall = metrics.toolCallsMap[chunk.toolCallId];
      
      // Update tool name if provided and not already set
      if (chunk.toolName && !existingToolCall.toolName) {
        existingToolCall.toolName = chunk.toolName;
      }
      
      // Accumulate args text delta
      if (chunk.argsTextDelta) {
        if (typeof existingToolCall.args === 'string') {
          existingToolCall.args += chunk.argsTextDelta;
        } else {
          existingToolCall.args = chunk.argsTextDelta;
        }
      }
      
      // If we have complete args, try to parse them
      if (chunk.args !== undefined) {
        existingToolCall.args = typeof chunk.args === 'string' ? chunk.args : JSON.stringify(chunk.args);
      }
    }
  }

  private processToolResult(chunk: LanguageModelV2StreamPart, _metrics: StreamingMetrics): void {
    // Tool results are typically handled by the application layer
    // We just log them for telemetry purposes
    if (chunk.toolCallId && chunk.result !== undefined) {
      // Could extend StreamingMetrics to track tool results if needed
      console.debug(`Tool result for ${chunk.toolCallId}:`, chunk.result);
    }
  }

  private processFinish(chunk: LanguageModelV2StreamPart, metrics: StreamingMetrics): void {
    if (chunk.usage) {
      metrics.usage = convertV5Usage(chunk.usage);
    }
    metrics.finishReason = chunk.finishReason ? convertV5FinishReason(chunk.finishReason) : undefined;
  }

  private processError(chunk: LanguageModelV2StreamPart, span: Span): void {
    if (chunk.error) {
      handleSpanError(span, chunk.error);
    }
  }

  private processResponseMetadata(chunk: LanguageModelV2StreamPart, metrics: StreamingMetrics): void {
    if (chunk.responseMetadata) {
      metrics.responseProviderMetadata = convertProviderOptions(chunk.responseMetadata);
    }
  }

  protected transformStreamResult(
    streamResult: LanguageModelV2StreamResult,
    span: Span,
    startTime: number,
  ): LanguageModelV2StreamResult {
    const metrics = createStreamingMetrics();

    // Store response metadata
    metrics.responseId = streamResult.response.id;
    metrics.responseModelId = streamResult.response.modelId;

    return {
      ...streamResult,
      stream: streamResult.stream.pipeThrough(
        new TransformStream<LanguageModelV2StreamPart, LanguageModelV2StreamPart>({
          transform: (chunk: LanguageModelV2StreamPart, controller) => {
            try {
              // Process the chunk for telemetry
              this.processStreamingChunk(chunk, metrics, startTime, span);
              
              // Pass through the original chunk unchanged
              controller.enqueue(chunk);
            } catch (error) {
              // Log error but don't break the stream
              console.error('Error processing stream chunk for telemetry:', error);
              // Still pass through the chunk
              controller.enqueue(chunk);
            }
          },
          flush: () => {
            try {
              // Finalize streaming telemetry
              this.finalizeStreaming(metrics, span);
            } catch (error) {
              console.error('Error finalizing streaming telemetry:', error);
            }
          },
        }),
      ),
    };
  }

  // Helper methods for v5 to v1 conversion

  private convertV5ToolsToV1Mode(
    tools?: LanguageModelV2Tool[],
    toolChoice?: LanguageModelV2ToolChoice,
  ): any {
    if (!tools || tools.length === 0) {
      return { type: 'regular' };
    }

    // Enhanced tool conversion with schema validation
    const convertedTools = tools.map((tool) => {
      const convertedTool = {
        type: 'function',
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      };

      // Validate schema if present
      if (tool.parameters) {
        try {
          const schemaValidation = convertV5ToolSchema(tool.parameters, {
            preserveExtensions: true,
            validateSchema: true,
          });
          convertedTool.parameters = schemaValidation;
        } catch (error) {
          console.warn(`Error processing tool schema for ${tool.name}:`, error);
        }
      }

      return convertedTool;
    });

    // Enhanced tool choice conversion
    let convertedToolChoice: any = 'auto';
    if (toolChoice) {
      try {
        const enhancedToolChoice = convertV5ToolChoice(toolChoice, {
          preserveExtensions: true,
          strictMode: false,
        });
        
        switch (enhancedToolChoice.type) {
          case 'auto':
            convertedToolChoice = 'auto';
            break;
          case 'required':
            convertedToolChoice = 'required';
            break;
          case 'none':
            convertedToolChoice = 'none';
            break;
          case 'tool':
            convertedToolChoice = {
              type: 'tool',
              toolName: enhancedToolChoice.toolName,
            };
            break;
        }
      } catch (error) {
        console.warn('Error processing tool choice:', error);
        convertedToolChoice = 'auto';
      }
    }

    return {
      type: 'regular',
      tools: convertedTools,
      toolChoice: convertedToolChoice,
    };
  }
}

/**
 * Wrapper function for AI SDK v5 models.
 *
 * @param model - The LanguageModelV2 model to wrap
 * @returns The wrapped model with telemetry
 */
export function wrapAISDKModelV5<T extends LanguageModelV2>(model: T): T {
  if (isLanguageModelV2(model)) {
    return new AxiomWrappedLanguageModelV2(model) as unknown as T;
  } else {
    console.warn('Model is not a valid LanguageModelV2. Not wrapping.');
    return model;
  }
}
