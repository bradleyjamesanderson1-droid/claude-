import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset paths, so the build works from any sub-path (e.g. GitHub Pages /solar-system/).
  base: "./",
  build: { target: "es2022", chunkSizeWarningLimit: 1000 },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
