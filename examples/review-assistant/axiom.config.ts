import 'dotenv/config';
import { defineConfig } from 'axiom/ai/config';
import { flagSchema } from './src/app-scope';

export default defineConfig({
  eval: {
    include: ['**/*.eval.{ts,js,mts,mjs,cts,cjs}'],
    exclude: [],
    dataset: process.env.AXIOM_EVALS_DATASET,
    url: process.env.AXIOM_URL,
    token: process.env.AXIOM_TOKEN,
    orgId: process.env.AXIOM_ORG_ID,
    flagSchema,
    timeoutMs: 60_000,
  },
});
