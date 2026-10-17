/* eslint-disable security/detect-non-literal-fs-filename -- The fixtures are written to a temporary directory. */

import type { Linter } from "eslint";

import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";
import { describeEffectiveConfig } from "../policy/effective-config.js";

const temporaryRoot = await realpath(os.tmpdir());
const temporaryDirectory = await mkdtemp(
  path.join(temporaryRoot, "eslint-config-preparation-"),
);

const createProject = async (manifest?: string): Promise<string> => {
  const directory = await mkdtemp(path.join(temporaryDirectory, "project-"));
  if (typeof manifest === "undefined") {
    return directory;
  }
  await writeFile(path.join(directory, "package.json"), manifest, "utf8");
  return directory;
};
const describeSources = async (
  configs: readonly Linter.Config[],
): Promise<readonly string[]> => {
  const eslint = new ESLint({
    overrideConfig: [...configs],
    overrideConfigFile: true,
  });
  return await Promise.all(
    ["src/example.js", "src/example.ts"].map(async (filePath) => {
      return await describeEffectiveConfig(eslint, filePath, process.cwd());
    }),
  );
};
const frameworkBlocks = (
  configs: readonly Linter.Config[],
): readonly string[] => {
  return configs
    .map(({ name }) => {
      return name ?? "";
    })
    .filter((name) => {
      return /^@cravingmaker\/eslint-config\/(?:express|react|svelte)\//u.test(
        name,
      );
    });
};

afterAll(async () => {
  await rm(temporaryDirectory, { force: true, recursive: true });
});

describe("configuration preparation through the built package", () => {
  it.each([
    ["missing", undefined],
    ["invalid JSON", "{"],
    ["an array", "[]"],
    ["null", "null"],
    [
      "non-object dependency fields",
      '{"dependencies":null,"devDependencies":[],"peerDependencies":"react"}',
    ],
    [
      "only optional dependencies",
      '{"optionalDependencies":{"express":"1.0.0","react":"1.0.0","svelte":"1.0.0"}}',
    ],
  ])(
    "detects no frameworks when the manifest is %s",
    async (_name, manifest) => {
      const projectRootDirectory = await createProject(manifest);
      const configs = await createConfig({ projectRootDirectory });

      // Every optional peer is installed here; only the manifest may turn a framework on.
      expect(frameworkBlocks(configs)).toEqual([]);
    },
  );

  it("detects no frameworks when the manifest cannot be read as a file", async () => {
    const projectRootDirectory = await createProject();
    await mkdir(path.join(projectRootDirectory, "package.json"));

    expect(
      frameworkBlocks(await createConfig({ projectRootDirectory })),
    ).toEqual([]);
  });

  it("reads the manifest again for each call", async () => {
    const projectRootDirectory = await createProject("{}");
    const before = await createConfig({ projectRootDirectory });
    await writeFile(
      path.join(projectRootDirectory, "package.json"),
      '{"devDependencies":{"svelte":"1.0.0"}}',
      "utf8",
    );
    const after = await createConfig({ projectRootDirectory });

    expect(frameworkBlocks(before)).toEqual([]);
    expect(frameworkBlocks(after)).toEqual([
      "@cravingmaker/eslint-config/svelte/rules",
    ]);
  });

  it.each(["javascript/rules", "typescript/parser", "svelte/rules"])(
    "passes merged globals to %s with a relative project root",
    async (blockName) => {
      const projectRootDirectory = await createProject(
        '{"peerDependencies":{"svelte":"1.0.0"}}',
      );
      const configs = await createConfig({
        environments: ["browser"],
        globals: {
          globalThis: "writable",
          myGlobal: "readonly",
          window: "off",
        },
        projectRootDirectory: path.relative(
          process.cwd(),
          projectRootDirectory,
        ),
      });
      const block = configs.find(({ name }) => {
        return name === `@cravingmaker/eslint-config/${blockName}`;
      });

      expect(block?.languageOptions?.globals).toMatchObject({
        document: false,
        globalThis: "writable",
        myGlobal: "readonly",
        parseInt: false,
        window: "off",
      });
    },
  );

  it("keeps the existing failure for an unknown environment", async () => {
    const options: Readonly<Record<string, unknown>> = {
      environments: ["no-such-environment"],
    };

    await expect(createConfig(options)).rejects.toThrow(
      new TypeError("Cannot convert undefined or null to object"),
    );
  });

  it.each([
    ["javascript", { javascript: false }, {}],
    ["react", { react: "vite" }, { react: true }],
    ["typescript", { typescript: "strict" }, { typescript: true }],
    [
      "typescript.typeChecked",
      { typescript: { typeChecked: "yes" } },
      { typescript: true },
    ],
  ] as const)(
    "preserves the existing handling of a malformed %s value",
    async (_name, given, expected) => {
      const projectRootDirectory = await createProject("{}");
      // A JavaScript config can pass values that the public types reject.
      const malformed: Readonly<Record<string, unknown>> = given;
      const actual = await createConfig({ ...malformed, projectRootDirectory });
      const equivalent = await createConfig({
        ...expected,
        projectRootDirectory,
      });

      expect(
        actual.map(({ name }) => {
          return name;
        }),
      ).toEqual(
        equivalent.map(({ name }) => {
          return name;
        }),
      );
      expect(await describeSources(actual)).toEqual(
        await describeSources(equivalent),
      );
    },
  );

  it("preserves the existing handling of a non-object options value", async () => {
    // @ts-expect-error A JavaScript config can pass a value that the public types reject.
    const actual = await createConfig("strict");
    const equivalent = await createConfig();

    expect(await describeSources(actual)).toEqual(
      await describeSources(equivalent),
    );
  });
});
