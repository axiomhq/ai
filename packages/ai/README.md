# Axiom AI

Axiom AI SDK provides an API to wrap your AI calls with observability instrumentation.

## Model Wrapping

```ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { wrapAISDKModel } from '@axiomhq/ai';

const geminiProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const geminiFlash = wrapAISDKModel(geminiProvider('gemini-2.5-flash-preview-04-17'));
```

## Tool Wrapping

```ts
import { tool } from 'ai';
import { wrapTool } from '@axiomhq/ai';
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

// Use in your AI SDK call
const result = await generateText({
  model: wrappedModel,
  messages: [{ role: 'user', content: 'What is the weather in London?' }],
  tools: {
    getWeather: wrappedWeatherTool,
  },
});
```

## Install

```bash
npm install @axiomhq/ai
```

## Documentation

For more information about how to set up and use the Axiom JavaScript SDK, read documentation on [axiom.co/docs/ai-engineering/quickstart](https://axiom.co/docs/ai-engineering/quickstart).
