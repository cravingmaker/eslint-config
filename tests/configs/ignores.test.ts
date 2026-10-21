import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

const directory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-ignores-"),
);
const generatedDirectories = [
  "dist",
  "build",
  "coverage",
  ".next",
  ".svelte-kit",
];
const generated = ["", "packages/app/"].flatMap((prefix) => {
  return generatedDirectories.map((name) => {
    return `${prefix}${name}/generated.js`;
  });
});
const sources = [
  "src/index.js",
  "packages/app/src/index.js",
  "src/.next.js",
  "src/.svelte-kit.js",
];
await Promise.all(
  [...generated, ...sources, "custom/generated.js"].map(async (file) => {
    const location = path.join(directory, file);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Each fixed fixture path is inside this suite's temporary project.
    await mkdir(path.dirname(location), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only the enumerated fixtures in this suite's temporary project.
    await writeFile(location, "export const generated = 1;\n");
  }),
);
afterAll(async () => {
  await rm(directory, { force: true, recursive: true });
});

const engine = async (
  ignores: readonly string[] = [],
  shouldEnableFrameworks = false,
) => {
  return new ESLint({
    cwd: directory,
    overrideConfig: await createConfig({
      ignores: [...ignores],
      projectRootDirectory: directory,
      react: shouldEnableFrameworks ? { refresh: "next" } : false,
      svelte: shouldEnableFrameworks,
      typescript: { typeChecked: false },
    }),
    overrideConfigFile: true,
  });
};

describe("global generated-directory ignores", () => {
  it.each([false, true])(
    "ignores root and nested outputs independently of framework toggles %s",
    async (shouldEnableFrameworks) => {
      const eslint = await engine([], shouldEnableFrameworks);
      expect(
        await Promise.all(
          generated.map(async (file) => {
            return await eslint.isPathIgnored(file);
          }),
        ),
      ).toEqual(
        generated.map(() => {
          return true;
        }),
      );
      const results = await eslint.lintFiles(["."]);
      expect(
        results
          .map(({ filePath }) => {
            return path.relative(directory, filePath);
          })
          .toSorted((left, right) => {
            return left.localeCompare(right);
          }),
      ).toEqual(
        [...sources, "custom/generated.js"].toSorted((left, right) => {
          return left.localeCompare(right);
        }),
      );
      expect(
        results.every(({ fatalErrorCount }) => {
          return fatalErrorCount === 0;
        }),
      ).toBe(true);
    },
  );

  it("appends caller directory ignores and directory negations in order", async () => {
    const eslint = await engine([
      "custom/",
      "!**/.next/",
      "!**/.svelte-kit/",
      "packages/app/.next/",
    ]);
    expect(await eslint.isPathIgnored("custom/generated.js")).toBe(true);
    expect(await eslint.isPathIgnored(".next/generated.js")).toBe(false);
    expect(await eslint.isPathIgnored(".svelte-kit/generated.js")).toBe(false);
    expect(
      await eslint.isPathIgnored("packages/app/.svelte-kit/generated.js"),
    ).toBe(false);
    expect(await eslint.isPathIgnored("packages/app/.next/generated.js")).toBe(
      true,
    );
    const [result] = await eslint.lintFiles([".next/generated.js"]);
    expect(result.fatalErrorCount).toBe(0);
    expect(
      result.messages.every(({ ruleId }) => {
        return typeof ruleId === "string";
      }),
    ).toBe(true);
  });

  it("requires unignoring the directory before a descendant can be re-included", async () => {
    const eslint = await engine(["!**/.next/generated.js"]);
    expect(await eslint.isPathIgnored(".next/generated.js")).toBe(true);
  });
});
