import { experimental_Eval as Eval } from 'axiom/ai/evals';
import type { Scorer } from 'axiom/ai';

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
      content: 'You are a customer support agent that answers questions',
    },
  ],
  task: ({ input }) => {
    // TOOD: invoke a prompt using input
    return input;
  },
  scorers: [exactMatchScorer],
  metadata: {
    description: 'eval example',
  },
});
