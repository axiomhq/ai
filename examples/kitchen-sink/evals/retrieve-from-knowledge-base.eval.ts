import { Eval, Scorer } from 'axiom/ai/evals';
import { pickFlags } from '@/lib/app-scope';
import { veryBadRAG } from '@/lib/capabilities/support-agent/retrieve-from-knowledge-base';

const includesDocument = Scorer(
  'includes-all-required-docs',
  (args: { expected: string | Array<string>; output: Array<string> }) => {
    if (typeof args.expected === 'string') {
      return args.output.includes(args.expected) ? 1 : 0;
    }
    return args.expected.every((doc) => args.output.includes(doc)) ? 1 : 0;
  },
);

Eval('support-agent-retrieve-from-knowledge-base', {
  capability: 'support-agent',
  configFlags: pickFlags('supportAgent.retrieveFromKnowledgeBase'),
  data: () => {
    return [
      { input: 'I would like to reset my password', expected: 'kb_reset_pw' },
      {
        input: 'I would like to cancel my subscription',
        expected: 'kb_cancel',
      },
      {
        input: 'how cancell sub????',
        expected: 'kb_cancel',
      },
      {
        input: 'Where can i get my past invoices?',
        expected: 'kb_invoice',
      },
    ];
  },
  task: async (task) => {
    const docs = await veryBadRAG(task.input);

    return (docs.documents ?? []).map((d) => d.id);
  },
  scorers: [includesDocument],
});
