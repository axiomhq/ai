import { flag } from '@/lib/app-scope';
import { openai } from '@/lib/openai';
import { generateText, ModelMessage } from 'ai';
import { withSpan, wrapAISDKModel } from 'axiom/ai';
import z from 'zod';
import { SUPPORT_AGENT_CAPABILITY_NAME } from './support-agent';

export const messageCategories = [
  'support',
  'complaint',
  'wrong_company',
  'spam',
  'unknown',
] as const;
const messageCategoriesSchema = z.union(messageCategories.map((type) => z.literal(type)));
export type MessageCategory = z.infer<typeof messageCategoriesSchema>;

export const categorizeMessage = async (
  messages: ModelMessage[],
  conversationId?: string,
): Promise<MessageCategory> => {
  const modelName = flag('supportAgent.categorizeMessage.model');
  const model = wrapAISDKModel(openai(modelName));

  return await withSpan(
    { capability: SUPPORT_AGENT_CAPABILITY_NAME, step: 'categorize-message', conversationId },
    async () => {
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
    },
  );
};
