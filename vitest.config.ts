import { globSync } from "node:fs";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Focused tests fail locally as well as in CI, so a pre-push run cannot skip the suite.
    allowOnly: false,
    // Fixtures are lint inputs, never tests.
    exclude: [...configDefaults.exclude, "tests/fixtures/**"],
    // A test that asserts nothing would pass vacuously.
    expect: { requireAssertions: true },
    // Package-test hooks install and delete consumer projects, as slow as the tests themselves.
    hookTimeout: 30_000,
    include: ["tests/**/*.test.ts"],
    // Each worker loads ESLint and TypeScript; package tests also start child processes. Files
    // stay isolated: plugins cache state across lints, and sharing workers saves only about 6%.
    maxWorkers: 2,
    // With `unstubEnvs` and `unstubGlobals`, each test starts with the real implementations,
    // environment variables, and globals. Vitest already clears the calls that mocks recorded.
    restoreMocks: true,
    testTimeout: 30_000,
    unstubEnvs: true,
    unstubGlobals: true,
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
