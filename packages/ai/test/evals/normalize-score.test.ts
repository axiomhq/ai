import { describe, it, expect } from 'vitest';
import { Attr } from '../../src/otel/semconv/attributes';
import { normalizeBooleanScore } from '../../src/evals/normalize-score';

describe('normalizeBooleanScore', () => {
  it('converts true to 1 with is_boolean metadata', () => {
    expect(normalizeBooleanScore(true)).toEqual({
      score: 1,
      metadata: { [Attr.Eval.Score.IsBoolean]: true },
    });
  });

  it('converts false to 0 with is_boolean metadata', () => {
    expect(normalizeBooleanScore(false)).toEqual({
      score: 0,
      metadata: { [Attr.Eval.Score.IsBoolean]: true },
    });
  });

  it('merges is_boolean into existing metadata', () => {
    expect(normalizeBooleanScore(true, { reason: 'exact match' })).toEqual({
      score: 1,
      metadata: { reason: 'exact match', [Attr.Eval.Score.IsBoolean]: true },
    });
  });

  it('passes through numbers unchanged', () => {
    expect(normalizeBooleanScore(0.75)).toEqual({
      score: 0.75,
      metadata: undefined,
    });
  });

  it('passes through numbers with existing metadata unchanged', () => {
    const metadata = { source: 'cache' };
    expect(normalizeBooleanScore(0.5, metadata)).toEqual({
      score: 0.5,
      metadata: { source: 'cache' },
    });
  });

  it('passes through null unchanged', () => {
    expect(normalizeBooleanScore(null)).toEqual({
      score: null,
      metadata: undefined,
    });
  });

  it('passes through null with existing metadata unchanged', () => {
    expect(normalizeBooleanScore(null, { error: 'timeout' })).toEqual({
      score: null,
      metadata: { error: 'timeout' },
    });
  });
});
