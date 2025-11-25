import { Scorer } from 'axiom/ai/evals';
import type z from 'zod';

import { type SupportTicketResponseSchema } from './capabilities/classify-ticket/schemas';

type SupportTicketResponse = z.infer<typeof SupportTicketResponseSchema>;

export const exactMatchScorer = Scorer(
  'Exact-Match',
  ({ output, expected }: { output: SupportTicketResponse; expected: SupportTicketResponse }) =>
    output.response === expected.response ? 1 : 0,
);

export const spamClassificationScorer = Scorer(
  'Spam-Classification',
  ({ output, expected }: { output: SupportTicketResponse; expected: SupportTicketResponse }) => {
    return (expected.category === 'spam') === (output.category === 'spam') ? 1 : 0;
  },
);

export const jaccardResponseScorer = Scorer(
  'Jaccard-Response',
  ({ output, expected }: { output: SupportTicketResponse; expected: SupportTicketResponse }) => {
    const expectedTokens = new Set(expected.response.toLowerCase().split(/\s+/));
    const outputTokens = new Set(output.response.toLowerCase().split(/\s+/));

    const intersection = Array.from(expectedTokens).filter((t) => outputTokens.has(t));
    const union = new Set([...Array.from(expectedTokens), ...Array.from(outputTokens)]);

    return intersection.length / union.size;
  },
);
