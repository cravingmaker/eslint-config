import type { Linter } from "eslint";
import type { Options } from "../../src/types.js";

import process from "node:process";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../src/factory.js";

type RuleEntries = Readonly<
  Record<string, readonly [Linter.Severity, ...unknown[]]>
>;
type Severities = ReadonlyArray<Linter.Severity | undefined>;

const prefix = "@cravingmaker/eslint-config/exceptions/";
const baseOptions = {
  projectRootDirectory: process.cwd(),
  typescript: { tsconfigRootDir: process.cwd(), typeChecked: true },
} as const satisfies Options;
// The rules that test files turn off. Both need type information, so they are on only with
// typed linting.
const testFileRules = [
  "functional/no-expression-statements",
  "functional/no-return-void",
] as const;
const configFileRules = ["import-x/no-default-export"] as const;
const svelteComponentRules = [
  "functional/no-let",
  "import-x/no-mutable-exports",
  "import-x/unambiguous",
  "unicorn/no-top-level-assignment-in-function",
] as const;

async function createEslint(
  options: Options,
  userConfigs: readonly Linter.Config[] = [],
): Promise<ESLint> {
  return new ESLint({
    overrideConfig: await createConfig(options, ...userConfigs),
    overrideConfigFile: true,
  });
}
// The names of the exception blocks in `configs`.
function getExceptionNames(
  configs: readonly Linter.Config[],
): readonly string[] {
  return configs.flatMap(({ name = "" }) =>
    name.startsWith(prefix) ? [name] : [],
  );
}
// The severity of each of `ruleIds` in the configuration for `filePath`, or `undefined` for a
// rule that the configuration does not set.
async function getSeverities(
  eslint: ESLint,
  filePath: string,
  ruleIds: readonly string[],
): Promise<Severities> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    { readonly rules?: RuleEntries } | undefined;
  const rules = new Map(Object.entries(config?.rules ?? {}));
  return ruleIds.map((ruleId) => rules.get(ruleId)?.[0]);
}
// The severities of `ruleIds` for each of `filePaths`, by path.
async function getSeveritiesByPath(
  eslint: ESLint,
  filePaths: readonly string[],
  ruleIds: readonly string[],
): Promise<Readonly<Record<string, Severities>>> {
  return Object.fromEntries(
    await Promise.all(
      filePaths.map(
        async (filePath): Promise<readonly [string, Severities]> => [
          filePath,
          await getSeverities(eslint, filePath, ruleIds),
        ],
      ),
    ),
  );
}

describe("file-role exceptions", () => {
  it("turn off the side-effect rules in test files", async () => {
    const eslint = await createEslint(baseOptions);
    const expected = {
      "src/example.spec.tsx": [0, 0],
      "src/example.test.ts": [0, 0],
      "src/example.ts": [2, 2],
      "tests/unit/example.test.mts": [0, 0],
      // A helper next to the tests is not a test file.
      "tests/utilities.ts": [2, 2],
    };

    expect(
      await getSeveritiesByPath(eslint, Object.keys(expected), testFileRules),
    ).toEqual(expected);
  });

  it("turn off import-x/no-default-export in config files", async () => {
    const eslint = await createEslint(baseOptions);
    const expected = {
      "eslint.config.js": [0],
      "packages/app/vitest.config.mts": [0],
      // A module named `config` is not a config file.
      "src/config.ts": [2],
      "src/example.js": [2],
      "vite.config.ts": [0],
    };

    expect(
      await getSeveritiesByPath(eslint, Object.keys(expected), configFileRules),
    ).toEqual(expected);
  });

  it("do not make ESLint lint files that no feature lints", async () => {
    const eslint = await createEslint(baseOptions);
    // Their names match a file role, but they are not JavaScript or TypeScript.
    const filePaths = [
      "notes.test.txt",
      "src/__snapshots__/example.test.ts.snap",
      "vite.config.yaml",
    ];
    const ignored = await Promise.all(
      filePaths.map(async (filePath) => await eslint.isPathIgnored(filePath)),
    );

    expect(ignored).toEqual([true, true, true]);
  });

  it("turn off the rules that Svelte components break by design", async () => {
    const eslint = await createEslint({ ...baseOptions, svelte: true });
    const expected = {
      "src/Component.svelte": [0, 0, 0, 0],
      "src/example.ts": [2, 2, 2, 2],
      // The top level of a rune module is shared by every module that imports it.
      "src/state.svelte.ts": [2, 2, 2, 2],
    };

    expect(
      await getSeveritiesByPath(
        eslint,
        Object.keys(expected),
        svelteComponentRules,
      ),
    ).toEqual(expected);
  });

  it("apply only while the feature that holds their rules is on", async () => {
    const [withoutFunctional, withoutImports] = await Promise.all([
      createConfig({ ...baseOptions, functional: false, svelte: false }),
      createConfig({ ...baseOptions, imports: false, svelte: false }),
    ]);

    expect(getExceptionNames(withoutFunctional)).toEqual([
      `${prefix}config-files`,
    ]);
    expect(getExceptionNames(withoutImports)).toEqual([`${prefix}test-files`]);
  });

  it("apply to Svelte components only while the Svelte feature is on", async () => {
    const configs = await Promise.all([
      createConfig({ ...baseOptions, svelte: true }),
      createConfig({ ...baseOptions, functional: false, svelte: true }),
      createConfig({ ...baseOptions, imports: false, svelte: true }),
      createConfig({ ...baseOptions, svelte: true, unicorn: false }),
      createConfig({ ...baseOptions, svelte: false }),
    ]);

    expect(
      configs.map(
        (config) =>
          config.find(({ name }) => name === `${prefix}svelte-components`)
            ?.rules,
      ),
    ).toEqual([
      Object.fromEntries(svelteComponentRules.map((ruleId) => [ruleId, "off"])),
      {
        "import-x/no-mutable-exports": "off",
        "import-x/unambiguous": "off",
        "unicorn/no-top-level-assignment-in-function": "off",
      },
      {
        "functional/no-let": "off",
        "unicorn/no-top-level-assignment-in-function": "off",
      },
      {
        "functional/no-let": "off",
        "import-x/no-mutable-exports": "off",
        "import-x/unambiguous": "off",
      },
      undefined,
    ]);
  });

  it("come before user configs, which can turn a rule back on", async () => {
    const eslint = await createEslint(baseOptions, [
      {
        files: ["**/*.test.ts"],
        name: "user/test-files",
        rules: { "functional/no-return-void": "error" },
      },
    ]);

    expect(
      await getSeverities(eslint, "src/example.test.ts", [
        "functional/no-expression-statements",
        "functional/no-return-void",
      ]),
    ).toEqual([0, 2]);
  });
});
