import { context, trace, SpanStatusCode, type Span } from '@opentelemetry/api';
import type { Scorer, ScorerResult } from './types';
import { Attr } from '../otel/semconv/attributes';

type OnlineEvalScorerInput<TInput, TOutput> =
  | Scorer<TInput, TOutput, any>
  | ScorerResult<any>;

type NamedScorerResult<TMetadata extends Record<string, unknown> = Record<string, unknown>> =
  ScorerResult<TMetadata>;

function setScorerSpanAttrs(
  scorerSpan: Span,
  scorerName: string,
  result: Pick<ScorerResult<any>, 'score' | 'metadata'>,
): void {
  scorerSpan.setAttributes({
    [Attr.GenAI.Operation.Name]: 'eval.score',
    [Attr.Eval.Score.Name]: scorerName,
    [Attr.Eval.Tags]: JSON.stringify(['online']),
  });

  const attrs: Record<string, string | number | boolean | undefined> = {
    [Attr.Eval.Score.Value]: result.score ?? undefined,
  };

  if (result.metadata && Object.keys(result.metadata).length > 0) {
    attrs[Attr.Eval.Score.Metadata] = JSON.stringify(result.metadata);
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
): Promise<NamedScorerResult<any>> {
  const tracer = trace.getTracer('axiom-ai');
  const parentContext = trace.setSpan(context.active(), parentSpan);

  return context.with(parentContext, async () => {
    if (typeof scorer !== 'function') {
      const scorerSpan = tracer.startSpan(`eval ${scorer.name}`);

      try {
        setScorerSpanAttrs(scorerSpan, scorer.name, scorer);

        if (scorer.error) {
          scorerSpan.recordException(new Error(scorer.error));
          scorerSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: scorer.error,
          });
        } else {
          scorerSpan.setStatus({ code: SpanStatusCode.OK });
        }

        return scorer;
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
        ...result,
        name: scorerName,
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
        score: null,
        error: error.message,
      };
    } finally {
      scorerSpan.end();
    }
  });
}
