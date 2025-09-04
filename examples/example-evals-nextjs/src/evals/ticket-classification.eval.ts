import { defineEval } from 'axiom/ai/evals';
import { defineConfig } from 'axiom/ai';
import { jaccardResponseScorer, spamClassificationScorer } from './scorers.ai';

defineEval({
  capability: 'classifyTicket',
  step: 'classifySpam',
  // override step config
  config: defineConfig({
    model: 'gpt-o4-mini',
  }),
  // data: async () => await fetch('../collections/support-tickets.jsonl').then((resp) => resp.json()),
  data: () => [
    {
      input: {
        subject: 'Important: Your Revolut Card Has Been Temporarily Deactivated',
        content:
          'Revolut - Card Reactivation  Important: Card Reactivation Required  Dear Customer,  As part of our latest security updates, your Revolut card has been temporarily deactivated to safeguard your account.  To restore full access, please complete the following steps:  Log in using your registered email address.  Verify your account credentials.  Authenticate your identity using the Revolut mobile app.',
      },
      expected: {
        category: 'spam',
        response:
          "I'm sorry, but it looks like this inquiry relates to Revolut card reactivation rather than Timbal services. As we don't handle banking or card issues, I'll close this ticket. If you need help with Timbal products, please let us know.",
      },
      metadata: {
        id: 'th_01K0J5QZ17SYQBABJ0ZD32QQFP',
        channel: 'EMAIL',
      },
    },
    {
      input: {
        subject: 'Act Fast: New SBA Rate Drop Just Delivered for Timbal, Inc.',
        content:
          'July PromotionsHey valued client,  Great news! Timbal, Inc. has been pre-selected for a line of credit or SBA funding of up to $4M. A line of credit offers flexible repayment terms of up to 60 months, while SBA funding provides extended terms of up to 25 years - helping you secure the capital you need with manageable payments.',
      },
      expected: {
        category: 'spam',
        response:
          "Thank you for the information about SBA funding options. However, this appears to be a promotional announcement unrelated to Timbal support. I'll close this ticket, and if you have any technical questions about Timbal's platform, please reach out again.",
      },
      metadata: {
        id: 'th_01K0FQ80K4MBRZSJSD0F2Z3K6M',
        channel: 'EMAIL',
      },
    },
  ],
  scorers: [spamClassificationScorer, jaccardResponseScorer],
});
