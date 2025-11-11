import { defineConfig } from 'axiom/ai/config';
import { setupAppInstrumentation } from './src/instrumentation.node';

export default defineConfig({
  eval: {
    // @ts-expect-error - this is a temporary hack to allow us to use the resources url
    __overrideEndpointUrl: process.env.AXIOM_RESOURCES_URL,

    include: ['**/*.eval.{ts,js,mts,mjs,cts,cjs}'],
    exclude: [],

    instrumentation: ({ url, token, dataset }) => setupAppInstrumentation({ url, token, dataset }),

    timeoutMs: 60_000,
  },
});
