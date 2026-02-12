import { flag } from '@/lib/app-scope';
import { openai } from '@/lib/openai';
import { generateText, ModelMessage } from 'ai';
import { withSpan, wrapAISDKModel } from 'axiom/ai';
import { onlineEval } from 'axiom/ai/evals/online';
import z from 'zod';
import { validCategoryScorer, formatConfidenceScorer } from './online-scorers';

export const messageCategories = [
  'support',
  'complaint',
  'wrong_company',
  'spam',
  'unknown',
] as const;
const messageCategoriesSchema = z.union(messageCategories.map((type) => z.literal(type)));
export type MessageCategory = z.infer<typeof messageCategoriesSchema>;

export const categorizeMessage = async (messages: ModelMessage[]): Promise<MessageCategory> => {
  const modelName = flag('supportAgent.categorizeMessage.model');
  const model = wrapAISDKModel(openai(modelName));

  // Extract the last user message for online evaluation input
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
  const evalInput = lastUserMessage?.content ?? '';

  return await withSpan(
    { capability: 'support-agent', step: 'categorize-message' },
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

      const result = parsed.error ? 'unknown' : parsed.data;

      // Online evaluation: monitor classification quality in production
      // Active span is auto-linked. Fire-and-forget — doesn't block response.
      void onlineEval(
        { capability: 'support-agent', step: 'categorize-message' },
        {
          input: evalInput,
          output: result,
          scorers: [
            { scorer: validCategoryScorer, sampling: 0.1 },
            { scorer: formatConfidenceScorer, sampling: 0.1 },
          ], // Evaluate 10% of production traffic
        },
      );

      return result;
    },
  );
};
