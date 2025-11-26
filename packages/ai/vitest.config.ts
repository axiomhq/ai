import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globals: true,
    pool: 'forks',
    // TODO: ensure that this allows parallel tests
    isolate: true,
    coverage: {
      enabled: true,
      include: ['src/**/*.{js,ts}'],
      exclude: ['src/**/*.md'],
    },
  },
  resolve: {
    alias: {
      src: resolve(__dirname, './src'),
    },
  },
});
