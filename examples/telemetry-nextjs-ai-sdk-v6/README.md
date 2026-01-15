# Next.js with Opentelemetry example

This is a reference example for using Axiom with the Vercel AI SDK v6 with Next.js. The example shows steps for:

- Setting up an OpenTelemetry tracer under `src/instrumentation.ts` that points to Axiom
- Wrapping AI SDK model under `src/shared/openai.ts`
- Utilizing `withSpan()` and wrapping tools with `wrapTools()` to generate text using Vercel's AI SDK under `app/page.tsx`

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
