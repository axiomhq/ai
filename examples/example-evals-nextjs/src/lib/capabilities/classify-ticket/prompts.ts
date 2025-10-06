import { generateObject } from 'ai';
import {
  experimental_Type as Type,
  withSpan,
  experimental_parse as parse,
  wrapAISDKModel,
} from 'axiom/ai';
import type { experimental_Prompt as Prompt } from 'axiom/ai';

import { SupportTicketCategorySchema, SupportTicketResponseSchema } from './schemas';
import { openai } from '@ai-sdk/openai';
import { flag } from '@/lib/app-scope';
import type z from 'zod';

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

export const classifyTicketStep = async ({
  subject,
  content,
}: {
  subject: string | undefined;
  content: string;
}): Promise<z.infer<typeof SupportTicketResponseSchema>> => {
  const parsedPrompt = await parse(classifyTicketPrompt, {
    context: { subject, content },
  });

  const model = flag('ticketClassification.model');

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
