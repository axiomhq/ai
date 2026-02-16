import { describe, it, expect } from 'vitest';
import { normalizeScore } from '../../src/evals/normalize-score';
import { Attr } from '../../src/otel/semconv/attributes';

describe('normalizeScore', () => {
  describe('boolean score normalization', () => {
    it('converts true to 1 with is_boolean metadata', () => {
      const result = normalizeScore({ score: true });
      expect(result).toEqual({
        score: 1,
        metadata: { [Attr.Eval.Score.IsBoolean]: true },
      });
    });

    it('converts false to 0 with is_boolean metadata', () => {
      const result = normalizeScore({ score: false });
      expect(result).toEqual({
        score: 0,
        metadata: { [Attr.Eval.Score.IsBoolean]: true },
      });
    });

    it('merges existing metadata when normalizing boolean', () => {
      const result = normalizeScore({
        score: true,
        metadata: { reason: 'exact match', source: 'test' },
      });
      expect(result).toEqual({
        score: 1,
        metadata: {
          reason: 'exact match',
          source: 'test',
          [Attr.Eval.Score.IsBoolean]: true,
        },
      });
    });
  });

  describe('number score handling', () => {
    it('passes through number scores unchanged', () => {
      const result = normalizeScore({ score: 0.75 });
      expect(result).toEqual({
        score: 0.75,
        metadata: undefined,
      });
    });

    it('preserves metadata for number scores', () => {
      const result = normalizeScore({
        score: 0.5,
        metadata: { confidence: 'high' },
      });
      expect(result).toEqual({
        score: 0.5,
        metadata: { confidence: 'high' },
      });
    });

    it('handles edge case numbers', () => {
      expect(normalizeScore({ score: 0 })).toEqual({ score: 0, metadata: undefined });
      expect(normalizeScore({ score: 1 })).toEqual({ score: 1, metadata: undefined });
      expect(normalizeScore({ score: -1 })).toEqual({ score: -1, metadata: undefined });
    });
  });

  describe('null score handling', () => {
    it('passes through null scores unchanged', () => {
      const result = normalizeScore({ score: null });
      expect(result).toEqual({
        score: null,
        metadata: undefined,
      });
    });

    it('preserves metadata for null scores', () => {
      const result = normalizeScore({
        score: null,
        metadata: { error: 'failed to compute' },
      });
      expect(result).toEqual({
        score: null,
        metadata: { error: 'failed to compute' },
      });
    });
  });
});
