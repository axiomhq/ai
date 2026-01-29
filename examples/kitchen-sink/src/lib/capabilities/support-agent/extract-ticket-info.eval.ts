import { Eval, Scorer } from 'axiom/ai/evals';
import { pickFlags } from '@/lib/app-scope';
import { extractTicketInfo } from '@/lib/capabilities/support-agent/extract-ticket-info';
import { SUPPORT_AGENT_CAPABILITY_NAME } from '@/lib/capabilities/support-agent/support-agent';

type ExtractTicketInfoResult = Awaited<ReturnType<typeof extractTicketInfo>>;

const ticketInfoMatch = Scorer(
  'ticket-info-match',
  (args: { expected: ExtractTicketInfoResult; output: ExtractTicketInfoResult }) => {
    const { expected, output } = args;

    // Check ticketInfo
    for (const key of Object.keys(expected.ticketInfo)) {
      // @ts-expect-error keys not typesafe
      if (expected.ticketInfo[key] !== output.ticketInfo[key]) {
        return false;
      }
    }

    // Check isComplete
    if (expected.status.isComplete !== output.status.isComplete) {
      return false;
    }

    // Check missingFields
    if (expected.status.missingFields.length) {
      const outputMissing = new Set(output.status.missingFields);
      for (const field of expected.status.missingFields) {
        if (!outputMissing.has(field)) return false;
      }
      if (expected.status.missingFields.length !== output.status.missingFields.length) return false;
    }

    return true;
  },
);

type TestCase = {
  input: string;
  expected: ExtractTicketInfoResult;
  metadata: { purpose: string };
};

Eval('extract-ticket-info', {
  capability: SUPPORT_AGENT_CAPABILITY_NAME,
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
  scorers: [ticketInfoMatch],
});
