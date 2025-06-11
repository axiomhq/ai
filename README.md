# Axiom AI

This repo contains all the SDKs and libraries needed for AI models obsverability.

## Install Axiom SDK

```bash
npm install @axiomhq/ai autoevals
```

## Create and run a prompt

```ts
import Axiom from "@axiomhq/ai";

const ai = new Axiom(process.env.API_KEY);

async function main() {
  const prompt = await ai.prompts.create({
    name: "email-summarizer",
    messages: [
      {
        role: "system",
        content: "Summarize emails concisely, highlighting action items.",
      },
      {
        role: "user",
        content: "{{email_content}}",
      },
    ],
    model: "gpt-4",
    temperature: 0.3,
  });

  // Deploy to production
  await ai.prompts.deploy(prompt.id, {
    environment: "production",
    version: prompt.version,
  });

  ai.run({
    prompt: "email-summarizer",
    inputs: {
      email_content: "Hello, how are you?",
    },
  });
}
```

## Vercel AI SDK Wrappers

The SDK provides OpenTelemetry-wrapped versions of Vercel's AI SDK functions for better observability. These wrappers automatically track important metrics and attributes for your AI operations.

### Text Generation

```ts
import { generateTextWithSpan } from "@axiomhq/ai";
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("my-app");

// Generate text with tracing
const result = await generateTextWithSpan(
  tracer,
  "email.summarize", // Format: workflowName.taskName
  {
    model: { modelId: "gpt-4", provider: "openai" },
    prompt: "Summarize this email: {{email}}",
    system: "You are a helpful email summarizer",
  },
  {
    logPrompt: true, // Log the prompt in the span
    logResponse: true, // Log the response in the span
    additionalAttributes: {
      "custom.attribute": "value",
    },
  }
);
```

### Object Generation

```ts
import { generateObjectWithSpan } from "@axiomhq/ai";
import { trace } from "@opentelemetry/api";
import { z } from "zod";

const tracer = trace.getTracer("my-app");

// Define your schema
const EmailSummarySchema = z.object({
  summary: z.string(),
  actionItems: z.array(z.string()),
});

// Generate structured object with tracing
const result = await generateObjectWithSpan(
  tracer,
  "email.analyze", // Format: workflowName.taskName
  {
    model: { modelId: "gpt-4", provider: "openai" },
    schema: EmailSummarySchema,
    prompt: "Analyze this email: {{email}}",
    system: "You are a helpful email analyzer",
  },
  {
    logPrompt: true,
    logResponse: true,
  }
);
```

### Semantic Conventions

The wrappers automatically track important attributes following OpenTelemetry semantic conventions:

- Operation details (name, workflow, task)
- Model information (requested and actual model used)
- Input/output tokens and usage
- Estimated cost
- Prompt and response content (when enabled)
- Provider metadata
- Custom attributes

These attributes can be used to:

- Monitor AI operation costs
- Track token usage
- Debug model behavior
- Analyze prompt effectiveness
- Monitor system performance

For a complete list of tracked attributes, see the `Attr` object in `@axiomhq/ai/src/otel/semconv/attributes.ts`.
