import {
  context,
  propagation,
  trace,
  type Span,
  type Baggage,
  type Tracer,
} from '@opentelemetry/api';
import { createStartActiveSpan } from './startActiveSpan';
import { WITHSPAN_BAGGAGE_KEY } from './withSpanBaggageKey';
import { getTracer } from './utils/wrapperUtils';

type WithSpanMeta = {
  capability: string;
  step: string;
};

/**
 * Wrap this around Vercel AI SDK functions such as `generateText` to wrap them in a span.
 */
export function withSpan<Return>(
  meta: WithSpanMeta,
  fn: (span: Span) => Promise<Return>,
  opts?: {
    tracer?: Tracer;
  },
): Promise<Return> {
  const tracer = opts?.tracer ?? getTracer();

  const startActiveSpan = createStartActiveSpan(tracer);

  return startActiveSpan('gen_ai.call_llm', null, async (span) => {
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

    return await context.with(ctx, () => fn(span));
  });
}
