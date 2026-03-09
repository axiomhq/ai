import { describe, it } from 'vitest';
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

  it('rejects task input that conflicts with the data source', () => {
    const OutputOnlyScorer = Scorer(
      'output-only',
      ({ output }: { output: string }) => output.length > 0,
    );

    const invalid = () =>
      Eval('mismatched-task-input', {
        capability: 'name_query',
        data: () => [
          {
            input: 'foo',
            expected: 'bar',
          },
        ],
        // @ts-expect-error task input must match the data input type
        task: async ({ input }: { input: number }) => String(input),
        scorers: [OutputOnlyScorer],
      });

    invalid;
  });
});
