import { createAppScope } from 'axiom/ai';
import z from 'zod';

export const flagSchema = z.object({
  minimalDemo: z.object({
    model: z
      .enum(['gpt-4o-mini-2024-07-18', 'gpt-5-nano-2025-08-07'])
      .default('gpt-4o-mini-2024-07-18'),
    strategy: z.enum(['dumb', 'smart']).default('dumb'),
    beThorough: z.boolean().default(false),
  }),
});

export const { flag, pickFlags } = createAppScope({ flagSchema });
