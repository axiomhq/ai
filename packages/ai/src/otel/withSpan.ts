import {
  context,
  propagation,
  trace,
  SpanStatusCode,
  type Span,
  type Baggage,
  type Tracer,
} from '@opentelemetry/api';

import { WITHSPAN_BAGGAGE_KEY } from './withSpanBaggageKey';
import { getTracer } from './utils/wrapperUtils';

/**
 * Metadata for categorizing and tracking spans within the AI application.
 */
type WithSpanMeta = {
  /** High-level capability being performed (e.g., 'text_generation', 'chat', 'analysis') */
  capability: string;
  /** Specific step within the capability (e.g., 'generate_response', 'summarize', 'extract') */
  step: string;
};

/**
 * Wrap Vercel AI SDK functions like `generateText` and `streamText` in an OpenTelemetry span.
 *
 * Automatically detects and handles different response types:
 * - **Response streams**: Keeps span alive during entire stream consumption
 * - **Streaming objects**: Warns about incorrect usage patterns
 * - **Regular objects**: Ends span immediately after function completion
 *
 * The span name will be updated by the AI SDK middleware from 'gen_ai.call_llm'
 * to a model-specific name like 'chat gpt-4o-mini' when used with wrapped models.
 *
 * @param meta - Span metadata for categorization and tracking
 * @param meta.capability - High-level capability being performed (e.g., 'customer_support', 'meeting_summarizer')
 * @param meta.step - Specific step within the capability (e.g., 'categorize_message', 'transcribe_audio')
 * @param fn - Function to execute within the span context. Receives the span as a parameter so you can add additional attributes.
 * @param opts - Optional configuration
 * @param opts.tracer - Custom OpenTelemetry tracer instance. Defaults to the tracer provided by `initAxiomAI`.
 * @param opts.timeoutMs - Timeout for abandoned streams. Defaults to 600,000 (10 minutes).
 *
 * @returns Promise that resolves to the same value as the wrapped function
 *
 * @example 
 * // Non-streaming usage
 * const result = await withSpan(
 *   { capability: 'text_generation', step: 'generate' },
 *   async (span) => {
 *     span.setAttribute('user.id', userId); // can set attributes on the span
 *     const result = await generateObject({ model, prompt });
 *     // can do something with the result here, eg set additional attributes
 *     return result
 *   }
 * );
 *
 * @example 
 * // Streaming usage with `@ai-sdk/react` in the frontend
 * ```ts
 * const response = withSpan(
 *   { capability: 'chat', step: 'stream_chat' },
 *   async (span) => {
 *     span.setAttribute('user.id', userId);
 *     const result = streamText({ model, messages });
 *     return result.toUIMessageStreamResponse();
 *   }
 * );
 * ```
 * 
 * @example 
 * // Streaming usage with express
 * ```ts
 * await withSpan(
 *   { capability: 'chat', step: 'stream_chat' },
 *   async (span) => {
 *     span.setAttribute('user.id', userId);
 *
 *     const { textStream } = streamText({ model, messages });
 *
 *     // Keep span open during entire stream consumption
 *     for await (const chunk of textStream) {
 *       res.write(chunk);
 *     }
 *   }
 * );

 * res.end();
 * ```
 */
export function withSpan<Return>(
  meta: WithSpanMeta,
  fn: (span: Span) => Promise<Return>,
  opts?: {
    tracer?: Tracer;
    timeoutMs?: number;
  },
): Promise<Return> {
  const tracer = opts?.tracer ?? getTracer();

  // Create span manually to control its lifecycle
  const span = tracer.startSpan('gen_ai.call_llm');
  const spanContext = trace.setSpan(context.active(), span);

  return context.with(spanContext, async () => {
    if (!span.isRecording()) {
      const provider = trace.getTracerProvider();
      const providerIsNoOp = provider.constructor.name === 'NoopTracerProvider';

      // We don't warn for other non-recording cases (sampling=DROP, etc.) as those may be intentional
      if (providerIsNoOp) {
        console.warn(
          '[AxiomAI] No TracerProvider registered - spans are no-op. Make sure to call initAxiomAI() after your OpenTelemetry SDK has started.',
        );
      }
    }

    const bag: Baggage = propagation.createBaggage({
      capability: { value: meta.capability },
      step: { value: meta.step },
      // TODO: maybe we can just check the active span name instead?
      [WITHSPAN_BAGGAGE_KEY]: { value: 'true' }, // Mark that we're inside withSpan
    });

    const ctx = propagation.setBaggage(context.active(), bag);

    let spanEnded = false;
    const safeEndSpan = () => {
      if (!spanEnded) {
        spanEnded = true;
        span.end();
      }
    };

    // Timeout fallback for abandoned streams
    const timeoutMs = opts?.timeoutMs ?? 600_000; // 10 minutes default
    const timeoutId = setTimeout(() => {
      safeEndSpan();
    }, timeoutMs);

    try {
      const result = await context.with(ctx, () => fn(span));

      // Auto-detect Response streams and keep span alive during consumption
      if (result instanceof Response && result.body) {
        // Check if body is already locked
        if (result.body.locked) {
          console.warn('[AxiomAI] Response body is already locked, cannot instrument stream');
          clearTimeout(timeoutId);
          safeEndSpan();
          return result;
        }

        const originalReader = result.body.getReader();
        const wrappedStream = new ReadableStream({
          async pull(controller) {
            try {
              const { value, done } = await context.with(ctx, () => originalReader.read());
              if (done) {
                originalReader.releaseLock?.();
                clearTimeout(timeoutId);
                span.setStatus({ code: SpanStatusCode.OK });
                safeEndSpan();
                controller.close();
              } else {
                controller.enqueue(value);
              }
            } catch (err) {
              originalReader.releaseLock?.();
              clearTimeout(timeoutId);
              span.recordException(err as Error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: err instanceof Error ? err.message : String(err),
              });
              safeEndSpan();
              controller.error(err);
            }
          },
          async cancel(reason: unknown) {
            try {
              originalReader.releaseLock?.();
              clearTimeout(timeoutId);
              if (reason instanceof Error) {
                span.recordException(reason);
              } else if (reason) {
                span.recordException({ message: String(reason), name: 'CancelError' });
              }
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: reason instanceof Error ? reason.message : String(reason),
              });
              safeEndSpan();
              await originalReader.cancel(reason);
            } catch (_err) {
              // Ignore cancel errors
            }
          },
        });

        return new Response(wrappedStream, {
          status: result.status,
          statusText: result.statusText,
          headers: result.headers,
        }) as Return;
      }

      // Auto-detect Vercel AI SDK streaming objects (streamText returns object with textStream)
      if (result && typeof result === 'object' && 'textStream' in result) {
        console.warn(
          '[AxiomAI] Detected streaming object with textStream. For proper span lifecycle, call .toUIMessageStreamResponse() or similar inside withSpan, not after.',
        );
        clearTimeout(timeoutId);
        safeEndSpan(); // End span immediately to prevent memory leak
        return result;
      }

      // Non-stream path: end span immediately
      clearTimeout(timeoutId);
      span.setStatus({ code: SpanStatusCode.OK });
      safeEndSpan();
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      span.recordException(err as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      safeEndSpan();
      throw err;
    }
  });
}
