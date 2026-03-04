import { Eval } from 'axiom/ai/evals';
import { Scorer } from 'axiom/ai/scorers';
import { pickFlags } from '@/lib/app-scope';
import { extractTicketInfo } from '@/lib/capabilities/support-agent/extract-ticket-info';

type ExtractTicketInfoResult = Awaited<ReturnType<typeof extractTicketInfo>>;

const ticketInfoMatch = Scorer(
  'ticket-info-match',
  (args: { expected: ExtractTicketInfoResult; output: ExtractTicketInfoResult }) => {
    const { expected, output } = args;

    for (const key of Object.keys(expected.ticketInfo)) {
      // @ts-expect-error keys not typesafe
      if (expected.ticketInfo[key] !== output.ticketInfo[key]) {
        return {
          score: false,
          // @ts-expect-error keys not typesafe
          metadata: { field: `ticketInfo.${key}`, expected: expected.ticketInfo[key], actual: output.ticketInfo[key] },
        };
      }
    }

    if (expected.status.isComplete !== output.status.isComplete) {
      return {
        score: false,
        metadata: { field: 'status.isComplete', expected: expected.status.isComplete, actual: output.status.isComplete },
      };
    }

    const expectedMissing = new Set(expected.status.missingFields);
    const actualMissing = new Set(output.status.missingFields);
    if (expected.status.missingFields.length || output.status.missingFields.length) {
      const missing = expected.status.missingFields.filter((f) => !actualMissing.has(f));
      const extra = output.status.missingFields.filter((f) => !expectedMissing.has(f));
      if (missing.length || extra.length) {
        return {
          score: false,
          metadata: { field: 'status.missingFields', missing, extra },
        };
      }
    }

    return true;
  },
);

type TestCase = {
  input: string;
  expected: ExtractTicketInfoResult;
  metadata: { purpose: string };
};

Eval('support-agent-extract-ticket-info-trials', {
  capability: 'support-agent',
  configFlags: pickFlags('supportAgent.extractTicketInfo'),
  data: [
    // 1. Complete Information (Happy Path)
    {
      input: 'The mobile app is crashing whenever I try to log in. It is blocking my work.',
      expected: {
        ticketInfo: {
          intent: 'technical_issue',
          product: 'mobile_app',
        },
        status: {
          isComplete: true,
          missingFields: [],
        },
      },
      metadata: { purpose: 'happy_path_complete_info' },
    },

    // 2. Partial Information (Missing Product)
    {
      input: 'I cannot see my dashboard.',
      expected: {
        ticketInfo: {
          intent: 'technical_issue',
          product: 'dashboard', // Inferred from "dashboard"
        },
        status: {
          isComplete: true,
          missingFields: [],
        },
      },
      metadata: { purpose: 'inference_simple' },
    },

    // 3. Partial Information (Missing Context)
    {
      input: 'It is not working.',
      expected: {
        ticketInfo: {
          intent: 'technical_issue',
          product: 'unknown',
        },
        status: {
          isComplete: false,
          missingFields: ['product'],
        },
      },
      metadata: { purpose: 'partial_info_missing_context' },
    },

    // 4. Billing Dispute
    // Note: "subscription" is not in the product enum (mobile_app, dashboard, api), so it should be unknown
    {
      input: 'I was charged twice for my subscription.',
      expected: {
        ticketInfo: {
          intent: 'billing_dispute',
          product: 'unknown',
        },
        status: {
          isComplete: false,
          missingFields: ['product'],
        },
      },
      metadata: { purpose: 'billing_partial_info' },
    },

    // 5. Feature Request
    // Note: "desktop app" is not in product enum
    {
      input: 'Can you please add dark mode to the desktop app?',
      expected: {
        ticketInfo: {
          intent: 'feature_request',
          product: 'unknown',
        },
        status: {
          isComplete: false,
          missingFields: ['product'],
        },
      },
      metadata: { purpose: 'feature_request' },
    },

    // 6. Adversarial / Ambiguous
    {
      input: 'My internet is down.',
      expected: {
        ticketInfo: {
          intent: 'other', // Not our product
          product: 'unknown',
        },
        status: {
          isComplete: false,
          missingFields: ['product'],
        },
      },
      metadata: { purpose: 'irrelevant_complaint' },
    },
  ] satisfies TestCase[],
  task: async (task) => {
    return await extractTicketInfo([{ role: 'user', content: task.input }]);
  },
  trials: 3,
  scorers: [ticketInfoMatch],
});
