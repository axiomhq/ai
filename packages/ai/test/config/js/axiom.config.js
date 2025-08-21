import { defineConfig } from 'axiom/config';

export default defineConfig({
  url: 'https://api.axiom.co',
  credentials: {
    dataset: 'js-dataset',
    token: 'js-token',
  },
  ai: {
    evals: {
      dataset: 'js-dataset',
      token: 'js-token',
    },
  },
});
