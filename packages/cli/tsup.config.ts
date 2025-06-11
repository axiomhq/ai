import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  external: ["commander"], // don't bundle dependencies
  dts: true, // generate .d.ts files
  clean: true, // clean dist before build
  sourcemap: true,
  target: "node18", // CLI target
  outDir: "dist",
  platform: "node",
  shims: false, // no need for browser shims
});
