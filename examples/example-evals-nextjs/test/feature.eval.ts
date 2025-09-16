import { createAppScope, experimental_Eval as Eval } from 'axiom/ai/evals';
import { getEvalContext } from 'axiom/ai/evals';
import { z } from 'zod';

// Define namespaced schemas for type safety and runtime validation
const flagSchema = z.object({
  behavior: z.object({
    strategy: z.enum(['dumb', 'smart']).default('dumb'),
    foo: z.string().default('default-value'),
  }),
  ui: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    showDebug: z.boolean().default(false),
  }),
});

const factSchema = z.object({
  randomNumber: z.number(),
});

const { pickFlags, flag, fact } = createAppScope({ flagSchema, factSchema });

const myFn = async (input: string, expected: string) => {
  const strategy = flag('behavior.strategy');
  console.log('tktk strategy', strategy);
  const theme = flag('ui.theme');
  console.log('tktk theme', theme);

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
  configFlags: pickFlags(['ui']),
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
      'Demonstrates pickFlags functionality - only behavior namespace is available, ui namespace is excluded',
  },
});
