import { type Scorer } from 'axiom/ai/evals';
import z from 'zod';
import {
  SupportTicketResponseSchema,
  SupportTicketInputSchema,
} from '../capabilities/classify-ticket/schemas';

// an example of a custom scorer
export const exactMatchScorer: Scorer = ({ output, expected }) => {
  return {
    name: 'exact-match',
    score: output == expected ? 1 : 0,
  };
};

export const spamClassificationScorer = ({
  output,
  expected,
}: {
  output: z.infer<typeof SupportTicketResponseSchema>;
  expected?: z.infer<typeof SupportTicketResponseSchema>;
  input?: z.infer<typeof SupportTicketInputSchema>;
}) => {
  if (!expected) {
    throw new Error('No expected value provided');
  }

  const score = (expected.category === 'spam') === (output.category === 'spam') ? 1 : 0;

  return {
    score,
    name: 'Spam Classification',
  };
};

export const jaccardResponseScorer = ({
  output,
  expected,
}: {
  output: z.infer<typeof SupportTicketResponseSchema>;
  expected?: z.infer<typeof SupportTicketResponseSchema>;
  input?: z.infer<typeof SupportTicketInputSchema>;
}) => {
  if (!expected) {
    throw new Error('No expected value provided');
  }

  const expectedTokens = new Set(expected.response.toLowerCase().split(/\s+/));
  const outputTokens = new Set(output.response.toLowerCase().split(/\s+/));

  const intersection = [...expectedTokens].filter((t) => outputTokens.has(t));
  const union = new Set([...expectedTokens, ...outputTokens]);

  const score = intersection.length / union.size;

  return {
    score,
    name: 'Jaccard Response',
  };
};
