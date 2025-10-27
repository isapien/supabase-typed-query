import { defineConfig } from "vitest/config"

import { resolve } from "path"

export default defineConfig({
  test: {
    name: "integration",
    globals: true,
    environment: "node",
    include: ["**/*.integration.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    // Sequential execution to avoid database conflicts
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 30000,
    setupFiles: ["./test/integration/setup.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
})
