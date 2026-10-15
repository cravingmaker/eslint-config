/* eslint-disable security/detect-non-literal-fs-filename -- Watcher regressions create and edit inputs in an isolated temporary workspace. */

import { once } from "node:events";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";
import { createVitest, parseCLI } from "vitest/node";

import packageJson from "../package.json" with { type: "json" };

const directory = path.resolve(import.meta.dirname, "..");
const packageTests = [
  "tests/package/consumers.test.ts",
  "tests/package/contract.test.ts",
  "tests/package/install.test.ts",
  "tests/package/readme.test.ts",
  "tests/package/smoke.test.ts",
];
const testFiles = [
  "tests/factory/factory.test.ts",
  "tests/policy/fixtures.test.ts",
  "tests/policy/formatting.test.ts",
  "tests/scripts/policy-diff.test.ts",
  "tests/typegen.test.ts",
  "tests/utilities.test.ts",
  ...packageTests,
];
const changes = [
  {
    filename: "tests/fixtures/sample.ts",
    tests: [
      "tests/factory/factory.test.ts",
      "tests/policy/fixtures.test.ts",
      "tests/policy/formatting.test.ts",
      "tests/package/install.test.ts",
      "tests/package/readme.test.ts",
    ],
  },
  { filename: "dist/index.mjs", tests: testFiles },
  { filename: "dist/index.d.mts", tests: testFiles },
  { filename: "dist/index.mjs", rebuild: true, tests: testFiles },
  { filename: "src/typegen.d.ts", tests: ["tests/typegen.test.ts"] },
  { filename: "README.md", tests: ["tests/package/readme.test.ts"] },
  {
    filename: "package-lock.json",
    tests: ["tests/package/contract.test.ts"],
  },
  {
    filename: "scripts/policy-diff/report.ts",
    tests: ["tests/scripts/policy-diff.test.ts"],
  },
  {
    filename: "tests/policy/effective-scenarios.ts",
    tests: ["tests/scripts/policy-diff.test.ts"],
  },
  { filename: "package.json", tests: testFiles },
];

describe("Vitest watch dependencies", () => {
  it.each(["package", "regular"] as const)(
    "reruns filesystem inputs within the %s UI command's scope",
    async (scenario) => {
      const temporaryDirectory = await fs.mkdtemp(
        path.join(os.tmpdir(), "eslint-config-watch-"),
      );
      const workspace = await fs.realpath(temporaryDirectory);
      const selectedTests = testFiles.filter((filename) =>
        scenario === "package"
          ? filename.startsWith("tests/package/")
          : !filename.startsWith("tests/package/"),
      );
      const reports = new EventTarget();
      // Exercise the actual UI filters; the build prefix is unnecessary for these stub tests.
      const command = packageJson.scripts[
        scenario === "package" ? "test:package:ui" : "test:ui"
      ].split(" && ", 2)[1];
      const { filter, options } = parseCLI(command);

      try {
        await fs.copyFile(
          path.join(directory, "vitest.config.ts"),
          path.join(workspace, "vitest.config.ts"),
        );
        await fs.symlink(
          path.join(directory, "node_modules"),
          path.join(workspace, "node_modules"),
          "junction",
        );
        await Promise.all(
          testFiles.map(async (filename) => {
            const target = path.join(workspace, filename);
            await fs.mkdir(path.dirname(target), { recursive: true });
            await fs.writeFile(
              target,
              'import { expect, it } from "vitest"; it("runs", () => { expect(true).toBe(true); });',
            );
          }),
        );
        await Promise.all(
          changes.map(async ({ filename }) => {
            const target = path.join(workspace, filename);
            await fs.mkdir(path.dirname(target), { recursive: true });
            await fs.writeFile(
              target,
              filename === "package.json"
                ? '{"type":"module"}\n'
                : "// initial input\n",
            );
          }),
        );

        const runner = await createVitest("test", {
          ...options,
          config: path.join(workspace, "vitest.config.ts"),
          maxWorkers: 1,
          open: false,
          reporters: [
            {
              onTestRunEnd(modules, errors, reason) {
                const files = new Set(
                  modules.map((module) =>
                    path.relative(workspace, module.moduleId),
                  ),
                );
                reports.dispatchEvent(
                  new CustomEvent("complete", {
                    detail: {
                      errors,
                      files,
                      reason,
                    },
                  }),
                );
              },
            },
          ],
          root: workspace,
          ui: false,
        });

        try {
          const initial = once(reports, "complete", {
            signal: AbortSignal.timeout(20_000),
          });
          await runner.start(filter);
          await expect(initial).resolves.toEqual([
            expect.objectContaining({
              detail: {
                errors: [],
                files: new Set(selectedTests),
                reason: "passed",
              },
            }),
          ]);

          /* eslint-disable functional/no-loop-statements, no-await-in-loop -- Each filesystem edit must finish its watcher run before the next input changes. */
          for (const change of changes) {
            const expected = change.tests.filter((filename) =>
              selectedTests.includes(filename),
            );
            if (expected.length === 0) continue;

            const completed = once(reports, "complete", {
              signal: AbortSignal.timeout(10_000),
            });
            /* eslint-disable functional/no-conditional-statements -- A rebuild removes and recreates the outputs; other inputs need a single edit. */
            if ("rebuild" in change) {
              const removed = once(runner.vite.watcher, "unlinkDir", {
                signal: AbortSignal.timeout(10_000),
              });
              const buildDirectory = path.join(workspace, "dist");
              await fs.rm(buildDirectory, { recursive: true });
              await removed;
              await fs.mkdir(buildDirectory);
              await Promise.all(
                ["index.mjs", "index.d.mts"].map(async (filename) => {
                  const target = path.join(buildDirectory, filename);
                  await fs.writeFile(target, "// rebuilt input\n");
                }),
              );
            } else {
              await fs.appendFile(
                path.join(workspace, change.filename),
                change.filename === "package.json"
                  ? "\n"
                  : "// changed input\n",
              );
            }
            /* eslint-enable functional/no-conditional-statements -- Restore the branch guard after applying the filesystem change. */
            await expect(completed, change.filename).resolves.toEqual([
              expect.objectContaining({
                detail: {
                  errors: [],
                  files: new Set(expected),
                  reason: "passed",
                },
              }),
            ]);
          }
          /* eslint-enable functional/no-loop-statements, no-await-in-loop -- Restore the style guards after sequential watcher checks. */
        } finally {
          await runner.close();
        }
      } finally {
        await fs.rm(workspace, { force: true, recursive: true });
      }
    },
    40_000,
  );
});
