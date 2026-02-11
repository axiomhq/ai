import { context, trace, SpanStatusCode, type Span } from '@opentelemetry/api';
import type { OnlineEvalScorer, PrecomputedScore, ScorerResult } from './types';
import { Attr } from '../otel/semconv/attributes';
import type { Score } from '../evals/scorers';

function isScorerResult(value: PrecomputedScore): value is ScorerResult {
  if (!value || typeof value !== 'object') return false;
  if (!('name' in value) || typeof value.name !== 'string') return false;
  if (!('score' in value)) return false;

  const candidateScore = value.score;
  return typeof candidateScore === 'object' && candidateScore !== null && 'score' in candidateScore;
}

function normalizePrecomputedResult(precomputed: PrecomputedScore): ScorerResult {
  if (isScorerResult(precomputed)) {
    return precomputed;
  }

  const score = precomputed as Score & { name?: string; error?: string };

  return {
    name: score.name || 'precomputed',
    score: {
      score: score.score,
      metadata: score.metadata,
    },
    error: score.error,
  };
}

function setScorerSpanAttrs(scorerSpan: Span, scorerName: string, score: Score): void {
  scorerSpan.setAttributes({
    [Attr.GenAI.Operation.Name]: 'eval.score',
    [Attr.Eval.Score.Name]: scorerName,
    [Attr.Eval.Tags]: JSON.stringify(['online']),
  });

  const attrs: Record<string, string | number | boolean | undefined> = {
    [Attr.Eval.Score.Value]: score.score ?? undefined,
  };

  if (score.metadata && Object.keys(score.metadata).length > 0) {
    attrs[Attr.Eval.Score.Metadata] = JSON.stringify(score.metadata);
  }

  scorerSpan.setAttributes(attrs);
}

/**
 * Executes a single scorer or emits a precomputed scorer result.
 */
export async function executeScorer<TInput, TOutput>(
  scorer: OnlineEvalScorer<TInput, TOutput>,
  input: TInput | undefined,
  output: TOutput,
  parentSpan: Span,
): Promise<ScorerResult> {
  const tracer = trace.getTracer('axiom-ai');
  const parentContext = trace.setSpan(context.active(), parentSpan);

  return context.with(parentContext, async () => {
    if (typeof scorer !== 'function') {
      const precomputed = normalizePrecomputedResult(scorer);
      const scorerSpan = tracer.startSpan(`eval ${precomputed.name}`);

      try {
        setScorerSpanAttrs(scorerSpan, precomputed.name, precomputed.score);

        if (precomputed.error) {
          scorerSpan.recordException(new Error(precomputed.error));
          scorerSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: precomputed.error,
          });
        } else {
          scorerSpan.setStatus({ code: SpanStatusCode.OK });
        }

        return precomputed;
      } finally {
        scorerSpan.end();
      }
    }

    const scorerName = (scorer as { name?: string }).name || 'unknown';
    const scorerSpan = tracer.startSpan(`eval ${scorerName}`);

    try {
      const result = await scorer({
        input,
        output,
      });

      setScorerSpanAttrs(scorerSpan, scorerName, result);
      scorerSpan.setStatus({ code: SpanStatusCode.OK });

      return {
        name: scorerName,
        score: result,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      scorerSpan.recordException(error);
      scorerSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });

      return {
        name: scorerName,
        score: { score: null, metadata: { error: error.message } },
        error: error.message,
      };
    } finally {
      scorerSpan.end();
    }
  });
}
