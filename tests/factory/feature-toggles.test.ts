/* eslint-disable security/detect-non-literal-fs-filename -- The fixtures are written to a temporary directory. */
import type { Linter } from "eslint";
import type { Feature, Options } from "../../src/types.js";

import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { runInNewContext } from "node:vm";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import { describeEffectiveConfig } from "../policy/effective-config.js";
import { createConfig } from "../../src/factory.js";

// What the tests compare between values of a feature: the block names, the resolved configuration
// of a file that the feature lints, and the severity of its rule there.
type Resolved = {
  readonly description: string;
  readonly names: ReadonlyArray<string | undefined>;
  readonly severity: unknown;
};
type RuleEntries = Readonly<Record<string, readonly unknown[]>>;
// A feature that `false` turns off.
type ToggledFeature = Exclude<
  keyof Options,
  "environments" | "globals" | "ignores" | "javascript" | "projectRootDirectory"
>;
const rootDirectory = process.cwd();
const prefix = "@cravingmaker/eslint-config/";
const baseOptions = {
  projectRootDirectory: rootDirectory,
} as const satisfies Options;
const typedOptions = {
  ...baseOptions,
  typescript: { typeChecked: true },
} as const satisfies Options;
const featureIgnores = ["**/generated/**"] as const;
/*
Each feature that can be off, the segment of its block names, the patterns of its files, the names of files that it lints by default, and one of its rules, which is on in the first of them.
Its files are under `app/`, so the same names under `lib/` are outside them, and under
`app/generated/` they are in its ignores. Features with type-aware blocks are checked with typed
linting.
*/
const features = [
  {
    feature: "comments",
    fileNames: ["example.js", "example.ts"],
    files: ["app/**/*.js", "app/**/*.ts"],
    name: "comments",
    ruleId: "@eslint-community/eslint-comments/no-unlimited-disable",
  },
  {
    feature: "express",
    fileNames: ["server.ts", "server.js"],
    files: ["app/**/*.ts", "app/**/*.js"],
    name: "express",
    ruleId: "express-security/require-helmet",
  },
  {
    feature: "functional",
    fileNames: ["example.js", "example.ts"],
    files: ["app/**/*.js", "app/**/*.ts"],
    name: "functional",
    ruleId: "functional/no-let",
    typed: true,
  },
  {
    feature: "html",
    fileNames: ["index.html"],
    files: ["app/**/*.html"],
    name: "html",
    ruleId: "@html-eslint/no-duplicate-id",
  },
  {
    feature: "imports",
    fileNames: ["example.js", "example.ts"],
    files: ["app/**/*.js", "app/**/*.ts"],
    name: "imports",
    ruleId: "import-x/no-duplicates",
  },
  {
    feature: "json",
    fileNames: ["data.json"],
    files: ["app/**/*.json"],
    name: "json",
    ruleId: "json/no-duplicate-keys",
  },
  {
    feature: "markdown",
    fileNames: ["README.md"],
    files: ["app/**/*.md"],
    name: "markdown",
    ruleId: "markdown/require-alt-text",
  },
  {
    feature: "node",
    fileNames: ["example.js", "example.ts"],
    files: ["app/**/*.js", "app/**/*.ts"],
    name: "node",
    ruleId: "n/no-path-concat",
    typed: true,
  },
  {
    feature: "packageJson",
    fileNames: ["package.json"],
    files: ["app/**/package.json"],
    name: "enforce-package-type",
    ruleId: "enforce-package-type/enforce-package-type",
  },
  {
    feature: "packageJson",
    fileNames: ["package.json"],
    files: ["app/**/package.json"],
    name: "package-json",
    ruleId: "package-json/no-empty-fields",
  },
  {
    feature: "perfectionist",
    fileNames: ["example.js", "example.ts"],
    files: ["app/**/*.js", "app/**/*.ts"],
    name: "perfectionist",
    ruleId: "perfectionist/sort-objects",
  },
  {
    feature: "promise",
    fileNames: ["example.js", "example.ts"],
    files: ["app/**/*.js", "app/**/*.ts"],
    name: "promise",
    ruleId: "promise/param-names",
  },
  {
    feature: "react",
    // Custom hooks also live in modules without JSX.
    fileNames: [
      "use-counter.ts",
      "Component.tsx",
      "Component.jsx",
      "use-counter.js",
    ],
    files: ["app/**/*.ts", "app/**/*.tsx", "app/**/*.jsx", "app/**/*.js"],
    name: "react",
    ruleId: "react-hooks/rules-of-hooks",
  },
  {
    feature: "regexp",
    fileNames: ["example.js", "example.ts"],
    files: ["app/**/*.js", "app/**/*.ts"],
    name: "regexp",
    ruleId: "regexp/no-empty-group",
  },
  {
    feature: "security",
    fileNames: ["example.js", "example.ts"],
    files: ["app/**/*.js", "app/**/*.ts"],
    name: "security",
    ruleId: "security/detect-unsafe-regex",
  },
  {
    feature: "sonarjs",
    fileNames: ["example.js", "example.ts"],
    files: ["app/**/*.js", "app/**/*.ts"],
    name: "sonarjs",
    ruleId: "sonarjs/no-all-duplicated-branches",
    typed: true,
  },
  {
    feature: "stylistic",
    fileNames: ["example.js", "example.ts"],
    files: ["app/**/*.js", "app/**/*.ts"],
    name: "stylistic",
    ruleId: "@stylistic/spaced-comment",
  },
  {
    feature: "svelte",
    fileNames: ["Component.svelte", "state.svelte.ts"],
    files: ["app/**/*.svelte", "app/**/*.svelte.ts"],
    name: "svelte",
    ruleId: "@html-eslint/svelte/no-duplicate-class",
  },
  {
    feature: "typescript",
    fileNames: ["example.ts", "example.tsx"],
    files: ["app/**/*.ts", "app/**/*.tsx"],
    name: "typescript",
    ruleId: "@typescript-eslint/no-explicit-any",
  },
  {
    feature: "unicorn",
    fileNames: ["example.js", "example.ts"],
    files: ["app/**/*.js", "app/**/*.ts"],
    name: "unicorn",
    ruleId: "unicorn/no-null",
  },
  {
    feature: "unusedImports",
    fileNames: ["example.js", "example.ts"],
    files: ["app/**/*.js", "app/**/*.ts"],
    name: "unused-imports",
    ruleId: "unused-imports/no-unused-imports",
  },
] as const satisfies ReadonlyArray<{
  readonly feature: ToggledFeature;
  readonly fileNames: readonly string[];
  readonly files: readonly string[];
  readonly name: string;
  readonly ruleId: string;

  readonly typed?: boolean;
}>;
// The features whose default is `"auto"`.
const autoFeatures = new Set<ToggledFeature>(["express", "react", "svelte"]);
// Every feature, `javascript` among them, which is always on.
const scopedFeatures = [
  { feature: "javascript", fileNames: ["example.js"], ruleId: "eqeqeq" },
  ...features,
] as const;
/*
The files of a project under `app/`: one of each type that a feature lints, and a CommonJS file,
which no feature lints. A directory pattern such as `app/**` matches them all.
*/
const appFiles = {
  "app/Component.svelte":
    '<script lang="ts">\n  let count: number = $state(0);\n</script>\n\n<button onclick={() => { const previousCount = count; count = count + 1; return previousCount; }}>{count}</button>\n',
  "app/Component.tsx":
    "export function Component() {\n  return <p>example</p>;\n}\n",
  "app/data.json": '{ "name": "example" }\n',
  "app/data.json5": "{ name: 'example' }\n",
  "app/example.cjs": "module.exports = {};\n",
  "app/example.js": "export const example = 1;\n",
  "app/example.ts": "export const example: number = 1;\n",
  "app/index.html":
    '<!doctype html>\n<html lang="en">\n  <head>\n    <title>Example</title>\n  </head>\n  <body></body>\n</html>\n',
  "app/package.json": JSON.stringify({
    name: "app",
    private: true,
    type: "module",
  }),
  "app/README.md": "# Example\n\nSome text.\n",
  "app/settings.jsonc": '{\n  // A comment\n  "name": "example"\n}\n',
  "app/state.svelte.ts": "export const state = $state({ count: 0 });\n",
} as const;
const appPaths = Object.keys(appFiles);
it.each([0, 41, Number.MAX_SAFE_INTEGER + 1, NaN])(
  "preserves the migrated Svelte postfix result and counter state from %s",
  (initial) => {
    const handler = /onclick=\{(?<handler>\(\) => \{[^}]+\})\}/u.exec(
      appFiles["app/Component.svelte"],
    )?.groups?.handler;
    expect(handler).toBeDefined();
    const state = { count: initial };
    const returned: unknown = runInNewContext(
      `(${handler ?? expect.fail("Missing fixture click handler")})()`,
      state,
    );
    expect(returned).toBe(initial);
    expect(state.count).toBe(initial + 1);
  },
);
const createdDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-feature-toggles-"),
);
// ESLint names the files that it lints by their real paths, and the temporary directory can be a
// symbolic link, as it is on macOS.
const temporaryDirectory = await realpath(createdDirectory);
const createEslint = (configs: readonly Linter.Config[]): ESLint => {
  return new ESLint({ overrideConfig: [...configs], overrideConfigFile: true });
};

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

