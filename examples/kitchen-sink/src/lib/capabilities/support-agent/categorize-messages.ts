import { flag } from '@/lib/app-scope';
import { openai } from '@/lib/openai';
import { generateText, ModelMessage } from 'ai';
import { withSpan } from 'axiom/ai';
import z from 'zod';

export const messageCategories = [
  'support',
  'complaint',
  'wrong_company',
  'spam',
  'unknown',
] as const;
const messageCategoriesSchema = z.union(messageCategories.map((type) => z.literal(type)));
type MessageCategory = z.infer<typeof messageCategoriesSchema>;

export const categorizeMessage = async (messages: ModelMessage[]): Promise<MessageCategory> => {
  const modelName = flag('supportAgent.categorizeMessage.model');
  const model = openai(modelName);

  return await withSpan({ capability: 'support_agent', step: 'categorize_message' }, async () => {
    const text = `<instructions>
Please analyze the following series of messages. For the final user message, classify it as one of the following categories: ${messageCategories.join(', ')}.
    
Reply only with the category name.
</instructions>
<messages>
${messages.map((msg) => `${msg.role}: ${msg.content}`).join('\n')}
</messages>    
    `;
    const response = await generateText({
      model: model,
      messages: [{ role: 'system', content: text }],
    });

    const trimmed = response.text.trim().toLowerCase();

    const parsed = messageCategoriesSchema.safeParse(trimmed);

    if (parsed.error) {
      return 'unknown';
    }

    return parsed.data;
  });
};
