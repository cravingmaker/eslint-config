import type { Linter } from "eslint";
import type { Feature, Options } from "../../src/types.js";

import process from "node:process";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { describeEffectiveConfig } from "../policy/effective-config.js";
import { createConfig } from "../../src/factory.js";

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
Each feature that can be off, the segment of its block names, the patterns of its files, the
names of files that it lints by default, and one of its rules, which is on in the first of them.
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
    ruleId: "@html-eslint/class-spacing",
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
    ruleId: "markdown/no-bare-urls",
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
    fileNames: ["Component.tsx", "Component.jsx"],
    files: ["app/**/*.tsx", "app/**/*.jsx"],
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
    ruleId: "security/detect-eval-with-expression",
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

function createEslint(configs: readonly Linter.Config[]): ESLint {
  return new ESLint({ overrideConfig: [...configs], overrideConfigFile: true });
}
/*
The configuration that ESLint resolves for `filePath`, as reviewable text without the plugins
line: setup blocks register their plugins for every file, whatever the feature's files are.
*/
async function describeFile(eslint: ESLint, filePath: string): Promise<string> {
  const description = await describeEffectiveConfig(
    eslint,
    filePath,
    rootDirectory,
  );
  return description
    .split("\n")
    .filter((line) => !line.startsWith("plugins: "))
    .join("\n");
}
// The feature segment of each block name, without repeats.
function getFeatureNames(configs: readonly Linter.Config[]): readonly string[] {
  return [
    ...new Set(
      configs.map(
        ({ name = "" }) => name.slice(prefix.length).split("/", 1)[0],
      ),
    ),
  ];
}
// The severity of `ruleId` in the configuration for `filePath`, or `undefined` when it is not set.
async function getSeverity(
  eslint: ESLint,
  filePath: string,
  ruleId: string,
): Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    { readonly rules?: RuleEntries } | undefined;
  const rules = new Map(Object.entries(config?.rules ?? {}));
  return rules.get(ruleId)?.[0];
}
// `options` with `feature` set to `value`.
function withFeature(
  options: Options,
  feature: ToggledFeature,
  value: Feature | "auto" | undefined,
): Options {
  return { ...options, [feature]: value };
}

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
            names: configs.map((config) => config.name),
            severity: await getSeverity(eslint, filePath, ruleId),
          };
        }),
      );
      const [enabled] = results;

      expect(enabled.severity).toBeOneOf([1, 2]);
      expect(results).toEqual(values.map(() => enabled));
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
      const elsewhere = fileNames.flatMap((otherName) => [
        `lib/${otherName}`,
        `app/generated/${otherName}`,
      ]);
      // Outside its files and in its ignores, the feature changes nothing.
      const [narrowedElsewhere, offElsewhere] = await Promise.all(
        [narrowed, off].map(async (configs) => {
          const eslint = createEslint(configs);
          return await Promise.all(
            elsewhere.map(
              async (otherPath) => await describeFile(eslint, otherPath),
            ),
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
          { readonly rules?: RuleEntries } | undefined;
        return Object.keys(config?.rules ?? {}).filter(
          (ruleId) => !ruleId.includes("/"),
        );
      }),
    );

    expect(await getSeverity(eslint, "app/example.js", "eqeqeq")).toBe(0);
    expect(coreRules).toEqual([[], []]);
  });
});

describe("json feature", () => {
  it("applies files to JSON files, and ignores to every JSON language", async () => {
    const eslint = createEslint(
      await createConfig({
        ...baseOptions,
        json: { files: ["app/**/*.json"], ignores: featureIgnores },
      }),
    );
    const expected = {
      "app/data.json": 2,
      "app/generated/data.json": undefined,
      "app/generated/data.json5": undefined,
      "app/generated/data.jsonc": undefined,
      "lib/data.json": undefined,
      "lib/data.json5": 2,
      "lib/data.jsonc": 2,
    };

    const severities = await Promise.all(
      Object.keys(expected).map(
        async (filePath): Promise<readonly [string, unknown]> => [
          filePath,
          await getSeverity(eslint, filePath, "json/no-duplicate-keys"),
        ],
      ),
    );

    expect(Object.fromEntries(severities)).toEqual(expected);
  });
});
