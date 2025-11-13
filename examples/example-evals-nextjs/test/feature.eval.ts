import { Eval, Scorer } from 'axiom/ai/evals';
import { flag, fact, pickFlags } from '../src/lib/app-scope';

const myFn = async (input: string, expected: string) => {
  const strategy = flag('behavior.strategy');
  const _f = flag('ui.theme');

  const response = strategy === 'dumb' ? input : expected;

  fact('demo.randomNumber', Math.random());

  return response;
};

// an example of a custom scorer
const ExactMatchScorer = Scorer(
  'exact-match',
  ({ output, expected }: { output: string; expected: string }) => (output === expected ? 1 : 0),
);

Eval('Basic-demo', {
  configFlags: pickFlags('behavior'),
  data: () => [
    {
      input: "['nginx-access-logs'] | where status >= 500",
      expected: 'Nginx 5xx Errors',
    },
    {
      input: 'foo',
      expected: 'bar',
    },
  ],
  task: async ({ input, expected }) => {
    return await myFn(input, expected);
  },
  scorers: [ExactMatchScorer],
  metadata: {
    description:
      'Demonstrates pickFlags functionality - only behavior namespace is available, ui namespace is excluded',
  },
  trials: 2,
});
