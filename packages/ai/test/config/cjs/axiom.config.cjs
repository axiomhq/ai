const { defineConfig } = require('axiom/config');

module.exports = defineConfig({
  url: 'https://api.axiom.co',
  credentials: {
    dataset: 'cjs-dataset',
    token: 'cjs-token',
  },
  ai: {
    evals: {
      dataset: 'cjs-dataset',
      token: 'cjs-token',
    },
  },
});
