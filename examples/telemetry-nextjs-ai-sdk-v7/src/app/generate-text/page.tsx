import { generateText, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { gpt4oMini } from '@/shared/openai';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const userId = 123;
  const requestId = crypto.randomUUID();

  const res = await generateText({
    runtimeContext: {
      requestId,
      userId,
      'flat.foo': 'bar', // arrives
      nested: { foo: 'bar' }, // does not arrive
    },
    sensitiveRuntimeContext: {
      userId: true,
    },
    telemetry: {
      functionId: 'generate-text-directions',
      isEnabled: true,
    },
    model: gpt4oMini,
    stopWhen: stepCountIs(5),
    system:
      'You are a helpful AI assistant. You must always use the findDirections tool when asked to find directions.',
    messages: [
      {
        role: 'user',
        content: 'How do I get from Paris to Berlin?',
      },
    ],
    tools: {
      findDirections: tool({
        description: 'Find directions to a location',
        inputSchema: z.object({
          from: z.string().describe('The location to start from'),
          to: z.string().describe('The location to find directions to'),
        }),
        contextSchema: z.object({
          userId: z.number(),
          routePreference: z.enum(['fastest', 'scenic']),
        }),
        sensitiveContext: {
          userId: true,
        },
        execute: async (params, { abortSignal, context, toolCallId }) => {
          const { from, to } = params;
          // Simulate API call delay
          await new Promise((resolve) => setTimeout(resolve, 500));

          abortSignal?.throwIfAborted();

          // Return mock directions data
          return {
            from,
            to,
            directions: `To get from ${from} to ${to}, use a teleporter.`,
            routePreference: context.routePreference,
            toolCallId,
            userId: context.userId,
          };
        },
      }),
    },
    toolsContext: {
      findDirections: {
        userId,
        routePreference: 'fastest',
      },
    },
  });

  return (
    <div>
      <p>{res.text}</p>
      <pre>messages: {JSON.stringify(res.response.messages, null, 2)}</pre>
    </div>
  );
}
