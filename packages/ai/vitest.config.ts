import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globals: true,
    pool: 'forks',
    // TODO: ensure that this allows parallel tests
    poolOptions: {
      forks: {
        isolate: true,
      },
    },
    coverage: {
      enabled: true,
    },
  },
  resolve: {
    alias: {
      src: resolve(__dirname, './src'),
    },
  },
});
