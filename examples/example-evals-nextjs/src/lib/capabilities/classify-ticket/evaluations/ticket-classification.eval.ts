import { experimental_Eval as Eval, Scorer } from 'axiom/ai/evals';
import { jaccardResponseScorer, spamClassificationScorer } from '../../../scorers';
import { classifyTicketStep } from '../../../capabilities/classify-ticket/prompts';
import { pickFlags } from '@/lib/app-scope';
import { ExactMatch } from 'autoevals';

const WrappedExactMatch = Scorer(
  'Exact-match',
  (args: {
    output: { response: string; category: string };
    expected: { response: string; category: string };
  }) => {
    return ExactMatch({
      output: args.output.response,
      expected: args.expected.response,
    });
  },
);

Eval('spam-classification', {
  configFlags: pickFlags('ticketClassification'),
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
    {
      input: {
        subject: 'FREE V1AGRA C1ALIS',
        content: 'BUY V1AGRA C1ALIS NOW ON WWW.BEST-V1AGRA-C1ALIS.COM!',
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
  scorers: [spamClassificationScorer, jaccardResponseScorer, WrappedExactMatch],
  metadata: {
    description: 'Classify support tickets as spam or not spam',
  },
});
