import { trace, ProxyTracerProvider } from '@opentelemetry/api';

// OpenTelemetry class names
const NOOP_TRACER_PROVIDER_NAME = 'NoopTracerProvider';
const NOOP_TRACER_NAME = 'NoopTracer';

/**
 * Checks if there's an active OpenTelemetry tracer provider that is not a NoopTracerProvider
 * @returns true if an active OTel provider is detected
 */
export function isOtelProviderActive(): boolean {
  try {
    const provider = trace.getTracerProvider();

    // Check if it's a ProxyTracerProvider (available for import)
    if (provider instanceof ProxyTracerProvider) {
      return false;
    }

    // Check for NoopTracerProvider by constructor name
    if (provider.constructor.name === NOOP_TRACER_PROVIDER_NAME) {
      return false;
    }

    // Additional check: try to get a tracer and see if it's a noop tracer
    const tracer = provider.getTracer('test');
    const tracerConstructorName = tracer.constructor.name;

    return tracerConstructorName !== NOOP_TRACER_NAME;
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
 * Comprehensive check for active OpenTelemetry instrumentation
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
    providerType = provider.constructor.name;

    const tracer = provider.getTracer('debug');
    tracerType = tracer.constructor.name;

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
