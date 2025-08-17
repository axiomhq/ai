import { convertToModelMessages, streamText } from 'ai';
import { gpt4oMini } from '@/shared/openai';
import { withSpan } from 'axiom/ai';

export async function POST(request: Request) {
  const { messages } = await request.json();

  return withSpan({ capability: 'stream_text_demo', step: 'generate_response' }, async (_span) => {
    const result = streamText({
      model: gpt4oMini,
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  });
}
