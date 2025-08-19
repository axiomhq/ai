import { z } from 'zod';

export const AxiomConfigSchema = z.object({
  url: z.string().optional().default('https://api.axiom.co'),
  credentials: z.object({
    dataset: z.string(),
    token: z.string(),
  }),
  ai: z.object({
    evals: z.object({
      dataset: z.string(),
      token: z.string(),
    }),
  }),
});