/*
Project roots for the `"auto"` default: one whose manifest declares every framework, and one whose
manifest declares none. Every optional peer is installed in this repository, so the second shows
that installed plugins turn nothing on.
*/
const declaredRoot = await createProject("declared", [
  "express",
  "react",
  "svelte",
]);
const undeclaredRoot = await createProject("undeclared", []);
/*
The project of `appFiles`. Its manifest declares every framework, and Vite, so every feature is on
by default there, React Refresh included. Its tsconfig includes `app/`, for the features that are
checked with typed linting.
*/
const scopedRoot = await createProject("scoped", [
  "express",
  "react",
  "svelte",
  "vite",
]);
await Promise.all(
  Object.entries({
    ...appFiles,
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        jsx: "preserve",
        module: "nodenext",
        noEmit: true,
        strict: true,
        target: "es2024",
      },
      include: ["app"],
    }),
  }).map(async ([fileName, content]) => {
    const filePath = path.join(scopedRoot, fileName);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }),
);
// ESLint for the scoped project with `options`, which runs there and reads its manifest.
const createScopedEslint = async (options: Options): Promise<ESLint> => {
  return new ESLint({
    cwd: scopedRoot,
    overrideConfig: await createConfig({
      ...options,
      projectRootDirectory: scopedRoot,
    }),
    overrideConfigFile: true,
  });
};

