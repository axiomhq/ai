# Express with Opentelemetry example

This is a reference example for using Axiom with the Vercel AI SDK v4 with Express. The example shows steps for:

- Setting up a NodeSDK tracer under `src/instrumentation.ts` that points to Axiom
- Wrapping AI SDK model under `src/model.ts`
- Utilizing `withSpan()` to generate text using Vercel's AI SDK under `src/index.ts`

## How to use

You will need an Axiom dataset and API key, so gead ahead and create those on [Axiom's Console](https://app.axiom.co/datasets).

Then prepare your environment variables

- Copy the environment file: `cp .env-example .env`
- In the new `.env` file, set OpenAI API key, and Axiom API key and dataset name
- Install deps: `pnpm install`
- Run development server `pnpm dev`
- Visit `http://localhost:3000/hello/world` or `http://localhost:3000/stream/world`
- Once you hit the endpoint a trace should be sent automatically to Axiom
- Visit Axiom console and navigate to your dataset stream, a list of spans will be visible.
