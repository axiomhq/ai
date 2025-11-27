import { describe, it, expect } from 'vitest';
import { createScorer as Scorer } from '../../src/evals/scorers';
import { Attr } from '../../src/otel/semconv/attributes';

describe('Scorer runtime behavior', () => {
  it('scorer has name property', () => {
    const scorerWithName = Scorer('Test', () => 1);
    expect(scorerWithName.name).toBe('Test');
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
});
