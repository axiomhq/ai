import { trace } from '@opentelemetry/api';

/**
 * Get the current trace ID from the active span
 * @returns The current trace ID or null if no trace is active
 */
export const getCurrentTraceId = (): string | null => {
  try {
    return trace.getActiveSpan()?.spanContext().traceId ?? null;
  } catch {
    return null;
  }
};
