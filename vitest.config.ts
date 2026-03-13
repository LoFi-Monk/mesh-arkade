import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    reporters: "verbose",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
