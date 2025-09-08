import { generateObject } from 'ai';
import z from 'zod';
import {
  experimental_Type as Type,
  withSpan,
  type experimental_Prompt as Prompt,
  experimental_parse as parse,
  wrapAISDKModel,
} from 'axiom/ai';
import { validateCliFlags, createAppScope } from 'axiom/ai/evals';

import { SupportTicketCategorySchema, SupportTicketResponseSchema } from './schemas';
import { openai } from '@ai-sdk/openai';

// TODO: We should incorporate structured output support here.
export const classifyTicketPrompt = {
  name: 'Classify ticket',
  slug: 'classify-ticket',
  messages: [
    {
      role: 'system',
      content: `You are technical customer support engineer responsible for classifying inbound tickets into one of the following categories: ${SupportTicketCategorySchema.options.join(
        ', ',
      )}.
        
        If the ticket is spam, return a polite response that explains why the ticket has been automatically closed. Avoid using the word spam, since it could be inflammatory.
        If the ticket is not spam, return a polite response that explains a team member will be in touch with the user shortly.`,
    },
    {
      role: 'user',
      content: '{{#if subject}}Subject: {{subject}} {{/if}}Content: {{content}}',
    },
  ],
  model: 'gpt-4o-mini',
  options: {},
  arguments: {
    subject: Type.Optional(Type.String()),
    content: Type.String(),
  },
  version: '1.0.0',
} satisfies Prompt;

// Define schemas for type safety and runtime validation
export const flagSchema = z.object({
  strategy: z.enum(['dumb', 'smart']).default('dumb'),
  model: z.string().default('gpt-4o-mini'),
});

const factSchema = z.object({
  randomNumber: z.number(),
});

const { flag, fact } = createAppScope({ flagSchema, factSchema });

// TODO @chris: where should this live?
validateCliFlags(flagSchema);

export const classifyTicketStep = async ({
  subject,
  content,
}: {
  subject: string | undefined;
  content: string;
}) => {
  const parsedPrompt = await parse(classifyTicketPrompt, {
    context: { subject, content },
  });

  const model = flag('model');
  fact('randomNumber', Math.random());

  const result = await withSpan(
    { capability: 'classify-ticket', step: 'classification' },
    async (_span) => {
      const f = generateObject({
        model: wrapAISDKModel(openai(model)),
        messages: parsedPrompt.messages.map((m) => ({ role: m.role, content: m.content })),
        schema: SupportTicketResponseSchema,
      });
      return f;
    },
  );

  return result.object;
};
