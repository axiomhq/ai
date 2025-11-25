import { Eval, Scorer } from 'axiom/ai/evals';
import { jaccardResponseScorer, categoryMatchScorer } from '../../../scorers';
import { classifyTicketStep } from '../prompts';
import { pickFlags } from '@/lib/app-scope';
import { ExactMatch } from 'autoevals';

const WrappedExactMatch = Scorer(
  'exact-match',
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

Eval('ticket-classification', {
  configFlags: pickFlags('ticketClassification'),
  capability: 'ticket-classification',
  step: 'classify-ticket',
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
        subject: 'How do I reset my password?',
        content: 'I forgot my password and cannot log in.',
      },
      expected: {
        category: 'question',
        response: "A team member will be in touch with you shortly.",
      },
    },
     {
      input: {
        subject: 'Bug in the dashboard',
        content: 'The dashboard is not loading correctly on Safari.',
      },
      expected: {
        category: 'bug_report',
        response: "A team member will be in touch with you shortly.",
      },
    },
  ],
  task: async ({ input }) => {
    return await classifyTicketStep(input);
  },
  scorers: [categoryMatchScorer, jaccardResponseScorer, WrappedExactMatch],
  metadata: {
    description: 'Classify support tickets into categories and check response',
  },
});
