import { context, trace, SpanStatusCode, type Span } from '@opentelemetry/api';
import { normalizeBooleanScore } from '../scorers/normalize-score';
import { getGlobalTracer } from '../otel/initAxiomAI';
import type { Scorer, ScorerResult } from './types';
import { Attr } from '../otel/semconv/attributes';

type OnlineEvalScorerInput<TInput, TOutput> = Scorer<TInput, TOutput, any> | ScorerResult<any>;
type ScorerSpanAttrs = {
  capability: string;
  step?: string;
  evalName?: string;
  name: string;
  span: Span;
  result: Pick<ScorerResult<any>, 'score' | 'metadata'>;
};

function setScorerSpanAttrs(args: ScorerSpanAttrs): void {
  const { score: scoreValue, metadata } = normalizeBooleanScore(
    args.result.score,
    args.result.metadata,
  );

  const attrs: Record<string, string | number | boolean | undefined> = {
    [Attr.GenAI.Operation.Name]: 'eval.score',
    [Attr.Eval.Score.Name]: args.name,
    [Attr.Eval.Tags]: JSON.stringify(['online']),
    [Attr.Eval.Score.Value]: scoreValue ?? undefined,
    [Attr.Eval.Name]: args.evalName,
    [Attr.Eval.Capability.Name]: args.capability,
    [Attr.Eval.Step.Name]: args.step,
  };

  if (metadata && Object.keys(metadata).length > 0) {
    attrs[Attr.Eval.Score.Metadata] = JSON.stringify(metadata);
  }

  args.span.setAttributes(attrs);
}

/**
 * Executes a single scorer or emits a precomputed scorer result.
 */
export async function executeScorer<TInput, TOutput>(params: {
  scorer: OnlineEvalScorerInput<TInput, TOutput>;
  input: TInput | undefined;
  output: TOutput;
  parentSpan: Span;
  capability: string;
  step?: string;
  evalName?: string;
}): Promise<ScorerResult<any>> {
  const tracer = getGlobalTracer();
  const parentContext = trace.setSpan(context.active(), params.parentSpan);

  return context.with(parentContext, async () => {
    const scorerName =
      typeof params.scorer === 'function'
        ? // undefined/unknown case shouldn't happen, but better safe than sorry
          params.scorer.name || 'unknown'
        : params.scorer.name;
    const scorerSpan = tracer.startSpan(`score ${scorerName}`);

    try {
      const result =
        typeof params.scorer === 'function'
          ? ({
              ...(await params.scorer({
                input: params.input,
                output: params.output,
              })),
              name: scorerName,
            } satisfies ScorerResult)
          : params.scorer;

      setScorerSpanAttrs({
        span: scorerSpan,
        name: scorerName,
        result,
        capability: params.capability,
        step: params.step,
        evalName: params.evalName,
      });
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

      setScorerSpanAttrs({
        span: scorerSpan,
        name: scorerName,
        result: failedResult,
        capability: params.capability,
        step: params.step,
        evalName: params.evalName,
      });

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
