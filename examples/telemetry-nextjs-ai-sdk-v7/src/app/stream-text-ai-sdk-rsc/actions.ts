'use server';

import { streamText } from 'ai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { gpt4oMini } from '@/shared/openai';

export async function generateStreamingText(input: string) {
  const stream = createStreamableValue('');

  (async () => {
    const { textStream } = streamText({
      model: gpt4oMini,
      prompt: input,
      telemetry: {
        functionId: 'stream-text-rsc',
      },
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}
