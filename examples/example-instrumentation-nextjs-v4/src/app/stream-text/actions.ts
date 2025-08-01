'use server';

import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { withSpan } from '@axiomhq/ai';
import { gpt4oMini } from '@/shared/openai';

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
