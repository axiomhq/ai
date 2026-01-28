import { context, trace, SpanStatusCode, type Span } from '@opentelemetry/api';
import type { ScorerResult } from './types';
import type { ScorerLike } from '../evals/scorers';
import { Attr } from '../otel/semconv/attributes';

/**
 * Executes a single scorer and returns the result.
 */
export async function executeScorer<TInput, TOutput>(
  scorer: ScorerLike<TInput, unknown, TOutput>,
  input: TInput | undefined,
  output: TOutput,
  parentSpan: Span,
): Promise<ScorerResult> {
  const scorerName = (scorer as { name?: string }).name || 'unknown';

  const tracer = trace.getTracer('axiom-ai');
  const parentContext = trace.setSpan(context.active(), parentSpan);

  return context.with(parentContext, async () => {
    const scorerSpan = tracer.startSpan(`eval ${scorerName}`);

    try {
      scorerSpan.setAttributes({
        [Attr.GenAI.Operation.Name]: 'eval.score',
        [Attr.Eval.Score.Name]: scorerName,
        [Attr.Eval.Tags]: JSON.stringify(['online']),
      });

      const result = await scorer({
        input,
        output,
      });

      const attrs: Record<string, string | number | boolean | undefined> = {
        [Attr.Eval.Score.Value]: result.score ?? undefined,
      };

      if (result.metadata && Object.keys(result.metadata).length > 0) {
        attrs[Attr.Eval.Score.Metadata] = JSON.stringify(result.metadata);
      }

      scorerSpan.setAttributes(attrs);
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
