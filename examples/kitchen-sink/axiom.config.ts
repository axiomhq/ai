import { defineConfig } from 'axiom/ai/config';
import { setupAppInstrumentation } from './src/instrumentation.node';

export default defineConfig({
  eval: {
    include: ['**/*.eval.{ts,js,mts,mjs,cts,cjs}'],
    exclude: [],

    dataset: process.env.NEXT_PUBLIC_AXIOM_DATASET,
    url: process.env.NEXT_PUBLIC_AXIOM_URL,
    token: process.env.AXIOM_TOKEN,

    instrumentation: (env) => setupAppInstrumentation(env),

    timeoutMs: 60_000,
  },
});
