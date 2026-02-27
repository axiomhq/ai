import { Attr } from '../otel/semconv/attributes';
import type { Score } from './scorer.types';

/**
 * Normalizes a boolean score to numeric (1/0) and adds eval.score.is_boolean
 * to metadata. Numbers and null pass through unchanged.
 */
export function normalizeBooleanScore(
  score: Score['score'],
  metadata?: Record<string, unknown>,
): { score: number | null; metadata?: Record<string, unknown> } {
  if (typeof score !== 'boolean') {
    return { score, metadata };
  }
  return {
    score: score ? 1 : 0,
    metadata: { ...metadata, [Attr.Eval.Score.IsBoolean]: true },
  };
}
