import { generateObject } from 'ai';
import { defineCapability, defineConfig, defineStep, experimental_parse as parse } from 'axiom/ai';
import { z } from 'zod';
import { classifyTicketPrompt } from './prompts';
import { SupportTicketResponseSchema } from './schemas';

defineCapability({
  name: 'classifyTicket',
});

defineConfig({
  step: 'classifySpam',
  model: 'gpt-o4-mini',
  prompt: 'template',
});

defineStep({
  name: 'classifySpam',
  capability: 'classifyTicket',
  config: z.object({
    model: z.string(),
  }),
  run: async ({ input, config }) => {
    const parsedPrompt = await parse(classifyTicketPrompt, {
      context: { subject: input.subject, content: input.content },
    });

    return generateObject({
      model: config.model,
      messages: parsedPrompt.messages,
      schema: SupportTicketResponseSchema,
    });
  },
});

// TODO: think about workflows
// defineWorkflow({
//   steps: ['classifySpam'],
//   run: (steps) => {},
// });
