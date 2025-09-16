import { resolve } from 'path';

// TODO: BEFORE MERGE - discuss with @islam about how to best handle vitest configs (we dont have `defineConfig` here)

export default {
  resolve: {
    alias: {
      '@': resolve('./src'),
    },
  },
};
