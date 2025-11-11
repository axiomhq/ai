import { defineConfig } from 'axiom/ai/config';
import { setupAppInstrumentation } from './src/instrumentation.node';

export default defineConfig({
  eval: {
    include: ['**/*.eval.{ts,js,mts,mjs,cts,cjs}'],
    exclude: [],

    instrumentation: ({ url, token, dataset }) => setupAppInstrumentation({ url, token, dataset }),

    timeoutMs: 60_000,
  },
});
