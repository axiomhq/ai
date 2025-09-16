import { createAppScope } from 'axiom/ai/evals';
import z from 'zod';

export const flagSchema = z.object({
  ticketClassification: z.object({
    strategy: z.enum(['dumb', 'smart']).default('dumb'),
    model: z.string().default('gpt-4o-mini'),
  }),
  handleReturnRequest: z.object({
    policy: z
      .enum(['auto-deny', 'strict', 'lenient', 'auto-approve', 'ask-human'])
      .default('lenient'),
  }),
});

const factSchema = z.object({
  ticketClassification: z.object({
    randomNumber: z.number(),
  }),
});

const { flag, fact, pickFlags } = createAppScope({ flagSchema, factSchema });

export { flag, fact, pickFlags };
