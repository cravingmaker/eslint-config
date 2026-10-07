/* eslint-disable security/detect-non-literal-fs-filename -- The fixtures are written to a temporary directory. */

import type { Linter } from "eslint";

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import { describeEffectiveConfig } from "../policy/effective-config.js";
import { createConfig } from "../../src/factory.js";

const prefix = "@cravingmaker/eslint-config/";
const baseOptions = {
  projectRootDirectory: process.cwd(),
  typescript: { tsconfigRootDir: process.cwd() },
} as const;
const frameworks: ReadonlySet<string> = new Set(["express", "react", "svelte"]);

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-factory-"),
);

// A project root whose manifest declares `dependencies`.
async function createProject(
  name: string,
  dependencies: readonly string[],
): Promise<string> {
  const directory = path.join(temporaryDirectory, name);
  const devDependencies = Object.fromEntries(
    dependencies.map((dependency) => [dependency, "1.0.0"]),
  );
  await mkdir(directory);
  await writeFile(
    path.join(directory, "package.json"),
    JSON.stringify({ devDependencies }),
    "utf8",
  );
  return directory;
}
// The block with `name` after the package prefix.
function findBlock(
  configs: readonly Linter.Config[],
  name: string,
): Linter.Config | undefined {
  return configs.find((config) => config.name === `${prefix}${name}`);
}
// The feature segment of each block name, without repeats.
async function getFeatureOrder(
  options: Parameters<typeof createConfig>[0] = {},
): Promise<readonly string[]> {
  const configs = await createConfig(options);
  const features = configs.map(
    (config) => (config.name ?? "").slice(prefix.length).split("/", 1)[0],
  );
  return features.filter(
    (feature, index) => features.indexOf(feature) === index,
  );
}
// The framework features among the blocks, in order.
async function getFrameworks(
  options: Parameters<typeof createConfig>[0] = {},
): Promise<readonly string[]> {
  const order = await getFeatureOrder(options);
  return order.filter((feature) => frameworks.has(feature));
}

