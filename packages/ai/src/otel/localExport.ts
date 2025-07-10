import type { LocalSpanData, FlushHandler } from './localSpan';
import { getSpanBuffer } from './localSpan';
import { AxiomLocalExporter } from './exporters/axiom';
import { OtlpLocalExporter } from './exporters/otlp';

interface AxiomConfig {
  url: string;
  token: string;
  dataset: string;
  timeout?: number;
}

interface OtlpConfig {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

interface ConsoleConfig {
  format?: 'json' | 'compact';
  includeAttributes?: boolean;
}

interface CustomConfig {
  exportFn: (spans: LocalSpanData[]) => Promise<void> | void;
}

type LocalExportConfig =
  | { type: 'axiom'; config: AxiomConfig }
  | { type: 'otlp'; config: OtlpConfig }
  | { type: 'console'; config: ConsoleConfig }
  | { type: 'custom'; config: CustomConfig };

type ExportStatus = 'none' | 'axiom' | 'otlp' | 'console' | 'custom';

enum ExportErrorType {
  CONFIGURATION = 'configuration',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN = 'unknown',
}

class ExportError extends Error {
  constructor(
    public readonly type: ExportErrorType,
    public readonly message: string,
    public readonly retryable: boolean = false,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

interface ExportMetrics {
  successCount: number;
  failureCount: number;
  totalAttempts: number;
  lastSuccessTime?: number;
  lastFailureTime?: number;
  averageLatency: number;
  failuresByType: Record<ExportErrorType, number>;
}

enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  openTimeout: number;
  resetTimeout: number;
}

class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.openTimeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
      } else {
        throw new ExportError(
          ExportErrorType.NETWORK,
          'Circuit breaker is open - too many recent failures',
          false,
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitBreakerState.CLOSED;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

abstract class BaseLocalExporter {
  abstract export(spans: LocalSpanData[]): Promise<void> | void;
}

let currentExportConfig: LocalExportConfig | null = null;
let currentExporter: BaseLocalExporter | null = null;
let exportFlushHandler: FlushHandler | null = null;
let exportManager: ExportManager | null = null;

class ExportManager {
  private circuitBreaker: CircuitBreaker;
  private metrics: ExportMetrics;
  private readonly maxRetries: number;
  private readonly baseRetryDelay: number;
  private readonly retryJitter: number;

  constructor(
    private exporter: BaseLocalExporter,
    config: {
      maxRetries?: number;
      baseRetryDelay?: number;
      retryJitter?: number;
      circuitBreaker?: CircuitBreakerConfig;
    } = {},
  ) {
    this.maxRetries = config.maxRetries || 3;
    this.baseRetryDelay = config.baseRetryDelay || 1000;
    this.retryJitter = config.retryJitter || 0.1;

    this.circuitBreaker = new CircuitBreaker(
      config.circuitBreaker || {
        failureThreshold: 5,
        openTimeout: 30000,
        resetTimeout: 60000,
      },
    );

    this.metrics = {
      successCount: 0,
      failureCount: 0,
      totalAttempts: 0,
      averageLatency: 0,
      failuresByType: {
        [ExportErrorType.CONFIGURATION]: 0,
        [ExportErrorType.NETWORK]: 0,
        [ExportErrorType.TIMEOUT]: 0,
        [ExportErrorType.VALIDATION]: 0,
        [ExportErrorType.AUTHENTICATION]: 0,
        [ExportErrorType.RATE_LIMIT]: 0,
        [ExportErrorType.UNKNOWN]: 0,
      },
    };
  }

  async export(spans: LocalSpanData[]): Promise<void> {
    if (spans.length === 0) return;

    const startTime = Date.now();
    this.metrics.totalAttempts++;

    try {
      await this.circuitBreaker.execute(async () => {
        await this.exportWithRetry(spans);
      });

      this.metrics.successCount++;
      this.metrics.lastSuccessTime = Date.now();
      this.updateAverageLatency(startTime);
    } catch (error) {
      this.metrics.failureCount++;
      this.metrics.lastFailureTime = Date.now();

      const exportError = this.categorizeError(error);
      this.metrics.failuresByType[exportError.type]++;

      this.logExportError(exportError, spans.length);

      // Don't re-throw - export failures shouldn't break the application
    }
  }

  private async exportWithRetry(spans: LocalSpanData[]): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await this.exporter.export(spans);
        return; // Success!
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const exportError = this.categorizeError(lastError);

        // Don't retry non-retryable errors
        if (!exportError.retryable || attempt === this.maxRetries) {
          throw exportError;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateRetryDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Export failed after retries');
  }

  private calculateRetryDelay(attempt: number): number {
    const exponentialDelay = this.baseRetryDelay * Math.pow(2, attempt);
    const jitter = Math.random() * this.retryJitter * exponentialDelay;
    return exponentialDelay + jitter;
  }

  private categorizeError(error: unknown): ExportError {
    if (error instanceof ExportError) {
      return error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown';

    if (errorName === 'AbortError' || errorMessage.includes('timeout')) {
      return new ExportError(
        ExportErrorType.TIMEOUT,
        `Export timeout: ${errorMessage}`,
        true,
        error instanceof Error ? error : undefined,
      );
    }

    if (
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('network') ||
      errorMessage.includes('connection')
    ) {
      return new ExportError(
        ExportErrorType.NETWORK,
        `Network error: ${errorMessage}`,
        true,
        error instanceof Error ? error : undefined,
      );
    }

    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      return new ExportError(
        ExportErrorType.AUTHENTICATION,
        `Authentication failed: ${errorMessage}. Please check your credentials.`,
        false,
        error instanceof Error ? error : undefined,
      );
    }

    if (errorMessage.includes('429')) {
      return new ExportError(
        ExportErrorType.RATE_LIMIT,
        `Rate limit exceeded: ${errorMessage}`,
        true,
        error instanceof Error ? error : undefined,
      );
    }

    if (errorMessage.includes('400') || errorMessage.includes('422')) {
      return new ExportError(
        ExportErrorType.VALIDATION,
        `Validation error: ${errorMessage}`,
        false,
        error instanceof Error ? error : undefined,
      );
    }

    if (
      errorMessage.includes('500') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('504')
    ) {
      return new ExportError(
        ExportErrorType.NETWORK,
        `Server error: ${errorMessage}`,
        true,
        error instanceof Error ? error : undefined,
      );
    }

    return new ExportError(
      ExportErrorType.UNKNOWN,
      `Unknown export error: ${errorMessage}`,
      true,
      error instanceof Error ? error : undefined,
    );
  }

  private logExportError(error: ExportError, spanCount: number): void {
    const timestamp = new Date().toISOString();
    const retryable = error.retryable ? 'retryable' : 'non-retryable';

    console.error(
      `[AxiomAI Export] ${timestamp} - Export failed (${error.type}, ${retryable}): ${error.message}`,
    );
    console.error(`[AxiomAI Export] Failed to export ${spanCount} spans`);

    // Add suggestions for common errors
    switch (error.type) {
      case ExportErrorType.AUTHENTICATION:
        console.error(
          '[AxiomAI Export] Suggestion: Check your authentication credentials (token, API key, etc.)',
        );
        break;
      case ExportErrorType.NETWORK:
        console.error(
          '[AxiomAI Export] Suggestion: Check your network connection and endpoint URL',
        );
        break;
      case ExportErrorType.CONFIGURATION:
        console.error(
          '[AxiomAI Export] Suggestion: Review your export configuration for invalid values',
        );
        break;
      case ExportErrorType.VALIDATION:
        console.error('[AxiomAI Export] Suggestion: Check span data format and required fields');
        break;
    }
  }

  private updateAverageLatency(startTime: number): void {
    const latency = Date.now() - startTime;
    const totalLatency = this.metrics.averageLatency * (this.metrics.successCount - 1) + latency;
    this.metrics.averageLatency = totalLatency / this.metrics.successCount;
  }

  getMetrics(): ExportMetrics {
    return { ...this.metrics };
  }

  getCircuitBreakerState(): CircuitBreakerState {
    return this.circuitBreaker.getState();
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }
}

function validateAxiomConfig(config: AxiomConfig): void {
  const errors: string[] = [];

  if (!config.url) {
    errors.push(
      'Axiom URL is required. Set it to your Axiom instance URL (e.g., "https://axiom.co")',
    );
  } else {
    try {
      new URL(config.url);
    } catch {
      errors.push(
        `Invalid Axiom URL format: "${config.url}". Must be a valid URL (e.g., "https://axiom.co")`,
      );
    }
  }

  if (!config.token) {
    errors.push(
      'Axiom token is required. Get it from your Axiom settings page or use process.env.AXIOM_TOKEN',
    );
  } else if (config.token.length < 10) {
    errors.push('Axiom token appears to be too short. Please verify your token is correct');
  }

  if (!config.dataset) {
    errors.push('Axiom dataset is required. Specify the dataset name where spans will be stored');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(config.dataset)) {
    errors.push(
      `Invalid dataset name: "${config.dataset}". Dataset names can only contain letters, numbers, hyphens, and underscores`,
    );
  }

  if (config.timeout !== undefined) {
    if (typeof config.timeout !== 'number') {
      errors.push('Axiom timeout must be a number');
    } else if (config.timeout < 1000 || config.timeout > 60000) {
      errors.push('Axiom timeout must be between 1000ms and 60000ms (1-60 seconds)');
    }
  }

  if (errors.length > 0) {
    throw new ExportError(
      ExportErrorType.CONFIGURATION,
      `Axiom configuration errors:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}

function validateOtlpConfig(config: OtlpConfig): void {
  const errors: string[] = [];

  if (!config.url) {
    errors.push(
      'OTLP URL is required. Set it to your OTLP endpoint (e.g., "http://localhost:4318/v1/traces")',
    );
  } else {
    try {
      const url = new URL(config.url);
      if (!url.pathname.includes('/v1/traces')) {
        errors.push(`OTLP URL should include "/v1/traces" path. Current URL: "${config.url}"`);
      }
    } catch {
      errors.push(
        `Invalid OTLP URL format: "${config.url}". Must be a valid URL (e.g., "http://localhost:4318/v1/traces")`,
      );
    }
  }

  if (config.timeout !== undefined) {
    if (typeof config.timeout !== 'number') {
      errors.push('OTLP timeout must be a number');
    } else if (config.timeout < 1000 || config.timeout > 60000) {
      errors.push('OTLP timeout must be between 1000ms and 60000ms (1-60 seconds)');
    }
  }

  if (config.headers) {
    if (typeof config.headers !== 'object' || Array.isArray(config.headers)) {
      errors.push('OTLP headers must be an object with string keys and values');
    } else {
      for (const [key, value] of Object.entries(config.headers)) {
        if (typeof key !== 'string' || typeof value !== 'string') {
          errors.push(`Invalid header: "${key}" must be a string key with string value`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new ExportError(
      ExportErrorType.CONFIGURATION,
      `OTLP configuration errors:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}

function validateConsoleConfig(config: ConsoleConfig): void {
  const errors: string[] = [];

  if (config.format && !['json', 'compact'].includes(config.format)) {
    errors.push(`Console format must be "json" or "compact", got: "${config.format}"`);
  }

  if (config.includeAttributes !== undefined && typeof config.includeAttributes !== 'boolean') {
    errors.push('Console includeAttributes must be a boolean value');
  }

  if (errors.length > 0) {
    throw new ExportError(
      ExportErrorType.CONFIGURATION,
      `Console configuration errors:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}

function validateCustomConfig(config: CustomConfig): void {
  const errors: string[] = [];

  if (typeof config.exportFn !== 'function') {
    errors.push(
      'Custom export function must be a function. Example: (spans) => { /* your export logic */ }',
    );
  }

  if (errors.length > 0) {
    throw new ExportError(
      ExportErrorType.CONFIGURATION,
      `Custom configuration errors:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}

class ConsoleLocalExporter extends BaseLocalExporter {
  constructor(private config: ConsoleConfig) {
    super();
  }

  export(spans: LocalSpanData[]): void {
    const format = this.config.format || 'compact';
    const includeAttributes = this.config.includeAttributes ?? true;

    if (format === 'json') {
      const exportData = {
        timestamp: new Date().toISOString(),
        spanCount: spans.length,
        spans: spans.map((span) => ({
          traceId: span.traceId,
          spanId: span.spanId,
          parentSpanId: span.parentSpanId,
          name: span.name,
          startTime: new Date(span.startTime).toISOString(),
          endTime: span.endTime ? new Date(span.endTime).toISOString() : undefined,
          duration: span.endTime ? span.endTime - span.startTime : undefined,
          attributes: includeAttributes ? span.attributes : undefined,
          status: span.status,
          events: span.events,
          exceptions: span.exceptions,
        })),
      };
      console.log(`[AxiomAI Export] Console export (${spans.length} spans):`);
      console.log(JSON.stringify(exportData, null, 2));
    } else {
      console.log(`[AxiomAI Export] Console export (${spans.length} spans):`);
      spans.forEach((span) => {
        const duration = span.endTime ? span.endTime - span.startTime : 'ongoing';
        console.log(`  ${span.name} (${span.spanId}) - ${duration}ms`);
        if (includeAttributes && Object.keys(span.attributes).length > 0) {
          console.log(`    Attributes: ${JSON.stringify(span.attributes)}`);
        }
      });
    }
  }
}

// Custom exporter wrapper
class CustomLocalExporter extends BaseLocalExporter {
  constructor(private config: CustomConfig) {
    super();
  }

  async export(spans: LocalSpanData[]): Promise<void> {
    // Handle both sync and async export functions
    // by wrapping the call in Promise.resolve
    const result = this.config.exportFn(spans);
    await Promise.resolve(result);
  }
}

// Factory function to create exporters
function createExporter(config: LocalExportConfig): BaseLocalExporter {
  switch (config.type) {
    case 'axiom':
      return new AxiomLocalExporter(config.config);
    case 'otlp':
      return new OtlpLocalExporter(config.config);
    case 'console':
      return new ConsoleLocalExporter(config.config);
    case 'custom':
      return new CustomLocalExporter(config.config);
    default:
      throw new Error(`Unsupported export type: ${(config as any).type}`);
  }
}

// Export flush handler that calls the current export manager
async function createExportFlushHandler(): Promise<FlushHandler> {
  return async (spans: LocalSpanData[]) => {
    if (exportManager && spans.length > 0) {
      await exportManager.export(spans);
    }
  };
}

/**
 * Configure local span export to external backends.
 *
 * When no OpenTelemetry setup exists, local spans are created for observability.
 * This function configures these spans to be exported to external backends
 * in addition to the default console logging.
 *
 * @param config Export configuration object
 * @param config.type The type of export backend ('axiom', 'otlp', 'console', 'custom')
 * @param config.config Backend-specific configuration
 *
 * @example
 * ```typescript
 * // Configure Axiom export
 * await configureLocalExport({
 *   type: 'axiom',
 *   config: {
 *     url: process.env.AXIOM_URL!,
 *     token: process.env.AXIOM_TOKEN!,
 *     dataset: process.env.AXIOM_DATASET!
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Configure OTLP export
 * await configureLocalExport({
 *   type: 'otlp',
 *   config: {
 *     url: 'http://localhost:4318/v1/traces',
 *     headers: { 'Authorization': 'Bearer token' }
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Configure custom export
 * await configureLocalExport({
 *   type: 'custom',
 *   config: {
 *     exportFn: async (spans) => {
 *       await sendToMyBackend(spans);
 *     }
 *   }
 * });
 * ```
 *
 * @throws {ExportError} When configuration validation fails
 */
export async function configureLocalExport(config: LocalExportConfig): Promise<void> {
  // Validate configuration
  switch (config.type) {
    case 'axiom':
      validateAxiomConfig(config.config);
      break;
    case 'otlp':
      validateOtlpConfig(config.config);
      break;
    case 'console':
      validateConsoleConfig(config.config);
      break;
    case 'custom':
      validateCustomConfig(config.config);
      break;
    default:
      throw new Error(`Unsupported export type: ${(config as any).type}`);
  }

  // Remove existing export handler if present
  if (exportFlushHandler) {
    getSpanBuffer().removeFlushHandler(exportFlushHandler);
  }

  // Create new exporter, manager and handler
  currentExportConfig = config;
  currentExporter = createExporter(config);
  exportManager = new ExportManager(currentExporter);
  exportFlushHandler = await createExportFlushHandler();

  // Register with span buffer
  getSpanBuffer().addFlushHandler(exportFlushHandler);
}

/**
 * Disable local span export and return to local-only mode.
 *
 * This stops exporting spans to external backends and removes all
 * export handlers. Local spans will continue to be logged to console.
 *
 * @example
 * ```typescript
 * // Disable export and return to console-only logging
 * disableLocalExport();
 * ```
 */
export function disableLocalExport(): void {
  if (exportFlushHandler) {
    getSpanBuffer().removeFlushHandler(exportFlushHandler);
    exportFlushHandler = null;
  }
  currentExportConfig = null;
  currentExporter = null;
  exportManager = null;
}

/**
 * Get the current export status.
 *
 * @returns The current export backend type, or 'none' if no export is configured
 *
 * @example
 * ```typescript
 * const status = getLocalExportStatus();
 * if (status === 'none') {
 *   console.log('No export configured');
 * } else {
 *   console.log(`Exporting to: ${status}`);
 * }
 * ```
 */
export function getLocalExportStatus(): ExportStatus {
  return currentExportConfig?.type || 'none';
}

/**
 * Manually flush local spans to trigger immediate export.
 *
 * Normally spans are flushed automatically based on time intervals or
 * batch sizes. This function forces an immediate flush of all pending spans.
 *
 * @example
 * ```typescript
 * // Force immediate export of all pending spans
 * await flushLocalSpans();
 * ```
 */
export async function flushLocalSpans(): Promise<void> {
  return getSpanBuffer().forceFlush();
}

/**
 * Get export metrics for monitoring export health.
 *
 * @returns Export metrics including success/failure counts, latency, and error types
 *
 * @example
 * ```typescript
 * const metrics = getExportMetrics();
 * if (metrics) {
 *   console.log(`Success: ${metrics.successCount}, Failures: ${metrics.failureCount}`);
 *   console.log(`Average latency: ${metrics.averageLatency}ms`);
 *   console.log(`Error types:`, metrics.failuresByType);
 * }
 * ```
 */
export function getExportMetrics(): ExportMetrics | null {
  return exportManager?.getMetrics() || null;
}

/**
 * Get the current circuit breaker state.
 *
 * The circuit breaker prevents cascading failures by temporarily disabling
 * exports when too many consecutive failures occur.
 *
 * @returns Circuit breaker state ('closed', 'open', or 'half_open')
 *
 * @example
 * ```typescript
 * const state = getCircuitBreakerState();
 * if (state === 'open') {
 *   console.log('Circuit breaker is open - exports are temporarily disabled');
 * }
 * ```
 */
export function getCircuitBreakerState(): CircuitBreakerState | null {
  return exportManager?.getCircuitBreakerState() || null;
}

/**
 * Reset circuit breaker (useful for recovery)
 */
export function resetCircuitBreaker(): void {
  exportManager?.resetCircuitBreaker();
}

/**
 * Get comprehensive export debug information
 */
export function getExportDebugInfo(): {
  status: ExportStatus;
  config: LocalExportConfig | null;
  metrics: ExportMetrics | null;
  circuitBreakerState: CircuitBreakerState | null;
  lastError?: {
    type: ExportErrorType;
    message: string;
    timestamp: string;
  };
} {
  const metrics = getExportMetrics();
  const lastError = metrics?.lastFailureTime
    ? {
        type: ExportErrorType.UNKNOWN, // We don't store the last error type currently
        message: 'See console logs for detailed error information',
        timestamp: new Date(metrics.lastFailureTime).toISOString(),
      }
    : undefined;

  return {
    status: getLocalExportStatus(),
    config: currentExportConfig,
    metrics,
    circuitBreakerState: getCircuitBreakerState(),
    lastError,
  };
}

// Export types for external use
export type {
  LocalExportConfig,
  AxiomConfig,
  OtlpConfig,
  ConsoleConfig,
  CustomConfig,
  ExportStatus,
  ExportMetrics,
};

// Export the error class and enum separately
export { ExportError, ExportErrorType };
