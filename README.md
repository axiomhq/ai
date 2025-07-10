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

They can be used both with and without an existing OpenTelemetry setup

(todo: insert docs from notion here)