# Axiom AI

Axiom AI SDK provides a simple API to wrap your AI models with observability instrumentation.

```ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { wrapAISDKModel } from '@axiomhq/ai';

const geminiProvider = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const geminiFlash = wrapAISDKModel(geminiProvider('gemini-2.5-flash-preview-04-17'));

```

## Install

```bash
npm install @axiomhq/ai
```

## Documentation

For more information about how to set up and use the Axiom JavaScript SDK, read documentation on [axiom.co/docs/ai-engineering/quickstart](https://axiom.co/docs/ai-engineering/quickstart).
