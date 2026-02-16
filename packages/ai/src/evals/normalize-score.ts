import { Attr } from '../otel/semconv/attributes';
import type { Score } from './scorer.types';

export type NormalizedScore = {
  score: number | null;
  metadata?: Record<string, any>;
};

/**
 * Normalizes a score value to a number with appropriate metadata.
 *
 * - boolean → 0 or 1 with is_boolean flag in metadata
 * - boolean within Score object → same normalization
 * - number or null → passed through as-is
 *
 * This ensures all score values stored in telemetry have consistent types.
 */
export function normalizeScore(result: Score<any>): NormalizedScore {
  const { score, metadata } = result;

  if (typeof score === 'boolean') {
    return {
      score: score ? 1 : 0,
      metadata: {
        ...metadata,
        [Attr.Eval.Score.IsBoolean]: true,
      },
    };
  }

  // score is already number or null
  return { score, metadata };
}
