import { experimental_Eval as Eval } from 'axiom/ai/evals';
import { AnswerSimilarity } from 'autoevals';

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
  scorers: [AnswerSimilarity],
  metadata: {
    description: 'eval example',
  },
});
