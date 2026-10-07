import type { Linter } from "eslint";
import type { Options } from "../../src/types.js";

import process from "node:process";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";
import { featureOf, overlaps } from "../../src/overlaps.js";

type RuleEntries = Readonly<Record<string, RuleEntry>>;
// A rule's settings as ESLint resolves them: the severity as a number, then the options.
type RuleEntry = readonly [Linter.Severity, ...unknown[]];

const baseOptions = {
  projectRootDirectory: process.cwd(),
  typescript: { tsconfigRootDir: process.cwd(), typeChecked: true },
} as const satisfies Options;
// The options that turn each owner off.
const withoutOwner = {
  imports: { ...baseOptions, imports: false },
  perfectionist: { ...baseOptions, perfectionist: false },
  regexp: { ...baseOptions, regexp: false },
  unicorn: { ...baseOptions, unicorn: false },
  unusedImports: { ...baseOptions, unusedImports: false },
} as const satisfies Readonly<Record<keyof typeof overlaps, Options>>;
const optionsWithoutOwner = new Map<string, Options>(
  Object.entries(withoutOwner),
);
// The options that limit each owner to `src/` and leave its generated files out.
const ownerScope = {
  files: ["src/**"],
  ignores: ["**/*.generated.*"],
} as const;
const withNarrowedOwner = {
  imports: { ...baseOptions, imports: ownerScope },
  perfectionist: { ...baseOptions, perfectionist: ownerScope },
  regexp: { ...baseOptions, regexp: ownerScope },
  unicorn: { ...baseOptions, unicorn: ownerScope },
  unusedImports: { ...baseOptions, unusedImports: ownerScope },
} as const satisfies Readonly<Record<keyof typeof overlaps, Options>>;
const optionsWithNarrowedOwner = new Map<string, Options>(
  Object.entries(withNarrowedOwner),
);
const cases = Object.entries(overlaps).flatMap(([owner, replacedRules]) =>
  Object.entries(replacedRules).map(([replaced, ownerRules]) => ({
    owner,
    ownerRules,
    replaced,
  })),
);

