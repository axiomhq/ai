'use server';

import { generateText, streamText } from 'ai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { withSpan } from '@axiomhq/ai';
import { o3Mini } from '@/shared/openai';

export async function generateReasoningText(input: string) {
  return withSpan({ capability: 'reasoning_example', step: 'generate' }, async (span) => {
    span.setAttribute('input_length', input.length);
    span.setAttribute('model_type', 'o3-mini');
    
    const result = await generateText({
      model: o3Mini,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful AI assistant that thinks step by step. Use your reasoning capabilities to provide detailed explanations.',
        },
        {
          role: 'user',
          content: input,
        },
      ],
      maxOutputTokens: 1000,
    });

    span.setAttribute('output_length', result.text.length);
    span.setAttribute('reasoning_tokens', (result.usage as any)?.reasoningTokens || 0);
    span.setAttribute('total_tokens', result.usage?.totalTokens || 0);

    // Return only serializable data
    return {
      text: result.text,
      usage: {
        inputTokens: result.usage?.inputTokens || 0,
        outputTokens: result.usage?.outputTokens || 0,
        reasoningTokens: (result.usage as any)?.reasoningTokens || 0,
        totalTokens: result.usage?.totalTokens || 0,
      },
      finishReason: result.finishReason,
    };
  });
}

export async function streamReasoningText(input: string) {
  const stream = createStreamableValue('');

  (async () => {
    await withSpan({ capability: 'reasoning_example', step: 'stream' }, async (span) => {
      span.setAttribute('input_length', input.length);
      span.setAttribute('model_type', 'o3-mini');
      
      const { textStream } = streamText({
        model: o3Mini,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful AI assistant that thinks step by step. Use your reasoning capabilities to provide detailed explanations.',
          },
          {
            role: 'user',
            content: input,
          },
        ],
        maxOutputTokens: 1000,
      });

      for await (const delta of textStream) {
        stream.update(delta);
      }

      stream.done();
    });
  })();

  return { output: stream.value };
}
