import { defineConfig } from 'tsup';
import pkg from './package.json';

const sharedConfig = {
  format: ['esm'],
  external: [
    '@opentelemetry/api',
    'vitest',
    'vitest/node',
    'vitest/runners',
    'esbuild',
    'fsevents',
    'c12',
    'defu',
    'vite-tsconfig-paths',
    // Keep async_hooks external so the ESM build preserves Node's builtin import.
    'node:async_hooks',
  ],
  dts: true,
  sourcemap: true,
  target: 'es2020' as const,
  outDir: 'dist',
  tsconfig: './tsconfig.build.json',
  define: {
    __SDK_VERSION__: JSON.stringify(pkg.version),
  },
  removeNodeProtocol: false,
};

export default defineConfig([
  // Client-compatible modules (no Node.js shims) - runs first with clean
  {
    ...sharedConfig,
    entry: ['src/feedback.ts'],
    clean: true,
    shims: false,
  },
  // Server-side modules - runs after, no clean
  {
    ...sharedConfig,
    entry: [
      'src/index.ts',
      'src/bin.ts',
      'src/evals.ts',
      'src/config.ts',
      'src/evals/custom-runner.ts',
      'src/scorers/aggregations.ts',
      'src/scorers/scorers.ts',
      'src/evals/online.ts',
    ],
    noExternal: ['handlebars'],
    clean: false,
  },
]);
