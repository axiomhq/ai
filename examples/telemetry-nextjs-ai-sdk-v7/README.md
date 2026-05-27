# Next.js with Opentelemetry example

This is a reference example for using Axiom with the Vercel AI SDK v7 with Next.js. The example shows steps for:

- Setting up an OpenTelemetry tracer under `src/instrumentation.ts` that points to Axiom
- Registering AI SDK v7 OpenTelemetry integration under `src/instrumentation.node.ts`
- Configuring an OpenAI model under `src/shared/openai.ts`
- Using runtime context and tool context with `generateText()` under `src/app/generate-text/page.tsx`

## How to use

You will need an Axiom dataset and API key, so go ahead and create those on [Axiom's Console](https://app.axiom.co/datasets).

Then prepare your environment variables

- Copy the environment file: `cp .env-example .env`
- In the new `.env` file, set OpenAI API key, and Axiom API key and dataset name
- Install deps: `pnpm install`
- Run development server `pnpm dev`
- Visit `http://localhost:3000`
- Once the app loads a trace should be sent automatically to Axiom
- Visit Axiom console and navigate to your dataset stream, a list of spans will be visible.
