import type { Scorer } from 'axiom/ai';
import { experimental_defineEval as defineEval } from 'axiom/ai/evals';

const exactMatchScorer: Scorer = ({ output, expected }) => {
  return {
    name: 'exact-match',
    score: output == expected ? 1 : 0,
  };
};

export const featureEval = defineEval({
  capability: 'log-analysis',
  step: 'error-detection',
  data: () => [
    {
      input: "['nginx-access-logs'] | where status >= 500",
      expected: 'Nginx 5xx Errors',
    },
  ],
  metadata: {
    description: 'eval example',
    model: 'o3',
    temperature: 0.6,
    prompt: [
      {
        role: 'system',
        content: 'You are a customer support agent that answers questions',
      },
    ],
  },
  task: ({ input, expected, metadata }) => {
    // TOOD: invoke a prompt using input
    return expected;
  },
  scorers: [
    exactMatchScorer,
    ({ output, expected }) => {
      return {
        name: 'random-scorer',
        score: Math.random(),
      };
    },
  ],
});

featureEval.run();
