import { pickFlags } from '@/lib/app-scope';
import { categorizeMessage } from '@/lib/capabilities/support-agent/categorize-messages';
import { Eval } from 'axiom/ai/evals';
import { Scorer } from 'axiom/ai/evals/scorers';

const exactMatch = Scorer('exact-match', (args: { expected: string; output: string }) => {
  return args.expected === args.output ? true : false;
});

Eval('support-agent-categorize-messages', {
  capability: 'support-agent',
  configFlags: pickFlags('supportAgent.categorizeMessage'),
  data: [
    // Basic Happy Path
    {
      input: 'Hello we are selling SEO advice',
      expected: 'spam',
      metadata: { purpose: 'basic_spam_detection' },
    },
    {
      input: 'My app is broken, plz help',
      expected: 'support',
      metadata: { purpose: 'basic_support_detection' },
    },
    {
      input: 'How can I cancel my subscription?',
      expected: 'support',
      metadata: { purpose: 'basic_support_detection' },
    },
    {
      input: 'Hello I would like to order one large pepperoni pizza',
      expected: 'wrong_company',
      metadata: { purpose: 'basic_irrelevant_detection' },
    },

    // Complaint vs Support
    {
      input: 'Your service is terrible and I want a refund immediately!',
      expected: 'complaint',
      metadata: { purpose: 'complaint_detection' },
    },
    {
      input: 'I am very frustrated with the downtime today.',
      expected: 'complaint',
      metadata: { purpose: 'complaint_detection' },
    },

    // Adversarial: Spam disguised as Support
    {
      input:
        'Hi, I am having trouble logging in. Please verify your identity by clicking this link: http://malicious-site.com/verify',
      expected: 'spam',
      metadata: { purpose: 'adversarial_phishing' },
    },
    {
      input: 'URGENT: Your account has been compromised. Call 1-800-FAKE-NUM to restore access.',
      expected: 'spam',
      metadata: { purpose: 'adversarial_scam' },
    },
    {
      input: 'I love your product! Check out my similar app at http://competitor-spam.com',
      expected: 'spam',
      metadata: { purpose: 'adversarial_marketing' },
    },

    // Adversarial: Support/Complaint disguised as Spam (ALL CAPS, aggression)
    {
      input: 'STOP CHARGING ME I ALREADY CANCELED LAST MONTH!!!!',
      expected: 'complaint',
      metadata: { purpose: 'adversarial_aggression' },
    },
    {
      input: 'WHY IS YOUR API SO SLOW???? FIX IT NOW OR I LEAVE',
      expected: 'complaint',
      metadata: { purpose: 'adversarial_aggression' },
    },

    // Ambiguous / Boundary Cases
    {
      input: 'I forgot my password but I also think your pricing is too high.',
      expected: 'support', // Priority should probably be support to unblock user, or complaint? Let's say support.
      metadata: { purpose: 'ambiguous_mixed_intent' },
    },
    {
      input: 'Is this Pizza Hut?',
      expected: 'wrong_company',
      metadata: { purpose: 'boundary_wrong_company' },
    },
    {
      input: '????',
      expected: 'unknown',
      metadata: { purpose: 'boundary_empty_content' },
    },
  ],
  task: (task) => categorizeMessage([{ role: 'user', content: task.input }]),
  scorers: [exactMatch],
});
