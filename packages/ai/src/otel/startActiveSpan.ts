import { type Span, type SpanOptions, SpanStatusCode, type Tracer } from '@opentelemetry/api';

interface Callbacks {
  onSuccess?: (span: Span) => void;
  onError?: (error: unknown, span: Span) => void;
  onFinally?: (span: Span) => void;
  /**
   * If true, the operation will call span.end() manually.
   * Used for streaming operations where the span should remain open until stream consumption completes.
   */
  manualEnd?: boolean;
}

export const createStartActiveSpan =
  (tracer: Tracer) =>
  async <T>(
    name: string,
    options: SpanOptions | null,
    fn: (span: Span) => Promise<T>,
    callbacks?: Callbacks,
  ): Promise<T> => {
    return tracer.startActiveSpan(name, { ...(options ?? {}) }, async (span) => {
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

        // Only auto-end the span if manualEnd is not set
        // For streaming operations, the operation itself will call span.end() when the stream completes
        if (!callbacks?.manualEnd) {
          span.end();
        }
      }
    });
  };