// The rules that ESLint resolves for `filePath` with `options`.
async function getRules(
  options: Options,
  filePath: string,
): Promise<ReadonlyMap<string, RuleEntry>> {
  const eslint = new ESLint({
    overrideConfig: await createConfig(options),
    overrideConfigFile: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    { readonly rules?: RuleEntries } | undefined;
  return new Map(Object.entries(config?.rules ?? {}));
}
// The severity of each of `ruleIds` that ESLint resolves for `filePath` with `options`.
async function getSeverities(
  options: Options,
  filePath: string,
  ruleIds: readonly string[],
): Promise<ReadonlyArray<Linter.Severity | undefined>> {
  const rules = await getRules(options, filePath);
  return ruleIds.map((ruleId) => rules.get(ruleId)?.[0]);
}

describe("overlap table", () => {
  it.each(cases)(
    "$owner replaces $replaced, and turning $owner off brings it back",
    async ({ owner, ownerRules, replaced }) => {
      const filePath =
        featureOf(replaced) === "typescript"
          ? "src/example.ts"
          : "src/example.js";
      const [ownerOn, ownerOff] = await Promise.all([
        getRules(baseOptions, filePath),
        getRules(optionsWithoutOwner.get(owner) ?? {}, filePath),
      ]);

      expect(ownerOn.get(replaced)?.[0]).toBe(0);
      expect(
        ownerRules.some((ruleId) => (ownerOn.get(ruleId)?.[0] ?? 0) !== 0),
      ).toBe(true);
      expect(ownerOff.get(replaced)?.[0]).toBe(2);
      expect(ownerRules.filter((ruleId) => ownerOff.has(ruleId))).toEqual([]);
    },
  );

  it.each(cases)(
    "$owner replaces $replaced only in its own files, without its ignores",
    async ({ owner, ownerRules, replaced }) => {
      const extension = featureOf(replaced) === "typescript" ? "ts" : "js";
      const options = optionsWithNarrowedOwner.get(owner) ?? {};
      const [inside, outside, ignored] = await Promise.all(
        [
          `src/example.${extension}`,
          `scripts/example.${extension}`,
          `src/example.generated.${extension}`,
        ].map(async (filePath) => await getRules(options, filePath)),
      );

      expect(inside.get(replaced)?.[0]).toBe(0);
      expect(
        ownerRules.some((ruleId) => (inside.get(ruleId)?.[0] ?? 0) !== 0),
      ).toBe(true);
      expect(outside.get(replaced)?.[0]).toBe(2);
      expect(ignored.get(replaced)?.[0]).toBe(2);
      expect(
        ownerRules.filter(
          (ruleId) => outside.has(ruleId) || ignored.has(ruleId),
        ),
      ).toEqual([]);
    },
  );

  // The scripts of Svelte components get the rules of TypeScript sources, so core rules that
  // typescript-eslint replaces stay off there whether the owner is on or off.
  it.each(cases)(
    "$owner replaces $replaced in Svelte components as in TypeScript sources",
    async ({ owner, ownerRules, replaced }) => {
      const ownerOn = { ...baseOptions, svelte: true };
      const ownerOff = { ...optionsWithoutOwner.get(owner), svelte: true };
      const ruleIds = [replaced, ...ownerRules];
      const [componentOn, sourceOn, componentOff, sourceOff] =
        await Promise.all([
          getSeverities(ownerOn, "src/Component.svelte", ruleIds),
          getSeverities(ownerOn, "src/example.ts", ruleIds),
          getSeverities(ownerOff, "src/Component.svelte", ruleIds),
          getSeverities(ownerOff, "src/example.ts", ruleIds),
        ]);

      expect(componentOn[0]).toBe(0);
      expect(componentOn).toEqual(sourceOn);
      expect(componentOff).toEqual(sourceOff);
    },
  );

  it("names the feature of every replaced rule", () => {
    expect(
      cases.filter(({ replaced }) => featureOf(replaced) === undefined),
    ).toEqual([]);
  });

  it("keeps a replaced rule that the user overrides in its feature", async () => {
    const rules = await getRules(
      {
        ...baseOptions,
        javascript: { overrides: { "sort-keys": ["warn", "asc"] } },
        node: { overrides: { "n/prefer-node-protocol": "warn" } },
      },
      "src/example.js",
    );

    expect(rules.get("sort-keys")?.[0]).toBe(1);
    expect(rules.get("n/prefer-node-protocol")?.[0]).toBe(1);
    expect(rules.get("no-negated-condition")?.[0]).toBe(0);
  });
});

describe("overlaps owned by the javascript feature", () => {
  it("stay in the rule maps, because the javascript feature is always on", async () => {
    const rules = await getRules(baseOptions, "src/example.js");

    expect(rules.get("arrow-body-style")).toEqual([2, "as-needed"]);
    expect(rules.has("unicorn/consistent-arrow-return-style")).toBe(false);
    expect(rules.get("perfectionist/sort-variable-declarations")?.[0]).toBe(0);
    expect(rules.get("unicorn/try-complexity")?.[0]).toBe(0);
  });
});

describe("TypeScript replacements", () => {
  it("prefer typescript-eslint extension rules in TypeScript files", async () => {
    const rules = await getRules(baseOptions, "src/example.ts");
    const pairs = [
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
      pairs.map(([core = "", extension = ""]) => [
        rules.get(core)?.[0],
        rules.get(extension)?.[0],
      ]),
    ).toEqual(pairs.map(() => [0, 2]));
    expect(rules.get("no-loop-func")?.[0]).toBe(2);
    expect(rules.has("@typescript-eslint/no-loop-func")).toBe(false);
  });
});
