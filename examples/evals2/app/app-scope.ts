import { createAppScope } from 'axiom/ai/evals';
import z from 'zod';

export const flagSchema = z.object({
  ticketClassification: z.object({
    model: z.string().default('gpt-4o-mini'),
  }),
});

const { flag, pickFlags } = createAppScope({ flagSchema });

export { flag, pickFlags };
