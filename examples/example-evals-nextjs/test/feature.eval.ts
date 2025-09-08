import { createAppScope, experimental_Eval as Eval } from 'axiom/ai/evals';
import { getEvalContext } from 'axiom/ai/evals';
import { z } from 'zod';

// Define schemas for type safety and runtime validation
const flagSchema = z.object({
  strategy: z.enum(['dumb', 'smart']).default('dumb'),
  foo: z.string(),
});

const factSchema = z.object({
  randomNumber: z.number(),
});

const { flag, fact } = createAppScope({ flagSchema, factSchema });

const myFn = async (input: string, expected: string) => {
  const strategy = flag('strategy');

  const response = strategy === 'dumb' ? input : expected;

  fact('randomNumber', Math.random());

  return response;
};

// an example of a custom scorer
const exactMatchScorer = ({ output, expected }: { output: any; expected?: any }) => {
  return {
    name: 'exact-match',
    score: output == expected ? 1 : 0,
  };
};

Eval('feature-example', {
  data: () => [
    {
      input: "['nginx-access-logs'] | where status >= 500",
      expected: 'Nginx 5xx Errors',
    },
  ],
  task: async ({ input, expected }) => {
    const r = await myFn(input, expected);
    console.log('tktk context', getEvalContext());
    return r;
  },
  scorers: [exactMatchScorer], // TODO: BEFORE MERGE - types idk
  metadata: {
    description:
      'Demonstrates flag and fact usage in eval tasks - flags configure behavior, facts track metrics',
  },
});
