import { globSync } from "node:fs";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Each worker loads ESLint and TypeScript; package tests also start child processes.
    maxWorkers: 2,
    testTimeout: 30_000,
    // Files read through ESLint, TypeScript, or consumer subprocesses need explicit mappings.
    watchTriggerPatterns: [
      {
        // Explicit mappings also handle outputs recreated by `npm run clean`.
        pattern: /(?:^|\/)dist\/index\.(?:d\.mts|mjs)$/u,
        testsToRun: (_filename) => {
          // eslint-disable-next-line n/no-sync -- Vitest requires a synchronous list of current tests for each build event.
          return globSync("tests/**/*.test.ts", {
            cwd: import.meta.dirname,
          });
        },
      },
      {
        pattern: /(?:^|\/)tests\/fixtures\//u,
        testsToRun: (_filename) => {
          return [
            "tests/factory/factory.test.ts",
            "tests/policy/fixtures.test.ts",
            "tests/policy/formatting.test.ts",
            "tests/package/install.test.ts",
            "tests/package/readme.test.ts",
          ];
        },
      },
      {
        pattern: /(?:^|\/)src\/typegen\.d\.ts$/u,
        testsToRun: (_filename) => {
          return "tests/scripts/typegen.test.ts";
        },
      },
      {
        pattern: /(?:^|\/)README\.md$/u,
        testsToRun: (_filename) => {
          return "tests/package/readme.test.ts";
        },
      },
      {
        pattern: /(?:^|\/)package-lock\.json$/u,
        testsToRun: (_filename) => {
          return "tests/package/contract.test.ts";
        },
      },
      {
        // The policy report runs in a child process, which loads these modules itself.
        pattern:
          /(?:^|\/)(?:scripts\/policy-diff(?:\.ts$|\/)|src\/utilities\/is-record\.ts$|tests\/policy\/effective-(?:config|scenarios)\.ts$|tests\/support\/resolved-config\.ts$)/u,
        testsToRun: (_filename) => {
          return "tests/scripts/policy-diff.test.ts";
        },
      },
      {
        // The workflow check runs in a child process, which loads these files itself.
        pattern:
          /(?:^|\/)scripts\/(?:actionlint\.mjs|actionlint-reference\.json|check-workflows\.mjs)$/u,
        testsToRun: (_filename) => {
          return "tests/scripts/workflow-tool.test.ts";
        },
      },
    ],
  },
});
