import { defineConfig, type AxiomConfig } from 'axiom/ai/config';

export default defineConfig({
  __debug__useConfig: true,

  axiom: {
    url: process.env.AXIOM_URL || 'https://api.axiom.co',
    token: process.env.AXIOM_TOKEN,
    dataset: process.env.AXIOM_DATASET,
  },
}) satisfies AxiomConfig;
