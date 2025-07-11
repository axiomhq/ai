import {
  context,
  trace,
  propagation,
  type Span,
  type Baggage,
  type Tracer,
} from '@opentelemetry/api';
import { createStartActiveSpan } from './startActiveSpan';
import { AxiomAIResources } from './shared';
import { WITHSPAN_BAGGAGE_KEY } from './withSpanBaggageKey';

type WithSpanMeta = {
  capability: string;
  step: string;
};

/**
 * Wrap this around LLM functions (ie `generateText` from Vercel SDK, `openai.responses.create`
 * from OpenAI SDK) to wrap them in a span.
 */
export function withSpan<Return>(
  meta: WithSpanMeta,
  fn: (span: Span) => Promise<Return>,
  opts?: {
    tracer?: Tracer;
  },
): Promise<Return> {
  const tracer =
    opts?.tracer ?? AxiomAIResources.getInstance().getTracer() ?? trace.getTracer('@axiomhq/ai');

  const startActiveSpan = createStartActiveSpan(tracer);
  return startActiveSpan('gen_ai.call_llm', null, async (span) => {
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
