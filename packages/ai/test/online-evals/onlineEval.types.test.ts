import { describe, it, expectTypeOf } from 'vitest';
import { onlineEval } from '../../src/online-evals';
import type { Scorer, ScorerResult } from '../../src/evals/online';

describe('onlineEval type inference', () => {
  it('exports Scorer and ScorerResult types from online entrypoint', () => {
    const scorer: Scorer<unknown, string, { decision: 'REDIRECT' }> = async ({ output }) => ({
      score: output.length > 0 ? 1 : 0,
      metadata: { decision: 'REDIRECT' },
    });
    const precomputed: ScorerResult<{ decision: 'CONTINUE' }> = {
      name: 'decision',
      score: 1,
      metadata: { decision: 'CONTINUE' },
    };

    scorer;
    precomputed;
  });

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

    type Result = Awaited<ReturnType<typeof _evaluate>>[number];
    expectTypeOf<Result['metadata']>().toEqualTypeOf<{ decision: 'REDIRECT' } | undefined>();
  });

  it('infers metadata from precomputed scorer result', () => {
    const precomputed: ScorerResult<{ decision: 'CONTINUE' }> = {
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

    type Result = Awaited<ReturnType<typeof _evaluate>>[number];
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
});
