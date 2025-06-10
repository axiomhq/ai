import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      outDir: "dist/types",
    }),
  ],
  build: {
    target: "node22",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: ["commander"],
    },
    outDir: "dist",
    sourcemap: true,
    ssr: true,
  },
});
