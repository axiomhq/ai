import { defineConfig } from 'axiom/ai/config';

export default defineConfig({
  eval: {
    include: ['**/*.eval.{ts,js,mts,mjs,cts,cjs}'],
    exclude: [],
    timeoutMs: 60_000,
    // instrumentation: ({ url, token, dataset, orgId }) =>
    //   // (see `example/kitchen-sink` for an example with instrumentation)
    //   setupAppInstrumentation({ url, token, dataset, orgId }),
  },
});
