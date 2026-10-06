/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import process from "node:process";

import { ESLint } from "eslint";
import { builtinRules } from "eslint/use-at-your-own-risk";
import { describe, expect, it } from "vitest";

import { createConfig } from "../dist/index.mjs";

type EffectiveConfig = {
  readonly plugins?: Readonly<Record<string, RulePlugin | undefined>>;
  readonly rules?: Readonly<Record<string, unknown>>;
};
type RuleDefinition = {
  readonly meta?: {
    readonly deprecated?: unknown;
  };
};
type RulePlugin = {
  readonly rules?: Readonly<Record<string, RuleDefinition | undefined>>;
};

// The configuration that ESLint resolves for `filePath` with typed linting on.
async function getEffectiveConfig(filePath: string): Promise<EffectiveConfig> {
  const eslint = new ESLint({
    overrideConfig: await createConfig({
      tsconfigRootDir: process.cwd(),
      tsTypeChecked: true,
    }),
    overrideConfigFile: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    EffectiveConfig | undefined;
  return config ?? {};
}
function isDeprecated(rule: RuleDefinition | undefined): boolean {
  return rule?.meta?.deprecated !== undefined && rule.meta.deprecated !== false;
}

describe("rule coverage", () => {
  it("classifies every current non-deprecated ESLint core rule", async () => {
    const { rules = {} } = await getEffectiveConfig("src/example.js");
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Coverage audit intentionally inspects ESLint's current builtin rule registry
    const unclassified = Iterator.from(builtinRules)
      .filter(
        ([ruleName, rule]) =>
          !isDeprecated(rule) && !Object.hasOwn(rules, ruleName),
      )
      .map(([ruleName]) => ruleName)
      .toArray()
      .toSorted((left, right) => left.localeCompare(right));

    expect(unclassified).toEqual([]);
  });

  it("classifies every current non-deprecated typescript-eslint rule", async () => {
    const { plugins = {}, rules = {} } =
      await getEffectiveConfig("src/example.ts");
    const plugin = plugins["@typescript-eslint"];
    expect(plugin).toBeDefined();

    const unclassified = Object.entries(plugin?.rules ?? {})
      .filter(
        ([ruleName, rule]) =>
          !isDeprecated(rule) &&
          !Object.hasOwn(rules, `@typescript-eslint/${ruleName}`),
      )
      .map(([ruleName]) => ruleName)
      .toSorted((left, right) => left.localeCompare(right));

    expect(unclassified).toEqual([]);
  });
});
