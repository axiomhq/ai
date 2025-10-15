import { defineConfig } from 'axiom/ai/config';
import { setupAppInstrumentation } from './src/instrumentation.node';

export default defineConfig({
  eval: {
    url: process.env.AXIOM_URL,
    token: process.env.AXIOM_TOKEN,
    dataset: process.env.AXIOM_DATASET,

    // TODO: REMOVE THIS @gabrielelpidio
    apiUrl: process.env.AXIOM_API_URL,

    include: ['**/*.eval.{ts,js,mts,mjs,cts,cjs}'],
    exclude: [],

    instrumentation: ({ url, token, dataset }) => setupAppInstrumentation({ url, token, dataset }),

    timeoutMs: 60_000,
  },
});
