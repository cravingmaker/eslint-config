import type { ResolvedConfig } from "../support/resolved-config.js";

import process from "node:process";

import { ESLint } from "eslint";
import { builtinRules } from "eslint/use-at-your-own-risk";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";
import { getResolvedConfig } from "../support/resolved-config.js";

type EffectiveConfig = Pick<ResolvedConfig, "plugins" | "rules">;
type RuleDefinition = {
  readonly meta?: {
    readonly deprecated?: unknown;
  };
};

// The configuration that ESLint resolves for `filePath` with typed linting on.
const getEffectiveConfig = async (
  filePath: string,
): Promise<EffectiveConfig> => {
  const eslint = new ESLint({
    overrideConfig: await createConfig({
      typescript: { tsconfigRootDir: process.cwd(), typeChecked: true },
    }),
    overrideConfigFile: true,
  });

  const config = await getResolvedConfig(eslint, filePath);
  return config ?? {};
};

const isDeprecated = (rule: RuleDefinition | undefined): boolean => {
  return (
    typeof rule?.meta?.deprecated !== "undefined" &&
    rule.meta.deprecated !== false
  );
};

describe("rule coverage", () => {
  it("classifies every current non-deprecated ESLint core rule", async () => {
    const { rules = {} } = await getEffectiveConfig("src/example.js");
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Coverage audit intentionally inspects ESLint's current builtin rule registry.
    const unclassified = Iterator.from(builtinRules)
      .filter(([ruleName, rule]) => {
        return !isDeprecated(rule) && !Object.hasOwn(rules, ruleName);
      })
      .map(([ruleName]) => {
        return ruleName;
      })
      .toArray()
      .toSorted((left, right) => {
        return left.localeCompare(right);
      });

    expect(unclassified).toEqual([]);
  });

  it("classifies every current non-deprecated rule of every plugin", async () => {
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
    const declaredRuleIds = new Set(
      config
        .filter((entry) => {
          return !(entry.name ?? "").includes("/exceptions/");
        })
        .flatMap((entry) => {
          return Object.keys(entry.rules ?? {});
        }),
    );
    const unclassified = [...plugins]
      .flatMap(([pluginName, plugin]) => {
        return Object.entries(plugin.rules ?? {})
          .filter(([ruleName, rule]) => {
            return (
              !isDeprecated(rule) &&
              !declaredRuleIds.has(`${pluginName}/${ruleName}`)
            );
          })
          .map(([ruleName]) => {
            return `${pluginName}/${ruleName}`;
          });
      })
      .toSorted((left, right) => {
        return left.localeCompare(right);
      });

    expect(plugins.size).toBe(24);
    expect(unclassified).toEqual([]);
  });
});
