import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin.ts', 'src/evals.ts'],
  format: ['esm', 'cjs'],
  external: ['@opentelemetry/api', 'vitest'], // don't bundle these
  dts: true, // generate .d.ts files
  clean: true, // clean dist before build
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  tsconfig: './tsconfig.build.json',
});
