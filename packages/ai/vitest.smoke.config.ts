import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.smoke.ts'],
    globals: true,
    pool: 'forks',
    isolate: true,
    coverage: {
      enabled: false,
    },
  },
  resolve: {
    alias: {
      src: resolve(__dirname, './src'),
    },
  },
});
