import { context, trace, SpanStatusCode, type Span } from '@opentelemetry/api';
import type { Scorer, ScorerResult } from './types';
import { Attr } from '../otel/semconv/attributes';

type OnlineEvalScorerInput<TInput, TOutput> = Scorer<TInput, TOutput, any> | ScorerResult<any>;

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

  if (result.score) {
    scorerSpan.setAttribute(Attr.Eval.Score.Value, result.score);
  }

  if (result.metadata && Object.keys(result.metadata).length > 0) {
    scorerSpan.setAttribute(Attr.Eval.Score.Metadata, JSON.stringify(result.metadata));
  }
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
    const scorerName =
      typeof scorer === 'function'
        ? // undefined/unknown case shouldn't happen, but better safe than sorry
          scorer.name || 'unknown'
        : scorer.name;
    const scorerSpan = tracer.startSpan(`eval ${scorerName}`);

    try {
      const result =
        typeof scorer === 'function'
          ? ({
              ...(await scorer({
                input,
                output,
              })),
              name: scorerName,
            } satisfies NamedScorerResult)
          : scorer;

      setScorerSpanAttrs(scorerSpan, scorerName, result);
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
      const failedResult: NamedScorerResult = {
        name: scorerName,
        score: null,
        error: error.message,
      };

      setScorerSpanAttrs(scorerSpan, scorerName, failedResult);

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
