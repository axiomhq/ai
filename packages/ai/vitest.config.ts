import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["__test__/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      src: resolve(__dirname, "./src"),
    },
  },
});
