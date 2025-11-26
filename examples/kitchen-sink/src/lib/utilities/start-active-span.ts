import { Span, SpanStatusCode, type SpanOptions } from '@opentelemetry/api';
import { tracer } from './tracer';

interface Callbacks {
  onSuccess?: (span: Span) => void;
  onError?: (error: unknown, span: Span) => void;
  onFinally?: (span: Span) => void;
}

export const startActiveSpan = async <T>(
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
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      }

      throw error;
    } finally {
      callbacks?.onFinally?.(span);
      span.end();
    }
  });
};

/**
 * @deprecated Use startActiveSpan that takes a tracer name instead as it's preferred to not export a tracer singleton
 */
export const startActiveSpan_DEPRECATED = async <T>(
  name: string,
  options: SpanOptions | null,
  fn: (span: Span) => Promise<T>,
  callbacks?: Callbacks,
): Promise<T> => {
  return startActiveSpan(name, options, fn, callbacks);
};
