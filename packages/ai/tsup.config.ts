import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  external: ["@opentelemetry/api"], // don't bundle it
  dts: true, // generate .d.ts files
  clean: true, // clean dist before build
  sourcemap: true,
  target: "es2020",
  outDir: "dist",
});
