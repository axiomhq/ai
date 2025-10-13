import { defineConfig } from 'tsup';
import pkg from './package.json';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin.ts', 'src/evals.ts', 'src/config.ts'],
  format: ['esm', 'cjs'],
  external: [
    '@opentelemetry/api',
    'vitest',
    'vitest/node.js',
    'vitest/index.cjs',
    'esbuild',
    'fsevents',
    'c12',
    'defu',
    // Ensure Node builtins used via createRequire stay external in ESM bundle
    'async_hooks',
    'node:async_hooks',
    'module',
    'node:module',
  ], // don't bundle these
  noExternal: ['handlebars'],
  dts: true, // generate .d.ts files
  clean: true, // clean dist before build
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  tsconfig: './tsconfig.build.json',
  define: {
    __SDK_VERSION__: JSON.stringify(pkg.version),
  },
});
