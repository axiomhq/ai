import { pickFlags } from '@/lib/app-scope';
import { categorizeMessage } from '@/lib/capabilities/support-agent/categorize-messages';
import { Eval, Scorer } from 'axiom/ai/evals';

const exactMatch = Scorer('exact-match', (args: { expected: string; output: string }) => {
  return args.expected === args.output ? 1 : 0;
});

Eval('support-agent-categorize-messages', {
  capability: 'support-agent',
  configFlags: pickFlags('supportAgent.categorizeMessage'),
  data: () => {
    return [
      { input: 'Hello we are selling SEO advice', expected: 'spam' },
      {
        input: 'My app is broken, plz help',
        expected: 'support',
      },
      {
        input: 'How can I cancel my subscription?',
        expected: 'support',
      },
      {
        input: 'Hello I would like to order one large pepperoni pizza',
        expected: 'wrong_company',
      },
    ];
  },
  task: (task) => categorizeMessage([{ role: 'user', content: task.input }]),
  scorers: [exactMatch],
});
