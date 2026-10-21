import type { Context } from "../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { comments } from "../../src/configs/plugins/comments/index.js";
import { functional } from "../../src/configs/plugins/functional/index.js";
import { imports } from "../../src/configs/plugins/import-x/index.js";
import { node } from "../../src/configs/plugins/node/index.js";
import { perfectionist } from "../../src/configs/plugins/perfectionist/index.js";
import { promise } from "../../src/configs/plugins/promise/index.js";
import { regexp } from "../../src/configs/plugins/regexp/index.js";
import { security } from "../../src/configs/plugins/security/index.js";
import { sonarjs } from "../../src/configs/plugins/sonarjs/index.js";
import { stylistic } from "../../src/configs/plugins/stylistic/index.js";
import { unicorn } from "../../src/configs/plugins/unicorn/index.js";
import { unusedImports } from "../../src/configs/plugins/unused-imports/index.js";
import { defaultContext } from "../../src/context.js";

type RuleEntries = Readonly<Record<string, readonly unknown[]>>;

const svelteContext: Context = {
  ...defaultContext,
  svelteComponents: [["**/*.svelte", "!**/generated/**"]],
};

// Each builder, its block name segment, the plugin it registers, and one of its rules.
const features = [
  {
    build: comments,
    name: "comments",
    plugin: "@eslint-community/eslint-comments",
    rule: "@eslint-community/eslint-comments/no-unlimited-disable",
  },
  {
    build: functional,
    name: "functional",
    plugin: "functional",
    rule: "functional/no-let",
  },
  {
    build: imports,
    name: "imports",
    plugin: "import-x",
    rule: "import-x/no-duplicates",
  },
  { build: node, name: "node", plugin: "n", rule: "n/no-path-concat" },
  {
    build: perfectionist,
    name: "perfectionist",
    plugin: "perfectionist",
    rule: "perfectionist/sort-objects",
  },
  {
    build: promise,
    name: "promise",
    plugin: "promise",
    rule: "promise/param-names",
  },
  {
    build: regexp,
    name: "regexp",
    plugin: "regexp",
    rule: "regexp/no-empty-group",
  },
  {
    build: security,
    name: "security",
    plugin: "security",
    rule: "security/detect-eval-with-expression",
  },
  {
    build: sonarjs,
    name: "sonarjs",
    plugin: "sonarjs",
    rule: "sonarjs/no-all-duplicated-branches",
  },
  {
    build: stylistic,
    name: "stylistic",
    plugin: "@stylistic",
    rule: "@stylistic/spaced-comment",
  },
  {
    build: unicorn,
    name: "unicorn",
    plugin: "unicorn",
    rule: "unicorn/no-null",
  },
  {
    build: unusedImports,
    name: "unused-imports",
    plugin: "unused-imports",
    rule: "unused-imports/no-unused-imports",
  },
] as const;

const getRules = async (
  eslint: ESLint,
  filePath: string,
): Promise<RuleEntries | undefined> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    { readonly rules?: RuleEntries } | undefined;
  return config?.rules;
};

// The severity of a rule in the configuration for a file, or `undefined` when it is not set.
const getSeverity = async (
  eslint: ESLint,
  filePath: string,
  ruleId: string,
): Promise<unknown> => {
  const rules = new Map(
    Object.entries((await getRules(eslint, filePath)) ?? {}),
  );
  return rules.get(ruleId)?.[0];
};

describe.each(features)("$name feature", ({ build, name, plugin, rule }) => {
  it("registers its plugin in a setup block without files", () => {
    const [setup, rules] = build();

    expect(setup).toMatchObject({
      name: `@cravingmaker/eslint-config/${name}/setup`,
    });
    expect(setup).not.toHaveProperty("files");
    expect(Object.keys(setup.plugins ?? {})).toEqual(
      ["@stylistic", "unicorn"].includes(plugin)
        ? ["@cravingmaker", plugin]
        : [plugin],
    );
    expect(rules).toMatchObject({
      name: `@cravingmaker/eslint-config/${name}/rules`,
    });
    expect(rules).not.toHaveProperty("plugins");
  });

  it("turns its rules on for JavaScript and TypeScript files by default", async () => {
    const eslint = new ESLint({
      overrideConfig: build(),
      overrideConfigFile: true,
    });
    const severities = await Promise.all([
      getSeverity(eslint, "src/example.js", rule),
      getSeverity(eslint, "src/example.ts", rule),
    ]);

    expect(severities).toEqual([
      expect.toBeOneOf([1, 2]),
      expect.toBeOneOf([1, 2]),
    ]);
  });

  it("turns its rules on for the Svelte components of the context that its files match", async () => {
    const [byDefault, withDirectory, withExtension] = [
      build({}, svelteContext),
      build({ files: ["src/**"] }, svelteContext),
      build({ files: ["src/**/*.js"] }, svelteContext),
    ].map((configs) => {
      return new ESLint({ overrideConfig: configs, overrideConfigFile: true });
    });
    const severities = await Promise.all([
      getSeverity(byDefault, "src/Component.svelte", rule),
      getSeverity(byDefault, "src/generated/Component.svelte", rule),
      getSeverity(withDirectory, "src/Component.svelte", rule),
      // A component that the context leaves out is not read by svelte-eslint-parser.
      getSeverity(withDirectory, "src/generated/Component.svelte", rule),
      getSeverity(withDirectory, "lib/Component.svelte", rule),
      getSeverity(withExtension, "src/Component.svelte", rule),
    ]);

    expect(severities).toEqual([
      expect.toBeOneOf([1, 2]),
      undefined,
      expect.toBeOneOf([1, 2]),
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("keeps to its default files within a directory that is its files", async () => {
    const eslint = new ESLint({
      overrideConfig: build({ files: ["src/**"] }),
      overrideConfigFile: true,
    });
    const severities = await Promise.all(
      [
        "src/example.js",
        "src/example.ts",
        "src/example.cjs",
        "src/data.json",
        "src/README.md",
        "lib/example.js",
      ].map(async (filePath) => {
        return await getSeverity(eslint, filePath, rule);
      }),
    );

    expect(severities).toEqual([
      expect.toBeOneOf([1, 2]),
      expect.toBeOneOf([1, 2]),
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("keeps files, ignores, and overrides local to the feature", async () => {
    const eslint = new ESLint({
      overrideConfig: build({
        files: ["app/**/*.js"],
        ignores: ["**/*.generated.js"],
        overrides: { [rule]: "off" },
      }),
      overrideConfigFile: true,
    });
    const [included, excluded, outside] = await Promise.all([
      getSeverity(eslint, "app/example.js", rule),
      getSeverity(eslint, "app/example.generated.js", rule),
      getSeverity(eslint, "scripts/example.js", rule),
    ]);

    expect(included).toBe(0);
    expect(excluded).toBeUndefined();
    expect(outside).toBeUndefined();
  });
});
