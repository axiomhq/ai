import { convertToModelMessages, streamText } from 'ai';
import { gpt4oMini } from '@/shared/openai';

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: gpt4oMini,
    messages: await convertToModelMessages(messages),
    telemetry: {
      functionId: 'stream-text-react',
    },
  });

  return result.toUIMessageStreamResponse();
}
