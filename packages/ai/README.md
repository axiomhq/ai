# Axiom AI

Axiom AI SDK provides an API to wrap your AI calls with observability instrumentation.

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

## Install

```bash
npm install axiom
```

## Eval Instrumentation

When running evals, share your existing OpenTelemetry setup by exporting a function that initializes your tracer provider:

```ts
// instrumentation.node.ts
import { NodeTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { initAxiomAI } from 'axiom/ai';
import type { AxiomEvalInstrumentationHook } from 'axiom/ai/config';

let provider: NodeTracerProvider | undefined;

export const setupAppInstrumentation: AxiomEvalInstrumentationHook = async ({ dataset, token, url }) => {
  if (provider) return { provider };

  const exporter = new OTLPTraceExporter({
    url: `${url}/v1/traces`,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-Axiom-Dataset': dataset,
    },
  });

  provider = new NodeTracerProvider({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'my-app' }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register();
  initAxiomAI({ tracer: provider.getTracer('my-app') });

  return { provider };
};
```

```ts
// axiom.config.ts
import { defineConfig } from 'axiom/ai/config';
import { setupAppInstrumentation } from './instrumentation.node';

export default defineConfig({
  eval: {
    instrumentation: setupAppInstrumentation,
    // ...
  },
});
```

## Documentation

For more information about how to set up and use the Axiom JavaScript SDK, read documentation on [axiom.co/docs/ai-engineering/quickstart](https://axiom.co/docs/ai-engineering/quickstart).