/*
The configuration that ESLint resolves for `filePath`, as reviewable text without the plugins
line: setup blocks register their plugins for every file, whatever the feature's files are.
*/
const describeFile = async (
  eslint: ESLint,
  filePath: string,
): Promise<string> => {
  const description = await describeEffectiveConfig(
    eslint,
    filePath,
    rootDirectory,
  );
  return description
    .split("\n")
    .filter((line) => {
      return !line.startsWith("plugins: ");
    })
    .join("\n");
};

// The description of each application file, in the order of `appPaths`.
const describeAppFiles = async (eslint: ESLint): Promise<readonly string[]> => {
  return await Promise.all(
    appPaths.map(async (filePath) => {
      return await describeFile(eslint, filePath);
    }),
  );
};

// The feature segment of each block name, without repeats.
const getFeatureNames = (
  configs: readonly Linter.Config[],
): readonly string[] => {
  return [
    ...new Set(
      configs.map(({ name = "" }) => {
        return name.slice(prefix.length).split("/", 1)[0];
      }),
    ),
  ];
};

// The severity of `ruleId` in the configuration for `filePath`, or `undefined` when it is not set.
const getSeverity = async (
  eslint: ESLint,
  filePath: string,
  ruleId: string,
): Promise<unknown> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    | {
        readonly rules?: RuleEntries;
      }
    | undefined;
  const rules = new Map(Object.entries(config?.rules ?? {}));
  return rules.get(ruleId)?.[0];
};

// `options` with `feature` set to `value`.
const withFeature = (
  options: Options,
  feature: ToggledFeature | "javascript",
  value: Feature | "auto" | undefined,
): Options => {
  return { ...options, [feature]: value };
};

