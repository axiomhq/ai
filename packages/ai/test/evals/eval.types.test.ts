import { describe, it, expectTypeOf } from 'vitest';
import { Eval } from '../../src/evals';
import { Scorer } from '../../src/scorers/scorers';

describe('Eval type inference', () => {
  it('infers task input and expected from data when scorer omits input', () => {
    const answerSimilarityScorer = Scorer(
      'answer-similarity',
      ({ output, expected }: { output: string; expected: string }) => {
        output;
        expected;
        return 1;
      },
    );

    const compileOnly = () =>
      Eval('name-apl-query', {
        capability: 'name_query',
        data: () => [
          {
            input: "['nginx-access-logs'] | where status >= 500",
            expected: 'Nginx 5xx Errors',
          },
        ],
        task: async ({ input }: { input: string }) => input,
        scorers: [answerSimilarityScorer],
      });

    compileOnly;
  });

  it('preserves contextual task input typing from data when scorer omits input', () => {
    const exactMatch = Scorer(
      'exact-match',
      ({ expected, output }: { expected: string; output: string }) => expected === output,
    );

    const compileOnly = () =>
      Eval('categorize-messages', {
        capability: 'support-agent',
        data: [
          {
            input: 'Hello world',
            expected: 'support',
          },
        ],
        task: ({ input }) => {
          expectTypeOf(input).toEqualTypeOf<string>();
          return input;
        },
        scorers: [exactMatch],
      });

    compileOnly;
  });

  it('rejects task input that conflicts with the data source', () => {
    const OutputOnlyScorer = Scorer(
      'output-only',
      ({ output }: { output: string }) => output.length > 0,
    );

    const invalid = () =>
      Eval('mismatched-task-input', {
        capability: 'name_query',
        // @ts-expect-error task input must match the data input type
        data: () => [
          {
            input: 'foo',
            expected: 'bar',
          },
        ],
        task: async ({ input }: { input: number }) => String(input),
        scorers: [OutputOnlyScorer],
      });

    invalid;
  });

  it('rejects a scorer whose input type conflicts with data', () => {
    const inputAwareScorer = Scorer(
      'input-aware',
      ({ input, output }: { input: { id: number }; output: string }) => {
        return input.id > 0 && output.length > 0;
      },
    );

    const invalid = () =>
      Eval('scorer-input-mismatch', {
        capability: 'test',
        data: [{ input: 'hello', expected: 'world' }],
        task: ({ input }) => input,
        // @ts-expect-error scorer input type conflicts with data input type
        scorers: [inputAwareScorer],
      });

    invalid;
  });
});
