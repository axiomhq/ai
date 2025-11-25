import { resolve } from 'path';

// TODO: discuss with @islam about how to best handle vitest configs (we dont have `defineConfig` here unless we peer dep vitest)

export default {
  resolve: {
    alias: {
      '@': resolve('./src'),
    },
  },
};
