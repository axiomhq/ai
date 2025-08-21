import { defineConfig } from 'axiom/config';

export default defineConfig({
  url: 'https://api.axiom.co',
  credentials: {
    dataset: 'mjs-dataset',
    token: 'mjs-token',
  },
  ai: {
    evals: {
      dataset: 'mjs-dataset',
      token: 'mjs-token',
    },
  },
});
