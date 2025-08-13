import { defineConfig } from 'axiom/config';

export default defineConfig({
  url: 'https://app.dev.axiomtestlabs.co',
  ai: {
    evals: {
      dataset: 'evals',
      token: process.env.AXIOM_TOKEN || '',
    },
  },
})
