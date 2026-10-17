import type { Linter } from "eslint";

import process from "node:process";

import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

type Plugin = NonNullable<Linter.Config["plugins"]>[string];
type PluginRule = {
  readonly meta?: {
    readonly deprecated?: unknown;
  };
};
const findPluginName = (
  ruleId: string,
  pluginNames: readonly string[],
): string | undefined => {
  return pluginNames.find((name) => {
    return ruleId.startsWith(`${name}/`);
  });
};
const isPluginRule = (value: unknown): value is PluginRule => {
  return typeof value === "object" && value !== null;
};
const isDeprecatedConfiguredRule = (
  ruleId: string,
  pluginNames: readonly string[],
  plugins: ReadonlyMap<string, Plugin>,
): boolean => {
  const pluginName = findPluginName(ruleId, pluginNames);
  if (typeof pluginName === "undefined") {
    return false;
  }
  const plugin = plugins.get(pluginName);
  const ruleName = ruleId.slice(pluginName.length + 1);
  const rule = Object.entries(plugin?.rules ?? {}).find(([name]) => {
    return name === ruleName;
  })?.[1];
  if (!isPluginRule(rule)) {
    return false;
  }
  return (
    typeof rule.meta?.deprecated !== "undefined" &&
    rule.meta.deprecated !== false
  );
};
describe("deprecated rule handling", () => {
  it("does not configure deprecated plugin rules", async () => {
    const config = await createConfig({
      express: true,
      react: { refresh: "generic" },
      svelte: true,
      typescript: { tsconfigRootDir: process.cwd(), typeChecked: true },
    });
    const plugins = new Map(
      config.flatMap((entry) => {
        return Object.entries(entry.plugins ?? {});
      }),
    );
    const pluginNames = plugins
      .keys()
      .toArray()
      .toSorted((left, right) => {
        return right.length - left.length;
      });
    const deprecatedRuleIds = config.flatMap((entry) => {
      return Object.keys(entry.rules ?? {}).filter((ruleId) => {
        return isDeprecatedConfiguredRule(ruleId, pluginNames, plugins);
      });
    });
    expect(
      [...new Set(deprecatedRuleIds)].toSorted((left, right) => {
        return left.localeCompare(right);
      }),
    ).toEqual([]);
  });
});
