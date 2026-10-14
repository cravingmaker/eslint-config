import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Each worker loads ESLint and TypeScript; package tests also start child processes.
    maxWorkers: 2,
    testTimeout: 30_000,
  },
});
