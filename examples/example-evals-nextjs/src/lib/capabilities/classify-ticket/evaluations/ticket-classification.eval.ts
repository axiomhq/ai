import { experimental_Eval as Eval } from 'axiom/ai/evals';
import { jaccardResponseScorer, spamClassificationScorer } from '../../../scorers';
import { classifyTicketStep } from '../../../capabilities/classify-ticket/prompts';

Eval('Spam classification', {
  data: () => [
    {
      input: {
        subject: "Congratulations! You've Been Selected for an Exclusive Reward",
        content: 'Claim your $500 gift card now by clicking this special link before it expires!',
      },
      expected: {
        category: 'spam',
        response: "We're sorry, but your message has been automatically closed.",
      },
    },
  ],
  task: async ({ input }) => {
    return await classifyTicketStep(input);
  },
  scorers: [spamClassificationScorer, jaccardResponseScorer],
  metadata: {
    description: 'Classify support tickets as spam or not spam',
  },
});
