import type { Options } from "../../src/types.js";

import process from "node:process";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";
import { getResolvedConfig } from "../support/resolved-config.js";

type RuleEntries = Readonly<
  Partial<Record<string, readonly [number, ...unknown[]]>>
>;

const baseOptions = {
  projectRootDirectory: process.cwd(),
  svelte: true,
  typescript: { tsconfigRootDir: process.cwd(), typeChecked: true },
} as const satisfies Options;
// Ownership is fixed in the rule maps. Disabling or narrowing a winner never enables a loser.
const pairs = [
  ["imports", "n/file-extension-in-import", ["import-x/extensions"]],
  [
    "imports",
    "n/no-extraneous-import",
    ["import-x/no-extraneous-dependencies"],
  ],
  ["imports", "n/no-missing-import", ["import-x/no-unresolved"]],
  ["imports", "no-duplicate-imports", ["import-x/no-duplicates"]],
  [
    "imports",
    "sonarjs/no-implicit-dependencies",
    ["import-x/no-extraneous-dependencies"],
  ],
  [
    "perfectionist",
    "@typescript-eslint/adjacent-overload-signatures",
    ["perfectionist/sort-interfaces", "perfectionist/sort-object-types"],
  ],
  [
    "perfectionist",
    "@typescript-eslint/member-ordering",
    ["perfectionist/sort-classes"],
  ],
  ["perfectionist", "import-x/first", ["perfectionist/sort-imports"]],
  ["perfectionist", "import-x/order", ["perfectionist/sort-imports"]],
  ["perfectionist", "sort-imports", ["perfectionist/sort-imports"]],
  ["perfectionist", "sort-keys", ["perfectionist/sort-objects"]],
  // D8.5 and D8.10 include approved coverage trade-offs; these assertions verify static settings.
  [
    "regexp",
    "@typescript-eslint/prefer-regexp-exec",
    ["regexp/prefer-regexp-exec"],
  ],
  ["regexp", "no-control-regex", ["regexp/no-control-character"]],
  ["regexp", "no-empty-character-class", ["regexp/no-empty-character-class"]],
  ["regexp", "no-invalid-regexp", ["regexp/no-invalid-regexp"]],
  ["regexp", "no-useless-backreference", ["regexp/no-useless-backreference"]],
  ["regexp", "sonarjs/no-empty-group", ["regexp/no-empty-group"]],
  ["regexp", "sonarjs/no-invalid-regexp", ["regexp/no-invalid-regexp"]],
  ["regexp", "sonarjs/prefer-regexp-exec", ["regexp/prefer-regexp-exec"]],
  [
    "sonarjs",
    "unicorn/no-duplicate-if-branches",
    ["sonarjs/no-duplicated-branches", "sonarjs/no-all-duplicated-branches"],
  ],
  [
    "unicorn",
    "functional/prefer-tacit",
    ["unicorn/no-array-callback-reference"],
  ],
  ["unicorn", "n/no-process-exit", ["unicorn/no-process-exit"]],
  ["unicorn", "n/prefer-node-protocol", ["unicorn/prefer-node-protocol"]],
  ["unicorn", "no-negated-condition", ["unicorn/no-negated-condition"]],
  ["unicorn", "no-warning-comments", ["unicorn/expiring-todo-comments"]],
  [
    "unusedImports",
    "@typescript-eslint/no-unused-vars",
    ["unused-imports/no-unused-vars"],
  ],
  ["unusedImports", "no-unused-vars", ["unused-imports/no-unused-vars"]],
] as const;

const getRules = async (
  options: Options,
  filePath: string,
): Promise<RuleEntries> => {
  const eslint = new ESLint({
    overrideConfig: await createConfig({ ...baseOptions, ...options }),
    overrideConfigFile: true,
  });

  const config = await getResolvedConfig(eslint, filePath);
  return config?.rules ?? {};
};

// Each assertion checks effective settings through the public factory, including feature scopes.
describe.each(pairs)("%s: %s stays off with %s", (owner, loser, winners) => {
  const filePath = loser.startsWith("@typescript-eslint/")
    ? "src/example.ts"
    : "src/example.js";

  it("enables the winner and keeps the loser off", async () => {
    const rules = await getRules({}, filePath);
    // eslint-disable-next-line security/detect-object-injection -- The loser is selected from the fixed ownership cases above.
    expect(rules[loser]?.[0]).toBe(0);
    expect(
      winners.map((winner) => {
        // eslint-disable-next-line security/detect-object-injection -- The winner is selected from the fixed ownership cases above.
        return rules[winner]?.[0];
      }),
    ).toEqual(
      winners.map(() => {
        return 2;
      }),
    );
  });

  it("keeps the loser off when its winner is disabled", async () => {
    const rules = await getRules({ [owner]: false }, filePath);
    // eslint-disable-next-line security/detect-object-injection -- The loser is selected from the fixed ownership cases above.
    expect(rules[loser]?.[0]).toBe(0);
    expect(
      winners.some((winner) => {
        // eslint-disable-next-line security/detect-object-injection -- The winner is selected from the fixed ownership cases above.
        return (rules[winner]?.[0] ?? 0) !== 0;
      }),
    ).toBe(false);
  });

  it("keeps the loser off outside its winner's files and in ignored files", async () => {
    const options = {
      [owner]: { files: ["src/**"], ignores: ["**/*.generated.*"] },
    };
    const outside = await getRules(
      options,
      filePath.replace("src/", "scripts/"),
    );
    const ignored = await getRules(
      options,
      filePath.replace("example.", "example.generated."),
    );
    // eslint-disable-next-line security/detect-object-injection -- Both lookups use a loser selected from the fixed ownership cases above.
    expect([outside[loser]?.[0], ignored[loser]?.[0]]).toEqual([0, 0]);
  });

  it("keeps the same ownership in Svelte scripts", async () => {
    const rules = await getRules({}, "src/Component.svelte");
    // eslint-disable-next-line security/detect-object-injection -- The loser is selected from the fixed ownership cases above.
    expect(rules[loser]?.[0]).toBe(0);
    expect(
      winners.map((winner) => {
        // eslint-disable-next-line security/detect-object-injection -- The winner is selected from the fixed ownership cases above.
        return rules[winner]?.[0];
      }),
    ).toEqual(
      winners.map(() => {
        return 2;
      }),
    );
  });
});

