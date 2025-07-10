/**
 * Base wrapper class with common telemetry logic for both v4 and v5 implementations.
 * 
 * This abstract class provides shared OpenTelemetry span handling, attribute setting,
 * and lifecycle management that can be extended by version-specific implementations.
 */

import type { Span } from '@opentelemetry/api';
import {
  withSpanHandling,
  setScopeAttributes,
  setPreCallAttributes,
  setPostCallAttributes,
  handleSpanError,
  updateStreamingMetrics,
  finalizeStreamingResult,
  type SharedModelInfo,
  type SharedCallOptions,
  type SharedResultInfo,
  type StreamingMetrics,
} from './vercel-shared';
import { isSupportedLanguageModel, detectAISDKVersion } from './vercel-types';

/**
 * Abstract base class for language model wrappers that provides common telemetry logic.
 * 
 * This class handles:
 * - Span creation and reuse logic (withSpan pattern)
 * - Common attribute setting (model info, timing, usage)
 * - Error handling and span finalization
 * - Basic validation and type checking
 * - Streaming metrics collection
 * 
 * Subclasses must implement version-specific methods for:
 * - Message conversion (different formats for v4/v5)
 * - Streaming chunk processing (different types)
 * - Tool call handling (untyped vs typed)
 * - Provider metadata/options handling
 */
export abstract class BaseLanguageModelWrapper<TModel, TCallOptions, TGenerateResult, TStreamResult, TStreamPart> {
  protected readonly modelInfo: SharedModelInfo;

  constructor(protected readonly model: TModel) {
    if (!this.isValidModel(model)) {
      throw new Error('Invalid model: does not implement supported specification version');
    }

    this.modelInfo = this.extractModelInfo(model);
    this.validateModelVersion(model);
  }

  // Abstract methods that subclasses must implement

  /**
   * Validate that the model is of the correct type for this wrapper.
   */
  protected abstract isValidModel(model: unknown): model is TModel;

  /**
   * Extract model information from the model object.
   */
  protected abstract extractModelInfo(model: TModel): SharedModelInfo;

  /**
   * Validate that the model version is supported by this wrapper.
   */
  protected abstract validateModelVersion(model: TModel): void;

  /**
   * Convert call options to shared format for telemetry.
   */
  protected abstract convertCallOptions(options: TCallOptions): SharedCallOptions;

  /**
   * Convert generate result to shared format for telemetry.
   */
  protected abstract convertGenerateResult(result: TGenerateResult): SharedResultInfo;

  /**
   * Process a streaming chunk and update metrics.
   */
  protected abstract processStreamChunk(
    chunk: TStreamPart,
    metrics: StreamingMetrics,
    startTime: number,
    span: Span,
  ): void;

  /**
   * Execute the actual generate call on the underlying model.
   */
  protected abstract executeGenerate(options: TCallOptions): Promise<TGenerateResult>;

  /**
   * Execute the actual stream call on the underlying model.
   */
  protected abstract executeStream(options: TCallOptions): Promise<TStreamResult>;

  /**
   * Transform the stream result to include telemetry processing.
   */
  protected abstract transformStreamResult(
    streamResult: TStreamResult,
    span: Span,
    startTime: number,
  ): TStreamResult;

  // Common telemetry methods

  /**
   * Handle span lifecycle for generate operations.
   */
  protected async handleGenerate(options: TCallOptions): Promise<TGenerateResult> {
    return withSpanHandling(this.modelInfo, async (span: Span) => {
      try {
        // Set common attributes
        setScopeAttributes(span);
        
        const sharedOptions = this.convertCallOptions(options);
        this.setPreCallAttributes(span, this.modelInfo, sharedOptions, options);

        // Execute the actual generate call
        const result = await this.executeGenerate(options);

        // Set post-call attributes
        const sharedResult = this.convertGenerateResult(result);
        this.setPostCallAttributes(span, sharedResult, this.modelInfo, result);

        return result;
      } catch (error) {
        handleSpanError(span, error);
        throw error;
      }
    });
  }

