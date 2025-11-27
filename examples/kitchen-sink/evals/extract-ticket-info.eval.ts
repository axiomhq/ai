import { Eval, Scorer } from 'axiom/ai/evals';
import { pickFlags } from '@/lib/app-scope';
import { extractTicketInfo } from '@/lib/capabilities/support-agent/extract-ticket-info';

type ExtractTicketInfoResult = Awaited<ReturnType<typeof extractTicketInfo>>;

const ticketInfoMatch = Scorer(
  'ticket-info-match',
  (args: { expected: ExtractTicketInfoResult; output: ExtractTicketInfoResult }) => {
    const { expected, output } = args;

    // Check ticketInfo
    Object.keys(expected.ticketInfo).forEach((key) => {
      // @ts-expect-error keys not typesafe
      if (expected.ticketInfo[key] !== output.ticketInfo[key]) {
        return 0;
      }
    });

    // Check isComplete
    if (expected.status.isComplete !== output.status.isComplete) {
      return 0;
    }

    // Check missingFields
    if (expected.status.missingFields.length) {
      const outputMissing = new Set(output.status.missingFields);
      for (const field of expected.status.missingFields) {
        if (!outputMissing.has(field)) return 0;
      }
      if (expected.status.missingFields.length !== output.status.missingFields.length) return 0;
    }

    return 1;
  },
);

type TestCase = {
  input: string;
  expected: ExtractTicketInfoResult;
  purpose: string;
};

Eval('support-agent-extract-ticket-info', {
  capability: 'support-agent',
  configFlags: pickFlags('supportAgent.extractTicketInfo'),
  data: (): TestCase[] => {
    return [
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
        purpose: 'happy_path_complete_info',
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
        purpose: 'inference_simple',
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
        purpose: 'partial_info_missing_context',
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
        purpose: 'billing_partial_info',
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
        purpose: 'feature_request',
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
        purpose: 'irrelevant_complaint',
      },
    ];
  },
  task: async (task) => {
    return await extractTicketInfo([{ role: 'user', content: task.input }]);
  },
  scorers: [ticketInfoMatch],
});
