import { describe, it, expect } from 'vitest';
import { Attr } from '../../src/otel/semconv/attributes';
import { Scorer } from '../../src/evals/scorers';
import { Mean, PassAtK } from '../../src/evals/aggregations';

describe('Scorer runtime behavior', () => {
  it('scorer has name property', () => {
    const scorerWithName = Scorer('Test', () => 1);
    expect((scorerWithName as any).name).toBe('Test');
  });

  it('scorer accepts aggregation option', () => {
    const scorer = Scorer('with-agg', () => 1, { aggregation: Mean() });
    expect((scorer as any).name).toBe('with-agg');
    expect((scorer as any).aggregation).toBeDefined();
    expect((scorer as any).aggregation.type).toBe('mean');
  });

  it('scorer aggregation has working aggregate function', () => {
    const scorer = Scorer('pass-at-k', () => 1, { aggregation: PassAtK({ threshold: 0.8 }) });
    const agg = (scorer as any).aggregation;
    expect(agg.type).toBe('pass@k');
    expect(agg.threshold).toBe(0.8);
    expect(agg.aggregate([0.5, 0.9, 0.7])).toBe(1);
    expect(agg.aggregate([0.5, 0.6, 0.7])).toBe(0);
  });

  it('scorer without aggregation option has no aggregation property', () => {
    const scorer = Scorer('no-agg', () => 1);
    expect((scorer as any).aggregation).toBeUndefined();
  });

  it('boolean return value is normalized to 1/0 with metadata', async () => {
    const booleanScorer = Scorer('BooleanTest', ({ output }: { output: string }) => {
      return output === 'true';
    });

    const scoreTrue = await booleanScorer({ output: 'true' });
    expect(scoreTrue).toEqual({
      score: 1,
      metadata: { [Attr.Eval.Score.IsBoolean]: true },
    });

    const scoreFalse = await booleanScorer({ output: 'false' });
    expect(scoreFalse).toEqual({
      score: 0,
      metadata: { [Attr.Eval.Score.IsBoolean]: true },
    });
  });

  it('number return value is wrapped without metadata', async () => {
    const numberScorer = Scorer('NumberTest', () => 0.5);

    // @ts-expect-error
    const score = await numberScorer({});
    expect(score).toEqual({
      score: 0.5,
    });
  });

  it('Score object with boolean score is normalized and metadata is merged', async () => {
    const booleanWithMeta = Scorer('BooleanMetaTest', ({ output }: { output: string }) => {
      const passed = output === 'true';
      return { score: passed, metadata: { reason: passed ? 'exact match' : 'mismatch' } };
    });

    const scoreTrue = await booleanWithMeta({ output: 'true' });
    expect(scoreTrue).toEqual({
      score: 1,
      metadata: { reason: 'exact match', [Attr.Eval.Score.IsBoolean]: true },
    });

    const scoreFalse = await booleanWithMeta({ output: 'false' });
    expect(scoreFalse).toEqual({
      score: 0,
      metadata: { reason: 'mismatch', [Attr.Eval.Score.IsBoolean]: true },
    });
  });

  it('Score object return value is passed through unchanged', async () => {
    const customScore = {
      score: 0.8,
      metadata: { custom: 'value' },
    };
    const objectScorer = Scorer('ObjectTest', () => customScore);

    // @ts-expect-error
    const score = await objectScorer({});
    expect(score).toEqual(customScore);
    // Explicitly check that is_boolean was NOT added
    expect(score.metadata?.[Attr.Eval.Score.IsBoolean]).toBeUndefined();
  });
});