  /**
   * Handle span lifecycle for stream operations.
   */
  protected async handleStream(options: TCallOptions): Promise<TStreamResult> {
    return withSpanHandling(this.modelInfo, async (span: Span) => {
      try {
        const startTime = Date.now() / 1000; // Unix timestamp

        // Set common attributes
        setScopeAttributes(span);
        
        const sharedOptions = this.convertCallOptions(options);
        this.setPreCallAttributes(span, this.modelInfo, sharedOptions, options);

        // Execute the actual stream call
        const streamResult = await this.executeStream(options);

        // Transform the stream to include telemetry processing
        return this.transformStreamResult(streamResult, span, startTime);
      } catch (error) {
        handleSpanError(span, error);
        throw error;
      }
    });
  }

  /**
   * Process streaming chunks with common telemetry logic.
   */
  protected processStreamingChunk(
    chunk: TStreamPart,
    metrics: StreamingMetrics,
    startTime: number,
    span: Span,
  ): void {
    // Update time to first token if this is the first chunk
    updateStreamingMetrics(metrics, startTime, span);

    // Process version-specific chunk data
    this.processStreamChunk(chunk, metrics, startTime, span);
  }

  /**
   * Finalize streaming with common telemetry logic.
   */
  protected finalizeStreaming(metrics: StreamingMetrics, span: Span): void {
    const sharedResult = finalizeStreamingResult(metrics);
    this.setPostCallAttributes(span, sharedResult, this.modelInfo, {} as TGenerateResult);
  }

  /**
   * Get model provider name.
   */
  get provider(): string {
    return this.modelInfo.provider;
  }

  /**
   * Get model identifier.
   */
  get modelId(): string {
    return this.modelInfo.modelId;
  }

  /**
   * Set pre-call attributes - can be overridden by subclasses for version-specific handling
   */
  protected setPreCallAttributes(
    span: Span,
    modelInfo: SharedModelInfo,
    sharedOptions: SharedCallOptions,
    _originalOptions: TCallOptions,
  ): void {
    setPreCallAttributes(span, modelInfo, sharedOptions);
  }

  /**
   * Set post-call attributes - can be overridden by subclasses for version-specific handling
   */
  protected setPostCallAttributes(
    span: Span,
    sharedResult: SharedResultInfo,
    _modelInfo: SharedModelInfo,
    _originalResult: TGenerateResult,
  ): void {
    setPostCallAttributes(span, sharedResult);
  }
}

/**
 * Utility class for common validation logic across wrapper implementations.
 */
export class ModelValidation {
  /**
   * Validate that a model is supported by the wrapper system.
   */
  static validateSupportedModel(model: unknown): void {
    if (!isSupportedLanguageModel(model)) {
      const versionInfo = detectAISDKVersion(model);
      throw new Error(
        `Unsupported model: ${versionInfo.specificationVersion ? 
          `specification version ${versionInfo.specificationVersion} is not supported` : 
          'no valid specification version found'}`
      );
    }
  }

  /**
   * Validate that a model matches the expected specification version.
   */
  static validateModelVersion(model: unknown, expectedVersion: 'v1' | 'v2'): void {
    const versionInfo = detectAISDKVersion(model);
    if (versionInfo.specificationVersion !== expectedVersion) {
      throw new Error(
        `Model version mismatch: expected ${expectedVersion}, got ${versionInfo.specificationVersion || 'unknown'}`
      );
    }
  }
}

/**
 * Type helper for ensuring consistent model info extraction.
 */
export interface ModelInfoExtractor<T> {
  (model: T): SharedModelInfo;
}

/**
 * Type helper for ensuring consistent call options conversion.
 */
export interface CallOptionsConverter<TCallOptions> {
  (options: TCallOptions): SharedCallOptions;
}

/**
 * Type helper for ensuring consistent result conversion.
 */
export interface ResultConverter<TResult> {
  (result: TResult): SharedResultInfo;
}
