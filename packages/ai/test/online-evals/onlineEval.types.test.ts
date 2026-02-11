import { describe, it, expectTypeOf } from 'vitest';
import { onlineEval } from '../../src/online-evals/onlineEval';

describe('onlineEval type inference', () => {
  it('infers metadata from scorer function return', () => {
    const scorer = async ({ output }: { output: string }) => ({
      score: output.length > 0 ? 1 : 0,
      metadata: {
        decision: 'REDIRECT' as const,
      },
    });

    const _evaluate = () =>
      onlineEval(
        { capability: 'routing' },
        {
          output: 'response',
          scorers: [scorer],
        },
      );

    type Result = NonNullable<Awaited<ReturnType<typeof _evaluate>>[string]>;
    expectTypeOf<Result['metadata']>().toEqualTypeOf<{ decision: 'REDIRECT' } | undefined>();
  });

  it('infers metadata from precomputed scorer result', () => {
    const precomputed = {
      name: 'decision',
      score: 1,
      metadata: {
        decision: 'CONTINUE' as const,
      },
    };

    const _evaluate = () =>
      onlineEval(
        { capability: 'routing' },
        {
          output: 'response',
          scorers: [precomputed],
        },
      );

    type Result = NonNullable<Awaited<ReturnType<typeof _evaluate>>['decision']>;
    expectTypeOf<Result['metadata']>().toEqualTypeOf<{ decision: 'CONTINUE' } | undefined>();
  });

  it('requires name for precomputed scorer results passed to onlineEval', () => {
    const invalid = () =>
      onlineEval(
        { capability: 'routing' },
        {
          output: 'response',
          scorers: [
            // @ts-expect-error name is required for precomputed scorer results
            { score: 1, metadata: { decision: 'CONTINUE' as const } },
          ],
        },
      );

    invalid;
  });

  it('rejects duplicate scorer names when names are known literals', () => {
    const invalid = () =>
      onlineEval(
        { capability: 'routing' },
        {
          output: 'response',
          // @ts-expect-error duplicate scorer names are not allowed
          scorers: [
            { name: 'duplicate', score: 1 },
            { name: 'duplicate', score: 0 },
          ],
        },
      );

    invalid;
  });
});
