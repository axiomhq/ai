import { createAppScope } from 'axiom/ai/evals';
import z from 'zod';

export const flagSchema = z.object({
  minimalDemo: z.object({
    strategy: z.enum(['dumb', 'smart']).default('dumb'),
  }),
});

const { flag, pickFlags } = createAppScope({ flagSchema });

export { flag, pickFlags };
