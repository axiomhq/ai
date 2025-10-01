import { generateText, tool } from 'ai';
import { z } from 'zod';
import { gpt4oMini } from '@/shared/openai';
import { withSpan, wrapTools } from 'axiom/ai';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const userId = 123;
  const res = await withSpan({ capability: 'help_user', step: 'get_weather' }, (span) => {
    // you have access to the span in this callback
    span.setAttribute('user_id', userId);

    return generateText({
      model: gpt4oMini,
      maxSteps: 5,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful AI assistant. You must always use the findDirections tool when asked to find directions.',
        },
        {
          role: 'user',
          content: 'How do I get from Paris to Berlin?',
        },
      ],
      tools: wrapTools({
        findDirections: tool({
          description: 'Find directions to a location',
          parameters: z.object({
            from: z.string().describe('The location to start from'),
            to: z.string().describe('The location to find directions to'),
          }),
          execute: async ({ from, to }, _opts) => {
            // Simulate API call delay
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Return mock directions data
            return {
              from,
              to,
              directions: `To get from ${from} to ${to}, use a teleporter.`,
            };
          },
        }),
      }),
    });
  });

  return (
    <div>
      <p>{res.text}</p>
      <pre>messages: {JSON.stringify(res.response.messages, null, 2)}</pre>
    </div>
  );
}
