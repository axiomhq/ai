import { Scorer } from 'axiom/ai/evals';
import type z from 'zod';

import {
  type SupportTicketResponseSchema,
  // type SupportTicketInputSchema,
} from './capabilities/classify-ticket/schemas';

// an example of a custom scorer
export const exactMatchScorer = Scorer('Exact Match', ({ output, expected }) =>
  output === expected ? 1 : 0,
);

export const spamClassificationScorer = Scorer(
  'Spam Classification',
  (args: {
    output: z.infer<typeof SupportTicketResponseSchema>;
    expected?: z.infer<typeof SupportTicketResponseSchema>;
  }) => {
    const { output, expected } = args;
    if (!expected) {
      throw new Error('No expected value provided');
    }

    return (expected.category === 'spam') === (output.category === 'spam') ? 1 : 0;
  },
);

export const jaccardResponseScorer = Scorer(
  'Jaccard Response',
  ({
    output,
    expected,
  }: {
    output: z.infer<typeof SupportTicketResponseSchema>;
    expected?: z.infer<typeof SupportTicketResponseSchema>;
  }) => {
    if (!expected) {
      throw new Error('No expected value provided');
    }

    const expectedTokens = new Set(expected.response.toLowerCase().split(/\s+/));
    const outputTokens = new Set(output.response.toLowerCase().split(/\s+/));

    const intersection = Array.from(expectedTokens).filter((t) => outputTokens.has(t));
    const union = new Set([...Array.from(expectedTokens), ...Array.from(outputTokens)]);

    return intersection.length / union.size;
  },
);
