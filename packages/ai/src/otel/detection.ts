import { trace, ProxyTracerProvider } from '@opentelemetry/api';

/**
 * Gets a safe type name for an object, handling minified constructors
 * @param obj The object to get the type name for
 * @returns A string representing the type, or 'unknown' if cannot be determined
 */
function getSafeTypeName(obj: any): string {
  if (!obj) return 'unknown';
  
  // Try constructor.name first (may be minified)
  if (obj.constructor?.name && obj.constructor.name !== 'Object') {
    return obj.constructor.name;
  }
  
  // Fallback to checking for specific OTel patterns
  if (obj instanceof ProxyTracerProvider) {
    return 'ProxyTracerProvider';
  }
  
  // Check for common OTel methods to infer type
  if (typeof obj.getTracer === 'function') {
    // Try to detect if it's a noop by checking if tracer creates recording spans
    try {
      const tracer = obj.getTracer('type-detection');
      if (typeof tracer.startSpan === 'function') {
        const span = tracer.startSpan('test');
        const isRecording = span?.isRecording() || false;
        span?.end();
        return isRecording ? 'ActiveTracerProvider' : 'NoopTracerProvider';
      }
    } catch {
      // Error during detection, keep trying other methods
    }
    return 'TracerProvider';
  }
  
  if (typeof obj.startSpan === 'function') {
    return 'Tracer';
  }
  
  return 'unknown';
}

/**
 * Checks if there's an active OpenTelemetry tracer provider that is not a NoopTracerProvider
 * Uses method-based detection instead of constructor.name to be more robust against minification
 * @returns true if an active OTel provider is detected
 */
export function isOtelProviderActive(): boolean {
  try {
    const provider = trace.getTracerProvider();

    // Check if it's a ProxyTracerProvider (available for import)
    if (provider instanceof ProxyTracerProvider) {
      return false;
    }

    // Check if provider has expected methods
    if (typeof provider.getTracer !== 'function') {
      return false;
    }

    // Get a tracer and check if it has expected methods
    const tracer = provider.getTracer('test');
    if (typeof tracer.startSpan !== 'function' || typeof tracer.startActiveSpan !== 'function') {
      return false;
    }

    // Test if the tracer is functional by attempting to create a span
    // NoopTracer will return a NonRecordingSpan which has limited functionality
    const span = tracer.startSpan('test-span');
    if (!span) {
      return false;
    }

    // Check if the span has recording capabilities
    // NonRecordingSpan (from NoopTracer) returns false for isRecording()
    const isRecording = span.isRecording();
    
    // Clean up the test span
    span.end();

    return isRecording;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if there's an active span in the current context
 * @returns true if there's an active span
 */
export function hasActiveSpan(): boolean {
  try {
    const activeSpan = trace.getActiveSpan();
    return activeSpan != null && activeSpan.spanContext().traceId !== '0';
  } catch (error) {
    return false;
  }
}

/**
 * Check for active OpenTelemetry instrumentation
 * This checks both for an active provider and potential active spans
 * @returns true if active OTel instrumentation is detected
 */
export function hasActiveOtelInstrumentation(): boolean {
  return isOtelProviderActive() || hasActiveSpan();
}

/**
 * Gets information about the current OTel setup for debugging
 * @returns object with details about the current OTel state
 */
export function getOtelDebugInfo(): {
  hasActiveProvider: boolean;
  hasActiveSpan: boolean;
  providerType: string;
  tracerType: string;
  spanId?: string;
  traceId?: string;
} {
  const hasActiveProvider = isOtelProviderActive();
  const hasActiveSpanValue = hasActiveSpan();

  let providerType = 'unknown';
  let tracerType = 'unknown';
  let spanId: string | undefined;
  let traceId: string | undefined;

  try {
    const provider = trace.getTracerProvider();
    providerType = getSafeTypeName(provider);

    const tracer = provider.getTracer('debug');
    tracerType = getSafeTypeName(tracer);

    if (hasActiveSpanValue) {
      const activeSpan = trace.getActiveSpan();
      if (activeSpan) {
        const spanContext = activeSpan.spanContext();
        spanId = spanContext.spanId;
        traceId = spanContext.traceId;
      }
    }
  } catch (error) {
    // Error getting debug info, keep defaults
  }

  return {
    hasActiveProvider,
    hasActiveSpan: hasActiveSpanValue,
    providerType,
    tracerType,
    spanId,
    traceId,
  };
}
