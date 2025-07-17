import { generateText, tool } from 'ai';
import { z } from 'zod';
import { geminiFlash } from '@/shared/gemini';
import { withSpan, wrapToolV1 } from '@axiomhq/ai';

export default async function Page() {
  const userId = 123;
  const res = await withSpan({ capability: 'help_user', step: 'get_weather' }, (span) => {
    // you have access to the span in this callback
    span.setAttribute('user_id', userId);

    return generateText({
      model: geminiFlash,
      maxSteps: 5,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful AI assistant. You must always use the getWeather tool when asked about weather.',
        },
        {
          role: 'user',
          content: 'What is the current weather in Madrid, Spain?',
        },
      ],
      tools: {
        getWeather: wrapToolV1(
          'getWeather',
          tool({
            description: 'Get the current weather for a city',
            parameters: z.object({
              city: z.string().describe('The city to get weather for'),
              country: z.string().describe('The country the city is in'),
            }),
            execute: async ({ city, country }, opts) => {
              // Simulate API call delay
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Return mock weather data
              return {
                city,
                country,
                temperature: 22,
                condition: 'sunny',
                humidity: 45,
                windSpeed: 12,
              };
            },
          }),
        ),
      },
    });
  });

  return (
    <div>
      <p>{res.text}</p>
      <pre>messages: {JSON.stringify(res.response.messages, null, 2)}</pre>
    </div>
  );
}
