import { Eval, Scorer } from 'axiom/ai/evals';
import { pickFlags } from '@/lib/app-scope';
import {
  runSupportAgent,
  SupportAgentResult,
} from '@/lib/capabilities/support-agent/support-agent';

const toolUseMatch = Scorer(
  'tool-use-match',
  (args: { expected: string[]; output: SupportAgentResult }) => {
    const expected = args.expected;
    const actual = args.output.toolCalls?.map((tc) => tc.toolName) || [];
    const actualSet = new Set(actual);

    // 1. If we expect specific tools, ensure they were called.
    for (const tool of expected) {
      if (!actualSet.has(tool)) {
        return 0;
      }
    }

    // 2. If we explicitly expect NO tools (empty array), ensure no tools were called.
    if (expected.length === 0 && actual.length > 0) {
      return 0;
    }

    return 1;
  },
);

Eval('support-agent-e2e-tool-use', {
  capability: 'support-agent',
  configFlags: pickFlags('supportAgent'),
  data: () => [
    {
      input: 'I forgot my password',
      expected: ['searchKnowledgeBase'],
      purpose: 'knowledge_base_retrieval',
    },
    {
      input: 'How do I reset my password?',
      expected: ['searchKnowledgeBase'],
      purpose: 'knowledge_base_retrieval',
    },
    {
      input: 'Hello, are you a bot?',
      expected: [],
      purpose: 'chat_no_tool',
    },
    {
      input: 'What is the weather like?',
      expected: [], // Should not trigger knowledge base for weather
      purpose: 'irrelevant_no_tool',
    },
  ],
  task: async (task) => {
    return runSupportAgent([{ role: 'user', content: task.input }]);
  },
  scorers: [toolUseMatch],
});
