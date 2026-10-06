/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import type { Linter } from "eslint";

import process from "node:process";

import { describe, expect, it } from "vitest";

import { createConfig } from "../dist/index.mjs";

type Plugin = NonNullable<Linter.Config["plugins"]>[string];
type PluginRule = {
  readonly meta?: {
    readonly deprecated?: unknown;
  };
};

function findPluginName(
  ruleId: string,
  pluginNames: readonly string[],
): string | undefined {
  return pluginNames.find((name) => ruleId.startsWith(`${name}/`));
}
function isDeprecatedConfiguredRule(
  ruleId: string,
  pluginNames: readonly string[],
  // eslint-disable-next-line functional/prefer-immutable-types -- ESLint plugin types are externally defined and not deeply readonly
  plugins: ReadonlyMap<string, Plugin>,
): boolean {
  const pluginName = findPluginName(ruleId, pluginNames);
  if (pluginName === undefined) return false;

  const plugin = plugins.get(pluginName);
  const ruleName = ruleId.slice(pluginName.length + 1);
  const rule = Object.entries(plugin?.rules ?? {}).find(
    ([name]) => name === ruleName,
  )?.[1];
  if (!isPluginRule(rule)) return false;

  return rule.meta?.deprecated !== undefined && rule.meta.deprecated !== false;
}
function isPluginRule(value: unknown): value is PluginRule {
  return typeof value === "object" && value !== null;
}

describe("deprecated rule handling", () => {
  it("does not configure deprecated plugin rules", async () => {
    const config = await createConfig({
      reactRefreshVariant: "generic",
      tsconfigRootDir: process.cwd(),
      tsTypeChecked: true,
    });
    const plugins = new Map(
      config.flatMap((entry) => Object.entries(entry.plugins ?? {})),
    );
    const pluginNames = plugins
      .keys()
      .toArray()
      .toSorted((left, right) => right.length - left.length);
    const deprecatedRuleIds = config.flatMap((entry) =>
      Object.keys(entry.rules ?? {}).filter((ruleId) =>
        isDeprecatedConfiguredRule(ruleId, pluginNames, plugins),
      ),
    );

    expect(
      [...new Set(deprecatedRuleIds)].toSorted((left, right) =>
        left.localeCompare(right),
      ),
    ).toEqual([]);
  });
});
