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
const createProject = async (
  name: string,
  dependencies: readonly string[],
): Promise<string> => {
  const directory = path.join(temporaryDirectory, name);
  const devDependencies = Object.fromEntries(
    dependencies.map((dependency) => {
      return [dependency, "1.0.0"];
    }),
  );
  await mkdir(directory);
  await writeFile(
    path.join(directory, "package.json"),
    JSON.stringify({ devDependencies }),
    "utf8",
  );
  return directory;
};
// The block with `name` after the package prefix.
const findBlock = (
  configs: readonly Linter.Config[],
  name: string,
): Linter.Config | undefined => {
  return configs.find((config) => {
    return config.name === `${prefix}${name}`;
  });
};
// The feature segment of each block name, without repeats.
const getFeatureOrder = async (
  options: Parameters<typeof createConfig>[0] = {},
): Promise<readonly string[]> => {
  const configs = await createConfig(options);
  const features = configs.map((config) => {
    return (config.name ?? "").slice(prefix.length).split("/", 1)[0];
  });
  return features.filter((feature, index) => {
    return features.indexOf(feature) === index;
  });
};
// The framework features among the blocks, in order.
const getFrameworks = async (
  options: Parameters<typeof createConfig>[0] = {},
): Promise<readonly string[]> => {
  const order = await getFeatureOrder(options);
  return order.filter((feature) => {
    return frameworks.has(feature);
  });
};

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
      "stylistic",
      "typescript",
      "react",
      "svelte",
      "express",
      "html",
      "json",
      "package-json",
      "enforce-package-type",
      "markdown",
      "exceptions",
    ]);
  });

  it("names every block once, under the package prefix", async () => {
    const configs = await createConfig(baseOptions);
    const names = configs.map((config) => {
      return config.name;
    });
    const uniqueNames = new Set(names);

    expect(
      names.every((name) => {
        return name?.startsWith(prefix) === true;
      }),
    ).toBe(true);
    expect(uniqueNames.size).toBe(names.length);
  });

  // Users look a block up by its name, as an example in the README does. The project declares no
  // framework, so its defaults leave out the blocks that a framework, typed linting, an owner with
  // files of its own, or a replaced rule in `overridesTypeAware` adds.
  it("names the blocks in a fixed order", async () => {
    const projectRootDirectory = await createProject("block-names", []);
    const [defaults, every] = await Promise.all([
      createConfig({ ...baseOptions, projectRootDirectory }),
      createConfig({
        ...baseOptions,
        express: true,
        projectRootDirectory,
        react: { refresh: "vite" },
        regexp: { files: ["src/**"] },
        svelte: true,
        typescript: {
          ...baseOptions.typescript,
          overridesTypeAware: { "@typescript-eslint/no-unused-vars": "error" },
          typeChecked: true,
        },
      }),
    ]);
    const everyName = [
      "ignores",
      "javascript/rules",
      "javascript/jsx",
      "comments/setup",
      "comments/rules",
      "node/setup",
      "node/rules",
      "node/rules-typescript",
      "node/rules-type-aware",
      "security/setup",
      "security/rules",
      "imports/setup",
      "imports/rules",
      "imports/resolver",
      "unused-imports/setup",
      "unused-imports/rules",
      "promise/setup",
      "promise/rules",
      "regexp/setup",
      "regexp/rules",
      "unicorn/setup",
      "unicorn/rules",
      "functional/setup",
      "functional/rules",
      "functional/rules-type-aware",
      "perfectionist/setup",
      "perfectionist/rules",
      "stylistic/setup",
      "stylistic/rules",
      "typescript/parser",
      "typescript/parser-type-aware",
      "typescript/rules",
      "typescript/rules-type-aware",
      "react/html",
      "react/hooks",
      "react/refresh",
      "svelte/rules",
      "express/rules",
      "html/rules",
      "json/rules",
      "json/rules-jsonc",
      "json/rules-json5",
      "package-json/setup",
      "package-json/rules",
      "enforce-package-type/rules",
      "markdown/setup",
      "markdown/rules",
      "exceptions/config-files",
      "exceptions/svelte-components",
      "exceptions/test-files",
    ];
    const optionalNames: ReadonlySet<string> = new Set([
      "exceptions/svelte-components",
      "express/rules",
      "functional/rules-type-aware",
      "node/rules-type-aware",
      "react/hooks",
      "react/html",
      "react/refresh",
      "svelte/rules",
      "typescript/parser-type-aware",
      "typescript/rules-type-aware",
    ]);

    expect(
      every.map((config) => {
        return config.name;
      }),
    ).toEqual(
      everyName.map((name) => {
        return `${prefix}${name}`;
      }),
    );
    expect(
      defaults.map((config) => {
        return config.name;
      }),
    ).toEqual(
      everyName
        .filter((name) => {
          return !optionalNames.has(name);
        })
        .map((name) => {
          return `${prefix}${name}`;
        }),
    );
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
      expect(
        detected.map((config) => {
          return config.name;
        }),
      ).toEqual(
        explicit.map((config) => {
          return config.name;
        }),
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
        configs.map((config) => {
          return config.name;
        }),
        ...(await Promise.all(
          filePaths.map(async (filePath) => {
            return await describeEffectiveConfig(
              eslint,
              filePath,
              process.cwd(),
            );
          }),
        )),
      ];
    };
    const [first, second, fromReversed] = await Promise.all(
      [options, options, reversed].map(async (value) => {
        return await describeOutput(await createConfig(value));
      }),
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

  // A feature's `files` cannot add a file type, so the README names this way to lint one.
  it("lints another file type with a user config that copies a block and gives it files", async () => {
    const configs = await createConfig(baseOptions);
    const eslint = new ESLint({
      overrideConfig: [
        ...configs,
        { ...findBlock(configs, "markdown/rules"), files: ["**/*.markdown"] },
        { ...findBlock(configs, "json/rules-jsonc"), files: ["**/.babelrc"] },
      ],
      overrideConfigFile: true,
    });
    // A bare URL, and a comment before a key that is there twice.
    const [[notes], [babelrc]] = await Promise.all([
      eslint.lintText("# Notes\n\nSee https://example.com for more.\n", {
        filePath: "docs/notes.markdown",
      }),
      eslint.lintText(
        '{\n  // Presets\n  "presets": [],\n  "presets": []\n}\n',
        { filePath: ".babelrc" },
      ),
    ]);

    expect(
      [notes, babelrc].map((result) => {
        return result.messages.map(({ message, ruleId }) => {
          return ruleId ?? message;
        });
      }),
    ).toEqual([["markdown/no-bare-urls"], ["json/no-duplicate-keys"]]);
  });

  // Typescript-eslint takes an absolute `tsconfigRootDir` only, and reports any other as a parsing
  // error in every file of the type-aware scope. The tests run in this repository, so `.` is its
  // root, and the fixture is a TypeScript file that a tsconfig includes.
  it.each([
    [
      "projectRootDirectory",
      { projectRootDirectory: ".", typescript: { typeChecked: true } },
    ],
    [
      "typescript.tsconfigRootDir",
      { typescript: { tsconfigRootDir: ".", typeChecked: true } },
    ],
  ] as const)(
    "reads type information when %s is a relative path",
    async (_option, options) => {
      const filePath = "tests/fixtures/temperature.ts";
      const eslint = new ESLint({
        overrideConfig: await createConfig(options),
        overrideConfigFile: true,
      });
      const [result] = await eslint.lintFiles([filePath]);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
      const config = (await eslint.calculateConfigForFile(filePath)) as
        | { readonly languageOptions?: { readonly parserOptions?: unknown } }
        | undefined;

      // A message without a rule is a parsing error, or says that ESLint did not lint the file.
      expect(
        result.messages
          .filter(({ ruleId }) => {
            return typeof ruleId !== "string";
          })
          .map(({ message }) => {
            return message;
          }),
      ).toEqual([]);
      expect(config?.languageOptions?.parserOptions).toEqual({
        projectService: true,
        tsconfigRootDir: process.cwd(),
      });
    },
  );
});
