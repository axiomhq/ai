import { createAppScope } from 'axiom/ai/evals';
import z from 'zod';

export const flagSchema = z.object({
  behavior: z.object({
    strategy: z.enum(['dumb', 'smart']).default('dumb'),
  }),
  ui: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
  }),
  ticketClassification: z.object({
    model: z.string().default('gpt-4o-mini'),
  }),
  handleReturnRequest: z.object({
    policy: z
      .enum(['auto-deny', 'strict', 'lenient', 'auto-approve', 'ask-human'])
      .default('lenient'),
  }),
});

const factSchema = z.object({
  // TODO: BEFORE MERGE: nested fact schema!
  randomNumber: z.number(),
});

const { flag, fact, pickFlags } = createAppScope({ flagSchema, factSchema });

export { flag, fact, pickFlags };
