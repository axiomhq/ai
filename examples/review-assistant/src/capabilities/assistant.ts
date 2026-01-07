import { generateObject } from 'ai';
import { withSpan, wrapAISDKModel } from 'axiom/ai';
import { openai } from '@/openai';
import { z } from 'zod';
import type { UserReview } from '@/schemas';
import { flag } from '@/app-scope';

export async function assistant(input: UserReview) {
  return withSpan({ capability: 'review_assistant', step: 'assistant' }, async () => {
    const [sentiment, summary] = await Promise.all([
      withSpan({ capability: 'review_assistant', step: 'sentiment' }, async () => {
        const modelId = flag('reviewAssistant.sentiment.modelId');
        const model = wrapAISDKModel(openai(modelId));

        const { object: sentiment } = await generateObject({
          model,
          output: 'enum',
          enum: ['positive', 'negative', 'neutral', 'unknown'],
          prompt: `Classify the sentiment of the following review: \`${input.review}\``,
        });

        return sentiment;
      }),

      withSpan({ capability: 'review_assistant', step: 'summarize' }, async () => {
        const modelId = flag('reviewAssistant.summarize.modelId');
        const model = wrapAISDKModel(openai(modelId));

        const { object: summary } = await generateObject({
          model,
          schema: z.object({ summary: z.string() }),
          prompt: `Summarize the following review in 20 words or less: \`${input.review}\``,
        });

        return summary.summary;
      }),
    ]);

    return {
      sentiment,
      summary,
    };
  });
}
