import { openai } from '@ai-sdk/openai';
import { createAppScope } from 'axiom/ai';
import { z } from 'zod';

type OpenAIModelId = Parameters<typeof openai>[0];

export const flagSchema = z.object({
  reviewAssistant: z.object({
    sentiment: z.object({
      modelId: z.custom<OpenAIModelId>().default('gpt-4o-mini'),
    }),
    summarize: z.object({
      modelId: z.custom<OpenAIModelId>().default('gpt-4o-mini'),
    }),
  }),
});

const { flag, pickFlags } = createAppScope({ flagSchema });

export { flag, pickFlags };
