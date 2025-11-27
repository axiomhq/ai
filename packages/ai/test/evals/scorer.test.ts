import { describe, it, expect } from 'vitest';
import { Attr } from '../../src/otel/semconv/attributes';
import { Scorer } from '../../src/evals';

describe('Scorer runtime behavior', () => {
  it('scorer has name property', () => {
    const scorerWithName = Scorer('Test', () => 1);
    expect((scorerWithName as any).name).toBe('Test');
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
