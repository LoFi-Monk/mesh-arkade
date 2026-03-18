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
      "bare-type": path.resolve(__dirname, "./tests/mocks/bare-type.ts"),
      "bare-dns/binding": path.resolve(__dirname, "./tests/mocks/binding.ts"),
      "bare-tcp/binding": path.resolve(__dirname, "./tests/mocks/binding.ts"),
      "bare-net/binding": path.resolve(__dirname, "./tests/mocks/binding.ts"),
      "bare-pipe/binding": path.resolve(__dirname, "./tests/mocks/binding.ts"),
      "bare-dgram/binding": path.resolve(__dirname, "./tests/mocks/binding.ts"),
      "bare-os/binding": path.resolve(__dirname, "./tests/mocks/binding.ts"),
      "bare-fs/binding": path.resolve(__dirname, "./tests/mocks/binding.ts"),
    },
    server: {
      deps: {
        // inline: [/bare-/], // Removed to stop Vite from analyzing bare-* bindings
      },
    },
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      include: ["src/**"],
      exclude: [
        "src/main.tsx",
        "src/App.tsx",
        "src/components/**",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/__tests__/**",
        "src/core/__tests__/**",
        "src/fetch/__tests__/**",
        "src/cli/__tests__/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
