import { experimental_Eval as Eval } from 'axiom/ai/evals';
import { getEvalContext } from 'axiom/ai';
import { jaccardResponseScorer, spamClassificationScorer } from '../../../scorers';
import { classifyTicketStep } from '../../../capabilities/classify-ticket/prompts';

Eval('feature-example', {
  data: () => [
    {
      input: "['nginx-access-logs'] | where status >= 500",
      expected: 'Nginx 5xx Errors',
    },
  ],
  task: async ({ input }) => {
    const r = await classifyTicketStep({ ...input });
    console.log('tktk context', getEvalContext());
    return r;
  },
  scorers: [spamClassificationScorer, jaccardResponseScorer],
  metadata: {
    description:
      "Classify support tickets as spam or not spam",
  },
});