describe("createConfig", () => {
  afterAll(async () => {
    await rm(temporaryDirectory, { force: true, recursive: true });
  });

  it("composes the features in a fixed order", async () => {
    expect(
      await getFeatureOrder({
        ...baseOptions,
        express: true,
        react: true,
        svelte: true,
      }),
    ).toEqual([
      "ignores",
      "javascript",
      "comments",
      "node",
      "security",
      "imports",
      "unused-imports",
      "promise",
      "regexp",
      "unicorn",
      "functional",
      "perfectionist",
      "typescript",
      "react",
      "svelte",
      "express",
      "html",
      "json",
      "package-json",
      "markdown",
      "overlaps",
      "exceptions",
    ]);
  });

  it("names every block once, under the package prefix", async () => {
    const configs = await createConfig(baseOptions);
    const names = configs.map((config) => config.name);
    const uniqueNames = new Set(names);

    expect(names.every((name) => name?.startsWith(prefix) === true)).toBe(true);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("leaves out a feature that is off and keeps the others", async () => {
    const order = await getFeatureOrder({
      ...baseOptions,
      markdown: false,
      typescript: false,
      unicorn: false,
    });

    expect(order).not.toContain("markdown");
    expect(order).not.toContain("typescript");
    expect(order).not.toContain("unicorn");
    expect(order).toContain("functional");
  });

  it("turns frameworks on when the project declares them, unless they are off", async () => {
    const [declared, undeclared] = await Promise.all([
      createProject("declared", ["express", "react", "svelte"]),
      // Every optional peer is installed in this repository.
      createProject("undeclared", []),
    ]);

    expect(
      await getFrameworks({ ...baseOptions, projectRootDirectory: declared }),
    ).toEqual(["react", "svelte", "express"]);
    expect(
      await getFrameworks({
        ...baseOptions,
        express: false,
        projectRootDirectory: declared,
        react: false,
        svelte: false,
      }),
    ).toEqual([]);
    expect(
      await getFrameworks({ ...baseOptions, projectRootDirectory: undeclared }),
    ).toEqual([]);
  });

  it.each([
    [false, "react"],
    ["next", "next,react,vite"],
    ["vite", "react,vite"],
  ] as const)(
    "detects React Refresh as %s in a project that declares %s",
    async (refresh, dependencies) => {
      const projectRootDirectory = await createProject(
        `refresh-${dependencies}`,
        dependencies.split(","),
      );
      const [detected, explicit] = await Promise.all([
        createConfig({ ...baseOptions, projectRootDirectory }),
        createConfig({
          ...baseOptions,
          projectRootDirectory,
          react: { refresh },
        }),
      ]);

      expect(findBlock(detected, "react/hooks")).toBeDefined();
      expect(detected.map((config) => config.name)).toEqual(
        explicit.map((config) => config.name),
      );
      expect(findBlock(detected, "react/refresh")?.rules).toEqual(
        findBlock(explicit, "react/refresh")?.rules,
      );
    },
  );

  it("lets an explicit value beat detection either way", async () => {
    const [declared, undeclared] = await Promise.all([
      createProject("explicit-declared", ["express", "react", "svelte"]),
      createProject("explicit-undeclared", []),
    ]);

    expect(
      await getFrameworks({
        ...baseOptions,
        express: true,
        projectRootDirectory: undeclared,
        react: {},
        svelte: true,
      }),
    ).toEqual(["react", "svelte", "express"]);
    expect(
      await getFrameworks({
        ...baseOptions,
        express: false,
        projectRootDirectory: declared,
        react: false,
        svelte: false,
      }),
    ).toEqual([]);
  });

  it("returns the same configuration from every call, whatever the order of the options", async () => {
    const options = {
      ...baseOptions,
      express: true,
      react: { refresh: "vite" },
      svelte: true,
      typescript: { ...baseOptions.typescript, typeChecked: true },
    } as const;
    const reversed = Object.fromEntries(Object.entries(options).toReversed());
    const filePaths = [
      "README.md",
      "data.json",
      "index.html",
      "package.json",
      "src/Component.svelte",
      "src/example.js",
      "src/example.ts",
      "src/example.tsx",
    ];
    // The block names, and the configuration that ESLint resolves for each of `filePaths`.
    const describeOutput = async (
      configs: readonly Linter.Config[],
    ): Promise<readonly unknown[]> => {
      const eslint = new ESLint({
        overrideConfig: [...configs],
        overrideConfigFile: true,
      });
      return [
        configs.map((config) => config.name),
        ...(await Promise.all(
          filePaths.map(
            async (filePath) =>
              await describeEffectiveConfig(eslint, filePath, process.cwd()),
          ),
        )),
      ];
    };
    const [first, second, fromReversed] = await Promise.all(
      [options, options, reversed].map(
        async (value) => await describeOutput(await createConfig(value)),
      ),
    );

    expect(second).toEqual(first);
    expect(fromReversed).toEqual(first);
  });

  it("passes feature options to the feature and appends user configs last", async () => {
    const userConfig: Linter.Config = {
      files: ["**/*.js"],
      name: "user/rules",
      rules: { "no-console": "error" },
    };
    const configs = await createConfig(
      { ...baseOptions, unicorn: { overrides: { "unicorn/no-null": "off" } } },
      userConfig,
    );
    const eslint = new ESLint({
      overrideConfig: configs,
      overrideConfigFile: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
    const config = (await eslint.calculateConfigForFile("src/example.js")) as
      | { readonly rules?: Readonly<Record<string, readonly unknown[]>> }
      | undefined;

    expect(configs.at(-1)).toBe(userConfig);
    expect(config?.rules?.["unicorn/no-null"]?.[0]).toBe(0);
    expect(config?.rules?.["no-console"]?.[0]).toBe(2);
  });
});
