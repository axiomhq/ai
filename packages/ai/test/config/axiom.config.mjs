import { defineConfig } from './packages/ai/dist/config.js';

export default defineConfig({
  url: "https://api.axiom.co",
  ai: {
    evals: {
      dataset: "test-dataset",
      token: "test-token"
    }
  }
});