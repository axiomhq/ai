# Axiom AI

Axiom AI SDK provides
- an API to wrap your AI calls with observability instrumentation.
- offline evals

## Install

```bash
npm install axiom
```

## Model Wrapping

```ts
import { createOpenAI } from '@ai-sdk/openai';
import { axiomAIMiddleware } from 'axiom/ai';
import { wrapLanguageModel } from 'ai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  compatibility: 'strict',
});

const model = openai('gpt-4o-mini');

export const gpt4oMini = wrapLanguageModel({
  model,
  middleware: [axiomAIMiddleware({ model })],
});
```

## Tool Wrapping

```ts
import { tool } from 'ai';
import { wrapTool } from 'axiom/ai';
import { z } from 'zod';

const getWeather = tool({
  description: 'Get current weather for a city',
  parameters: z.object({
    city: z.string().describe('The city name'),
    country: z.string().describe('The country code'),
  }),
  execute: async ({ city, country }) => {
    // Your tool implementation
    return {
      city,
      country,
      temperature: 22,
      condition: 'sunny',
    };
  },
});

// Wrap the tool for observability
const wrappedWeatherTool = wrapTool('weatherTool', weatherTool);
```

## Making AI Calls
```ts
const result = await withSpan(
  { capability: 'weather_bot', step: 'get_weather' },
  (span) => {
    return generateText({
      model: gpt4oMini,
      messages: [{ role: 'user', content: 'What is the weather in London?' }],
      tools: {
        getWeather: wrappedWeatherTool,
      },
    })
  }
)
```

## Documentation

For more information about how to set up and use the Axiom JavaScript SDK, read documentation on [axiom.co/docs/ai-engineering/quickstart](https://axiom.co/docs/ai-engineering/quickstart).