// A consumer can still deliberately choose a losing rule through its feature's overrides.
describe("explicit overrides of disabled rules", () => {
  it("preserves core and plugin overrides without adding overlap blocks", async () => {
    const options = {
      javascript: { overrides: { "no-unused-vars": "warn" } },
      node: { overrides: { "n/no-missing-import": "warn" } },
      typescript: {
        overrides: { "@typescript-eslint/no-unused-vars": "warn" },
      },
    } as const satisfies Options;
    const javascript = await getRules(options, "src/example.js");
    const typed = await getRules(options, "src/example.ts");
    const config = await createConfig(options);
    expect(javascript["no-unused-vars"]?.[0]).toBe(1);
    expect(javascript["n/no-missing-import"]?.[0]).toBe(1);
    expect(typed["@typescript-eslint/no-unused-vars"]?.[0]).toBe(1);
    expect(
      config.some((entry) => {
        return (entry.name ?? "").includes("/overlaps/");
      }),
    ).toBe(false);
  });

  it("limits type-aware overrides to the typed scope", async () => {
    const options = {
      typescript: {
        ignoresTypeAware: ["scripts/**"],
        overridesTypeAware: { "@typescript-eslint/no-unused-vars": "warn" },
        typeChecked: true,
      },
    } as const satisfies Options;
    const typed = await getRules(options, "src/example.ts");
    const scripts = await getRules(options, "scripts/example.ts");
    const component = await getRules(options, "src/Component.svelte");
    expect(typed["@typescript-eslint/no-unused-vars"]?.[0]).toBe(1);
    expect(scripts["@typescript-eslint/no-unused-vars"]?.[0]).toBe(0);
    expect(component["@typescript-eslint/no-unused-vars"]?.[0]).toBe(0);
  });
});

describe("core rule ownership", () => {
  it("keeps the selected core policy and its disabled plugin alternatives", async () => {
    const rules = await getRules({}, "src/example.js");
    expect(rules["arrow-body-style"]).toEqual([2, "always"]);
    expect(rules["unicorn/consistent-arrow-return-style"]).toEqual([0]);
    expect(rules["perfectionist/sort-variable-declarations"]?.[0]).toBe(0);
    expect(rules["unicorn/try-complexity"]?.[0]).toBe(0);
    expect(rules["unicorn/logical-assignment-operators"]?.[0]).toBe(0);
    expect(rules["unicorn/operator-assignment"]?.[0]).toBe(0);
    expect(rules["regexp/prefer-named-capture-group"]?.[0]).toBe(0);
    expect(rules["logical-assignment-operators"]).toEqual([2, "never"]);
    expect(rules["operator-assignment"]).toEqual([2, "never"]);
    expect(rules["prefer-named-capture-group"]?.[0]).toBe(2);
  });
});

// TypeScript-specific replacements stay in their language-scoped owning maps.
describe("TypeScript replacements", () => {
  it("keeps core checks off where their TypeScript extension applies", async () => {
    const rules = await getRules({}, "src/example.ts");
    const replacements = [
      ["class-methods-use-this", "@typescript-eslint/class-methods-use-this"],
      ["default-param-last", "@typescript-eslint/default-param-last"],
      ["max-params", "@typescript-eslint/max-params"],
      ["no-array-constructor", "@typescript-eslint/no-array-constructor"],
      ["no-shadow", "@typescript-eslint/no-shadow"],
      ["no-unused-expressions", "@typescript-eslint/no-unused-expressions"],
      [
        "no-unused-private-class-members",
        "@typescript-eslint/no-unused-private-class-members",
      ],
      ["no-use-before-define", "@typescript-eslint/no-use-before-define"],
      ["prefer-destructuring", "@typescript-eslint/prefer-destructuring"],
    ];
    expect(
      replacements.map(([core = "", extension = ""]) => {
        // eslint-disable-next-line security/detect-object-injection -- Both IDs come from the fixed core and TypeScript replacement pairs.
        return [rules[core]?.[0], rules[extension]?.[0]];
      }),
    ).toEqual(
      replacements.map(([core]) => {
        return [0, core === "max-params" ? 1 : 2];
      }),
    );
  });
});
