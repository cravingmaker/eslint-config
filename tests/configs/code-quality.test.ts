import type { Linter } from "eslint";
import type { Context } from "../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { comments } from "../../src/configs/comments.js";
import { functional } from "../../src/configs/functional.js";
import { imports } from "../../src/configs/imports.js";
import { node } from "../../src/configs/node.js";
import { perfectionist } from "../../src/configs/perfectionist.js";
import { promise } from "../../src/configs/promise.js";
import { regexp } from "../../src/configs/regexp.js";
import { security } from "../../src/configs/security.js";
import { unicorn } from "../../src/configs/unicorn.js";
import { unusedImports } from "../../src/configs/unused-imports.js";
import { defaultContext } from "../../src/context.js";
import { typescriptFiles } from "../../src/globs.js";

type RuleEntries = Readonly<Record<string, readonly unknown[]>>;

const typedContext: Context = {
  ...defaultContext,
  typeAware: { files: typescriptFiles, ignores: ["**/*.d.ts"] },
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

async function getRules(
  eslint: ESLint,
  filePath: string,
): Promise<RuleEntries | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    { readonly rules?: RuleEntries } | undefined;
  return config?.rules;
}
async function getSettings(
  eslint: ESLint,
  filePath: string,
): Promise<Linter.Config["settings"]> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    Pick<Linter.Config, "settings"> | undefined;
  return config?.settings;
}
// The severity of a rule in the configuration for a file, or `undefined` when it is not set.
async function getSeverity(
  eslint: ESLint,
  filePath: string,
  ruleId: string,
): Promise<unknown> {
  const rules = new Map(
    Object.entries((await getRules(eslint, filePath)) ?? {}),
  );
  return rules.get(ruleId)?.[0];
}

describe.each(features)("$name feature", ({ build, name, plugin, rule }) => {
  it("registers its plugin in a setup block without files", () => {
    const [setup, rules] = build();

    expect(setup).toMatchObject({
      name: `@cravingmaker/eslint-config/${name}/setup`,
    });
    expect(setup).not.toHaveProperty("files");
    expect(Object.keys(setup.plugins ?? {})).toEqual([plugin]);
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

describe("functional feature", () => {
  it("turns off the rules that need type information", async () => {
    const eslint = new ESLint({
      overrideConfig: functional(),
      overrideConfigFile: true,
    });
    const rules = await getRules(eslint, "src/example.ts");

    expect(rules?.["functional/prefer-immutable-types"]).toEqual([0]);
    expect(rules?.["functional/readonly-type"]).toEqual([0]);
  });

  it("turns them on in the type-aware scope when typed linting is on", async () => {
    const eslint = new ESLint({
      overrideConfig: functional({}, typedContext),
      overrideConfigFile: true,
    });
    const severities = await Promise.all([
      getSeverity(eslint, "src/example.ts", "functional/readonly-type"),
      getSeverity(eslint, "src/example.d.ts", "functional/readonly-type"),
      getSeverity(eslint, "src/example.js", "functional/readonly-type"),
    ]);

    expect(severities).toEqual([2, 0, 0]);
  });

  it("keeps the type-aware block within its files and below its overrides", async () => {
    const eslint = new ESLint({
      overrideConfig: functional(
        {
          files: ["app/**"],
          overrides: { "functional/prefer-immutable-types": "warn" },
        },
        typedContext,
      ),
      overrideConfigFile: true,
    });
    const [inside, outside] = await Promise.all([
      getRules(eslint, "app/example.ts"),
      getRules(eslint, "lib/example.ts"),
    ]);

    expect(inside?.["functional/prefer-immutable-types"]).toEqual([1]);
    expect(inside?.["functional/readonly-type"]?.[0]).toBe(2);
    expect(outside?.["functional/readonly-type"]).toBeUndefined();
  });
});

describe("node feature", () => {
  it("turns n/no-sync off in TypeScript files without type information", async () => {
    const untyped = new ESLint({
      overrideConfig: node(),
      overrideConfigFile: true,
    });
    const typed = new ESLint({
      overrideConfig: node({}, typedContext),
      overrideConfigFile: true,
    });
    const severities = await Promise.all([
      getSeverity(untyped, "src/example.js", "n/no-sync"),
      getSeverity(untyped, "src/example.ts", "n/no-sync"),
      getSeverity(typed, "src/example.ts", "n/no-sync"),
      getSeverity(typed, "src/example.d.ts", "n/no-sync"),
    ]);

    expect(severities).toEqual([2, 0, 2, 0]);
  });
});

describe("imports feature", () => {
  it("resolves imports in TypeScript files through the TypeScript resolver", async () => {
    const eslint = new ESLint({
      overrideConfig: imports(),
      overrideConfigFile: true,
    });
    const [typescriptSettings, javascriptSettings] = await Promise.all([
      getSettings(eslint, "src/example.ts"),
      getSettings(eslint, "src/example.js"),
    ]);

    expect(typescriptSettings?.["import-x/resolver-next"]).toEqual([
      expect.objectContaining({ name: "eslint-import-resolver-typescript" }),
      expect.objectContaining({ name: "eslint-plugin-import-x:node" }),
    ]);
    expect(javascriptSettings?.["import-x/resolver-next"]).toBeUndefined();
  });
});