// How ESLint resolves each file of `app/` with the defaults, without and with typed linting.
const defaultDescriptions = {
  typed: await describeAppFiles(await createScopedEslint(typedOptions)),
  untyped: await describeAppFiles(await createScopedEslint(baseOptions)),
};
describe.each(features)(
  "$feature feature",
  ({ feature, fileNames, files, name, ruleId, ...settings }) => {
    const options = "typed" in settings ? typedOptions : baseOptions;
    const [fileName] = fileNames;
    const filePath = `src/${fileName}`;
    it("is off with false: none of its blocks and rules remain", async () => {
      const configs = await createConfig(withFeature(options, feature, false));
      expect(getFeatureNames(configs)).not.toContain(name);
      expect(
        await getSeverity(createEslint(configs), filePath, ruleId),
      ).toBeUndefined();
    });
    // The default of a framework feature is `"auto"`, which follows detection instead.
    const isAuto = autoFeatures.has(feature);
    it(`is on with true, as with an empty object${isAuto ? "" : " and by default"}`, async () => {
      const values = isAuto ? [true, {}] : [true, {}, undefined];
      const results = await Promise.all(
        values.map(async (value) => {
          const configs = await createConfig(
            withFeature(options, feature, value),
          );
          const eslint = createEslint(configs);
          return {
            description: await describeFile(eslint, filePath),
            names: configs.map((config) => {
              return config.name;
            }),
            severity: await getSeverity(eslint, filePath, ruleId),
          };
        }),
      );
      const [enabled] = results;
      expect(enabled.severity).toBeOneOf([1, 2]);
      expect(results).toEqual(
        values.map(() => {
          return enabled;
        }),
      );
    });
    it("applies an object to its files without its ignores, with its overrides", async () => {
      const [narrowed, off] = await Promise.all([
        createConfig(
          withFeature(options, feature, {
            files,
            ignores: featureIgnores,
            overrides: { [ruleId]: "off" },
          }),
        ),
        createConfig(withFeature(options, feature, false)),
      ]);
      const elsewhere = fileNames.flatMap((otherName) => {
        return [`lib/${otherName}`, `app/generated/${otherName}`];
      });
      // Outside its files and in its ignores, the feature changes nothing.
      const [narrowedElsewhere, offElsewhere] = await Promise.all(
        [narrowed, off].map(async (configs) => {
          const eslint = createEslint(configs);
          return await Promise.all(
            elsewhere.map(async (otherPath) => {
              return await describeFile(eslint, otherPath);
            }),
          );
        }),
      );
      expect(
        await getSeverity(createEslint(narrowed), `app/${fileName}`, ruleId),
      ).toBe(0);
      expect(narrowedElsewhere).toEqual(offElsewhere);
    });
  },
);
afterAll(async () => {
  await rm(temporaryDirectory, { force: true, recursive: true });
});
/*
`files` limits a feature to the files among its default files that match one of its patterns. A
directory is such a pattern, and it also matches the files there that the feature does not lint:
those of other languages, which its rules cannot read, and CommonJS files.
*/
describe.each(scopedFeatures)(
  "$feature feature with a directory as its files",
  ({ feature, fileNames, ruleId, ...settings }) => {
    const isTyped = "typed" in settings;
    const [fileName] = fileNames;
    // One instance for the three tests: ESLint keeps what it resolves for a file.
    const scoped = createScopedEslint(
      withFeature(isTyped ? typedOptions : baseOptions, feature, {
        files: ["app/**"],
      }),
    );
    // So a JSON or Markdown file there gets none of its rules, a Svelte component keeps those
    // that it has by default, and each file is still linted by the feature for its own type.
    it("lints the files there as with its default files, whatever their type", async () => {
      expect(await describeAppFiles(await scoped)).toEqual(
        isTyped ? defaultDescriptions.typed : defaultDescriptions.untyped,
      );
    });
    it("has its rules on there, and not outside", async () => {
      const eslint = await scoped;
      expect(await getSeverity(eslint, `app/${fileName}`, ruleId)).toBeOneOf([
        1, 2,
      ]);
      expect(
        await getSeverity(eslint, `lib/${fileName}`, ruleId),
      ).toBeUndefined();
    });
    // A rule that cannot read a file's language stops ESLint for every file, and a resolved
    // configuration does not show that, so the files are linted.
    it("lints every file there without an error", async () => {
      const eslint = await scoped;
      const results = await eslint.lintFiles(["app"]);
      expect(
        new Set(
          results.map(({ filePath }) => {
            return path
              .relative(scopedRoot, filePath)
              .replaceAll(path.sep, "/");
          }),
        ),
      ).toEqual(new Set(appPaths));
      expect(
        results.flatMap(({ filePath, messages }) => {
          return messages
            .filter(({ fatal }) => {
              return fatal === true;
            })
            .map(({ message }) => {
              return `${path.relative(scopedRoot, filePath)}: ${message}`;
            });
        }),
      ).toEqual([]);
    });
  },
);
describe.each(
  features.filter(({ feature }) => {
    return autoFeatures.has(feature);
  }),
)("$feature feature with auto", ({ feature, fileNames, ruleId }) => {
  const [fileName] = fileNames;
  const filePath = `src/${fileName}`;
  // What `values` of the feature resolve to in `projectRootDirectory`.
  const resolveValues = async (
    projectRootDirectory: string,
    values: ReadonlyArray<Feature | "auto" | undefined>,
  ): Promise<readonly Resolved[]> => {
    return await Promise.all(
      values.map(async (value) => {
        const configs = await createConfig(
          withFeature({ ...baseOptions, projectRootDirectory }, feature, value),
        );
        const eslint = createEslint(configs);
        return {
          description: await describeFile(eslint, filePath),
          names: configs.map((config) => {
            return config.name;
          }),
          severity: await getSeverity(eslint, filePath, ruleId),
        };
      }),
    );
  };

  it("is on by default and with auto when the project declares it, as with true", async () => {
    const [enabled, ...detected] = await resolveValues(declaredRoot, [
      true,
      "auto",
      undefined,
    ]);
    expect(enabled.severity).toBeOneOf([1, 2]);
    expect(detected).toEqual([enabled, enabled]);
  });
  it("is off by default and with auto when the project does not declare it, as with false", async () => {
    const [disabled, ...detected] = await resolveValues(undeclaredRoot, [
      false,
      "auto",
      undefined,
    ]);
    expect(disabled.severity).toBeUndefined();
    expect(detected).toEqual([disabled, disabled]);
  });
});
describe("javascript feature", () => {
  it("applies its options to its files without its ignores", async () => {
    const eslint = createEslint(
      await createConfig({
        ...baseOptions,
        javascript: {
          files: ["app/**/*.js"],
          ignores: featureIgnores,
          overrides: { eqeqeq: "off" },
        },
      }),
    );
    const coreRules = await Promise.all(
      ["lib/example.js", "app/generated/example.js"].map(async (filePath) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
        const config = (await eslint.calculateConfigForFile(filePath)) as
          | {
              readonly rules?: RuleEntries;
            }
          | undefined;
        return Object.keys(config?.rules ?? {}).filter((ruleId) => {
          return !ruleId.includes("/");
        });
      }),
    );
    expect(await getSeverity(eslint, "app/example.js", "eqeqeq")).toBe(0);
    expect(coreRules).toEqual([[], []]);
  });
});
describe("json feature", () => {
  it("applies files and ignores to every JSON language", async () => {
    const eslint = createEslint(
      await createConfig({
        ...baseOptions,
        json: { files: ["app/**"], ignores: featureIgnores },
      }),
    );
    const expected = {
      "app/data.json": 2,
      "app/data.json5": 2,
      "app/data.jsonc": 2,
      "app/generated/data.json": undefined,
      "app/generated/data.json5": undefined,
      "app/generated/data.jsonc": undefined,
      "lib/data.json": undefined,
      "lib/data.json5": undefined,
      "lib/data.jsonc": undefined,
    };
    const severities = await Promise.all(
      Object.keys(expected).map(
        async (filePath): Promise<readonly [string, unknown]> => {
          return [
            filePath,
            await getSeverity(eslint, filePath, "json/no-duplicate-keys"),
          ];
        },
      ),
    );
    expect(Object.fromEntries(severities)).toEqual(expected);
  });
});
describe("the files of a feature", () => {
  it("cannot add a file type: a pattern outside its default files matches nothing", async () => {
    const eslint = createEslint(
      await createConfig({
        ...baseOptions,
        javascript: { files: ["**/*.{js,cjs}"] },
        json: { files: ["**/*.json", "**/.babelrc"] },
        markdown: { files: ["**/*.md", "**/*.markdown"] },
      }),
    );
    // Each feature with a file of its default files, a file that only its `files` name, and one
    // of its rules.
    const cases = [
      ["data.json", ".babelrc", "json/no-duplicate-keys"],
      ["README.md", "notes.markdown", "markdown/require-alt-text"],
      ["src/example.js", "src/example.cjs", "eqeqeq"],
    ] as const;
    const severities = await Promise.all(
      cases.map(async ([defaultFile, addedFile, ruleId]) => {
        return await Promise.all([
          getSeverity(eslint, defaultFile, ruleId),
          getSeverity(eslint, addedFile, ruleId),
        ]);
      }),
    );
    expect(severities).toEqual(
      cases.map(() => {
        return [2, undefined];
      }),
    );
  });
});
