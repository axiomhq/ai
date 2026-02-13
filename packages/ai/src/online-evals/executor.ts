import { context, trace, SpanStatusCode, type Span } from '@opentelemetry/api';
import type { Scorer, ScorerResult } from './types';
import { Attr } from '../otel/semconv/attributes';

type OnlineEvalScorerInput<TInput, TOutput> = Scorer<TInput, TOutput, any> | ScorerResult<any>;

function setScorerSpanAttrs(
  scorerSpan: Span,
  scorerName: string,
  result: Pick<ScorerResult<any>, 'score' | 'metadata'>,
  evalName?: string,
): void {
  const attrs: Record<string, string | number | boolean | undefined> = {
    [Attr.GenAI.Operation.Name]: 'eval.score',
    [Attr.Eval.Score.Name]: scorerName,
    [Attr.Eval.Tags]: JSON.stringify(['online']),
    [Attr.Eval.Score.Value]: result.score ?? undefined,
  };

  if (evalName) {
    attrs[Attr.Eval.Name] = evalName;
  }

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
  evalName?: string,
): Promise<ScorerResult<any>> {
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
            } satisfies ScorerResult)
          : scorer;

      setScorerSpanAttrs(scorerSpan, scorerName, result, evalName);
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

      setScorerSpanAttrs(scorerSpan, scorerName, failedResult, evalName);

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
