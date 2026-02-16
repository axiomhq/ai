import { context, trace, SpanStatusCode, type Span } from '@opentelemetry/api';
import { getGlobalTracer } from '../otel/initAxiomAI';
import type { Scorer, ScorerResult } from './types';
import type { OnlineEvalMeta } from './onlineEval';
import { Attr } from '../otel/semconv/attributes';
import { normalizeScore, type NormalizedScore } from '../evals/normalize-score';

type OnlineEvalScorerInput<TInput, TOutput> = Scorer<TInput, TOutput, any> | ScorerResult<any>;

function setScorerSpanAttrs(
  scorerSpan: Span,
  scorerName: string,
  normalizedResult: NormalizedScore,
  meta?: OnlineEvalMeta,
): void {
  const attrs: Record<string, string | number | boolean | undefined> = {
    [Attr.GenAI.Operation.Name]: 'eval.score',
    [Attr.Eval.Score.Name]: scorerName,
    [Attr.Eval.Tags]: JSON.stringify(['online']),
    [Attr.Eval.Score.Value]: normalizedResult.score ?? undefined,
    [Attr.Eval.Capability.Name]: meta?.capability,
    [Attr.Eval.Step.Name]: meta?.step,
  };

  // Set is_boolean attribute if present in metadata.
  if (normalizedResult.metadata?.[Attr.Eval.Score.IsBoolean]) {
    attrs[Attr.Eval.Score.IsBoolean] = true;
  }

  // Serialize remaining metadata (excluding is_boolean, which is a direct attribute).
  if (normalizedResult.metadata && Object.keys(normalizedResult.metadata).length > 0) {
    const { [Attr.Eval.Score.IsBoolean]: _, ...restMetadata } = normalizedResult.metadata;
    if (Object.keys(restMetadata).length > 0) {
      attrs[Attr.Eval.Score.Metadata] = JSON.stringify(restMetadata);
    }
  }

  scorerSpan.setAttributes(attrs);
}

/**
 * Executes a single scorer or emits a precomputed scorer result.
 */
export async function executeScorer<TInput, TOutput>(
  scorer: OnlineEvalScorerInput<TInput, TOutput>,
  input: TInput | undefined,
  output: TOutput,
  parentSpan: Span,
  meta?: OnlineEvalMeta,
): Promise<ScorerResult<any>> {
  const tracer = getGlobalTracer();
  const parentContext = trace.setSpan(context.active(), parentSpan);

  return context.with(parentContext, async () => {
    const scorerName =
      typeof scorer === 'function'
        ? // undefined/unknown case shouldn't happen, but better safe than sorry
          scorer.name || 'unknown'
        : scorer.name;
    const scorerSpan = tracer.startSpan(`score ${scorerName}`);

    try {
      const rawResult =
        typeof scorer === 'function'
          ? await scorer({
              input,
              output,
            })
          : scorer;

      // Normalize score values (boolean -> number + is_boolean metadata).
      const normalized = normalizeScore({ score: rawResult.score, metadata: rawResult.metadata });

      const result: ScorerResult<any> = {
        name: scorerName,
        score: normalized.score,
        metadata: normalized.metadata,
        error: rawResult.error,
      };

      setScorerSpanAttrs(scorerSpan, scorerName, normalized, meta);
      if (result.error) {
        const error = new Error(result.error);
        scorerSpan.recordException(error);
        scorerSpan.setAttributes({
          [Attr.Error.Message]: error.message,
          [Attr.Error.Type]: error.name,
        });
        scorerSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
      } else {
        scorerSpan.setStatus({ code: SpanStatusCode.OK });
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const failedResult: ScorerResult = {
        name: scorerName,
        score: null,
        error: error.message,
      };

      setScorerSpanAttrs(scorerSpan, scorerName, { score: null }, meta);

      scorerSpan.recordException(error);
      scorerSpan.setAttributes({
        [Attr.Error.Message]: error.message,
        [Attr.Error.Type]: error.name,
      });
      scorerSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });

      return failedResult;
    } finally {
      scorerSpan.end();
    }
  });
}
