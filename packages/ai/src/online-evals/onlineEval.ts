import { context, trace, SpanStatusCode, type SpanContext } from '@opentelemetry/api';
import type { EvalSampling, OnlineEvalScorer, ScorerResult } from './types';
import { executeScorer } from './executor';

/**
 * Metadata for categorizing online evaluations.
 */
export type OnlineEvalMeta = {
  /** High-level capability being evaluated (e.g., 'qa', 'summarization') */
  capability: string;
  /** Specific step within the capability (e.g., 'answer', 'extract') */
  step?: string;
  /**
   * Explicit SpanContext to link the eval span to the originating generation span.
   * When omitted, the active span's context is used automatically.
   * Use this for deferred evaluation when onlineEval is called after the
   * originating span has completed.
   */
  link?: SpanContext;
};

/**
 * Options for online evaluation.
 */
export type OnlineEvalOptions<TInput, TOutput> = {
  /** Input to pass to scorers (optional - only needed for input+output scorers) */
  input?: TInput;
  /** Output to evaluate */
  output: TOutput;
  /** Scorers or precomputed scores to include (not mutated) */
  scorers: readonly OnlineEvalScorer<TInput, TOutput>[];
  /** Optional sampling configuration */
  sampling?: EvalSampling;
};

/**
 * Determines if evaluation should run based on sampling configuration.
 */
function shouldSample(sampling?: EvalSampling): boolean {
  if (!sampling) return true;
  if (sampling.rate >= 1) return true;
  if (sampling.rate <= 0) return false;
  return Math.random() < sampling.rate;
}

/**
 * Run online evaluation scorers against production outputs.
 *
 * Returns a promise that resolves to scorer results. Use `void onlineEval(...)`
 * for fire-and-forget, or `await onlineEval(...)` when you need to wait for
 * completion (e.g., before flushing telemetry in short-lived processes).
 *
 * Each eval span links back to the originating generation span via an
 * OpenTelemetry span link. Parent/child hierarchy follows natural context
 * propagation — inside `withSpan` the eval is a child, outside it depends
 * on the active context.
 *
 * ## Usage Patterns
 *
 * **Inside withSpan (recommended):**
 * Active span is automatically detected and linked.
 * ```ts
 * await withSpan({ capability: 'qa', step: 'answer' }, async () => {
 *   const response = await generateText({ ... });
 *   void onlineEval(
 *     { capability: 'qa', step: 'answer' },
 *     { output: response.text, scorers: [formatScorer] }
 *   );
 *   return response.text;
 * });
 * ```
 *
 * **Deferred evaluation with explicit link:**
 * Pass the originating span's context for linking when evaluating later.
 * ```ts
 * let spanCtx: SpanContext;
 * const result = await withSpan({ ... }, async (span) => {
 *   spanCtx = span.spanContext();
 *   return await generateText({ ... });
 * });
 * void onlineEval({ ..., link: spanCtx }, { output: result, scorers });
 * ```
 *
 * **Awaiting for flush (short-lived processes):**
 * ```ts
 * await onlineEval({ ... }, { output, scorers });
 * await flushTelemetry();
 * ```
 *
 * @param meta - Evaluation metadata for categorization
 * @param meta.capability - High-level capability being evaluated
 * @param meta.step - Optional step within the capability
 * @param meta.link - Optional SpanContext to link to (auto-detected if omitted)
 * @param options - Evaluation configuration
 * @param options.input - Input to pass to scorers
 * @param options.output - Output to evaluate
 * @param options.scorers - Scorer functions or precomputed scores to include
 * @param options.sampling - Optional sampling configuration
 * @returns Promise resolving to scorer results
 */
export function onlineEval<TInput, TOutput>(
  meta: OnlineEvalMeta,
  options: OnlineEvalOptions<TInput, TOutput>,
): Promise<ScorerResult[]> {
  if (options.scorers.length === 0) {
    return Promise.resolve([]);
  }

  if (!shouldSample(options.sampling)) {
    return Promise.resolve([]);
  }

  const linkSpanContext = meta.link ?? trace.getSpan(context.active())?.spanContext();

  return executeOnlineEvalInternal(meta, options, linkSpanContext);
}

async function executeOnlineEvalInternal<TInput, TOutput>(
  meta: OnlineEvalMeta,
  options: OnlineEvalOptions<TInput, TOutput>,
  linkSpanContext: SpanContext | undefined,
): Promise<ScorerResult[]> {
  const tracer = trace.getTracer('axiom-ai');

  const spanName = meta.step ? `eval ${meta.capability}/${meta.step}` : `eval ${meta.capability}`;

  const evalSpan = tracer.startSpan(
    spanName,
    linkSpanContext ? { links: [{ context: linkSpanContext }] } : {},
  );

  try {
    const results = await Promise.all(
      options.scorers.map((scorer) =>
        executeScorer(scorer, options.input, options.output, evalSpan),
      ),
    );

    const hasErrors = results.some((r) => r.error);
    if (hasErrors) {
      evalSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'One or more scorers failed',
      });
    } else {
      evalSpan.setStatus({ code: SpanStatusCode.OK });
    }

    return results;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    evalSpan.recordException(error);
    evalSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    return [];
  } finally {
    evalSpan.end();
  }
}
