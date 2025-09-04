import { createAppScope, experimental_Eval as Eval, validateCliFlags } from 'axiom/ai/evals';
import { getEvalContext } from 'axiom/ai';
import { z } from 'zod';

// Define schemas for type safety and runtime validation
const flagSchema = z.object({
  strategy: z.enum(['dumb', 'smart']).default('dumb'),
});

const factSchema = z.object({
  randomNumber: z.number(),
});

// Validate CLI flags against schema early - fail fast on invalid flags
validateCliFlags(flagSchema);

const { flag, fact } = createAppScope({ flagSchema, factSchema });

// Define types for this example
type Score = { name: string; score: number };
type Scorer = ({ output, expected }: { output: any; expected: any }) => Score;

const myFn = async (input: string, expected: string) => {
  const strategy = flag('strategy');

  const response = strategy === 'dumb' ? input : expected;

  fact('randomNumber', Math.random());

  return response;
};

// an example of a custom scorer
const exactMatchScorer: Scorer = ({ output, expected }) => {
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
  model: 'o3',
  params: {
    temperature: 0.6,
  },
  prompt: [
    {
      role: 'system',
      content: 'You are a customer support agent that answers questions about log queries',
    },
  ],
  task: async ({ input, expected }) => {
    const r = await myFn(input, expected);
    console.log('tktk context', getEvalContext());
    return r;
  },
  scorers: [exactMatchScorer as any], // TODO: BEFORE MERGE - types idk
  metadata: {
    description:
      'Demonstrates flag and fact usage in eval tasks - flags configure behavior, facts track metrics',
  },
});
