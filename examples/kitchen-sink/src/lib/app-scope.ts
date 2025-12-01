import { createAppScope } from 'axiom/ai';
import z from 'zod';

export const flagSchema = z.object({
  supportAgent: z.object({
    categorizeMessage: z.object({
      model: z
        .enum(['gpt-4o-mini-2024-07-18', 'gpt-5-mini-2025-08-07', 'gpt-5-nano-2025-08-07'])
        .default('gpt-5-nano-2025-08-07'),
    }),
    retrieveFromKnowledgeBase: z.object({
      model: z
        .enum(['gpt-4o-mini-2024-07-18', 'gpt-5-mini-2025-08-07', 'gpt-5-nano-2025-08-07'])
        .default('gpt-5-nano-2025-08-07'),
      maxDocuments: z.number().default(1),
    }),
    extractTicketInfo: z.object({
      model: z
        .enum(['gpt-4o-mini-2024-07-18', 'gpt-5-mini-2025-08-07', 'gpt-5-nano-2025-08-07'])
        .default('gpt-5-nano-2025-08-07'),
    }),
    main: z.object({
      model: z
        .enum(['gpt-4o-mini-2024-07-18', 'gpt-5-mini-2025-08-07', 'gpt-5-nano-2025-08-07'])
        .default('gpt-5-nano-2025-08-07'),
    }),
  }),
});

const { flag, pickFlags } = createAppScope({ flagSchema });

export { flag, pickFlags };
