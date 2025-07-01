import {
  context,
  trace,
  propagation,
  type Span,
  type Baggage,
  type Tracer,
} from '@opentelemetry/api';
import { createStartActiveSpan } from './startActiveSpan';
import { _SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_Pricing } from 'src/pricing';
import { AxiomAIResources } from './shared';
import { WITHSPAN_BAGGAGE_KEY } from './withSpanBaggageKey';

type WithSpanMeta = {
  // TODO: BEFORE RELEASE - i think we will name these something else. but leaving like this for now to
  // not break
  workflow: string;
  task: string;
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
    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_unstable_estimatePricing?: boolean;
  },
): Promise<Return> {
  const tracer =
    opts?.tracer ?? AxiomAIResources.getInstance().getTracer() ?? trace.getTracer('@axiomhq/ai');

  const startActiveSpan = createStartActiveSpan(tracer);
  return startActiveSpan('gen_ai.call_llm', null, async (span) => {
    const bag: Baggage = propagation.createBaggage({
      workflow: { value: meta.workflow },
      task: { value: meta.task },
      // TODO: maybe we can just check the active span name instead?
      [WITHSPAN_BAGGAGE_KEY]: { value: 'true' }, // Mark that we're inside withSpan
      ...(opts?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_unstable_estimatePricing && {
        __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_unstable_estimatePricing: {
          value: 'true',
        },
      }),
    });

    const ctx = propagation.setBaggage(context.active(), bag);
    return await context.with(ctx, () => fn(span));
  });
}
