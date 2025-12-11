/**
 * Build Configuration
 *
 * We use two separate tsup builds to handle client vs server module requirements:
 * - Client modules (feedback.ts): Built without Node.js shims for browser compatibility
 * - Server modules: Built with Node.js shims for dual ESM/CJS support
 *
 * The build script cleans dist/ externally before running tsup, so both configs
 * use clean: false to avoid any ordering dependencies between builds.
 */
import { defineConfig } from 'tsup';
import pkg from './package.json';

const sharedConfig = {
  format: ['esm', 'cjs'] as ('esm' | 'cjs')[],
  external: [
    '@opentelemetry/api',
    'vitest',
    'vitest/node',
    'vitest/index.cjs',
    'vitest/runners',
    'esbuild',
    'fsevents',
    'c12',
    'defu',
    'vite-tsconfig-paths',
    // Ensure Node builtins used via createRequire stay external in ESM bundle
    'async_hooks',
    'node:async_hooks',
    'module',
    'node:module',
  ],
  dts: true,
  sourcemap: true,
  target: 'es2020' as const,
  outDir: 'dist',
  tsconfig: './tsconfig.build.json',
  define: {
    __SDK_VERSION__: JSON.stringify(pkg.version),
  },
};

export default defineConfig([
  // Client-compatible modules (no Node.js shims)
  {
    ...sharedConfig,
    entry: ['src/feedback.ts'],
    clean: false,
    shims: false,
  },
  // Server-side modules (with Node.js shims)
  {
    ...sharedConfig,
    entry: [
      'src/index.ts',
      'src/bin.ts',
      'src/evals.ts',
      'src/config.ts',
      'src/evals/custom-runner.ts',
    ],
    noExternal: ['handlebars'],
    clean: false,
    shims: true,
  },
]);
