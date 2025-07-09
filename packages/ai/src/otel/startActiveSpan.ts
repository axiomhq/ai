import { type Span, type SpanOptions, SpanStatusCode, type Tracer } from '@opentelemetry/api';
import type { LocalTracer } from './localSpan';

interface Callbacks {
  onSuccess?: (span: Span) => void;
  onError?: (error: unknown, span: Span) => void;
  onFinally?: (span: Span) => void;
}

// Constants for class names to avoid magic strings
const LOCAL_TRACER_NAME = 'LocalTracer';

// Type guard to check if tracer is LocalTracer
export function isLocalTracer(tracer: Tracer | LocalTracer): tracer is LocalTracer {
  // LocalTracer is our custom implementation, so we can check for a specific property
  return 'constructor' in tracer && tracer.constructor.name === LOCAL_TRACER_NAME;
}

export const createStartActiveSpan =
  (tracer: Tracer | LocalTracer) =>
  async <T>(
    name: string,
    options: SpanOptions | null,
    fn: (span: Span) => Promise<T>,
    callbacks?: Callbacks,
  ): Promise<T> => {
    if (isLocalTracer(tracer)) {
      // Handle LocalTracer
      return tracer.startActiveSpan(name, { ...(options ?? {}) }, async (span: Span) => {
        try {
          const result = await fn(span);
          callbacks?.onSuccess?.(span);
          return result;
        } catch (error) {
          callbacks?.onError?.(error, span);
          if (error instanceof Error) {
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
          }
          throw error;
        } finally {
          callbacks?.onFinally?.(span);
          // LocalTracer handles span.end() internally
        }
      });
    } else {
      // Handle standard OpenTelemetry Tracer
      return tracer.startActiveSpan(name, { ...(options ?? {}) }, async (span: Span) => {
        try {
          const result = await fn(span);
          callbacks?.onSuccess?.(span);
          return result;
        } catch (error) {
          callbacks?.onError?.(error, span);
          if (error instanceof Error) {
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
          }
          throw error;
        } finally {
          callbacks?.onFinally?.(span);
          span.end();
        }
      });
    }
  };
