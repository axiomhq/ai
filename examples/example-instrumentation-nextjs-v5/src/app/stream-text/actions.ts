'use server';

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { gpt4oMini } from '@/shared/openai';
import { withSpan } from '@axiomhq/ai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateStreamingText(input: string) {
  const stream = createStreamableValue('');

  (async () => {
    withSpan({ capability: 'example', step: 'stream' }, async () => {
      const { textStream } = streamText({
        model: gpt4oMini,
        prompt: input,
      });

      for await (const delta of textStream) {
        stream.update(delta);
      }

      stream.done();
    });
  })();

  return { output: stream.value };
}
