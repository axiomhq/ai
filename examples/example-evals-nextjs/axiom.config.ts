import { defineConfig } from 'axiom/ai/config';

export default defineConfig({
  __debug__logConfig: true,

  eval: {
    url: process.env.AXIOM_URL,
    token: process.env.AXIOM_TOKEN,
    dataset: process.env.AXIOM_DATASET,

    instrumentation: {
      type: 'file',
      path: './src/instrumentation.ts',
    },

    timeoutMs: 60_000,
  },
});
