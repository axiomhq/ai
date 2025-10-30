import { experimental_Eval as Eval } from 'axiom/ai/evals';
import { flag, fact, pickFlags } from '../src/lib/app-scope';

const myFn = async (input: string, expected: string) => {
  const strategy = flag('behavior.strategy');
  const _f = flag('ui.theme');

  const response = strategy === 'dumb' ? input : expected;

  fact('demo.randomNumber', Math.random());

  return response;
};

// an example of a custom scorer
const exactMatchScorer = ({ output, expected }: { output: string; expected?: string }) => {
  return {
    name: 'Exact match',
    score: output == expected ? 1 : 0,
  };
};

Eval('Basic demo', {
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
    throw new Error('boom');
    const r = await myFn(input, expected);
    // console.log('tktk context', getEvalContext());
    return r;
  },
  scorers: [exactMatchScorer],
  metadata: {
    description:
      'Demonstrates pickFlags functionality - only behavior namespace is available, ui namespace is excluded',
  },
});
