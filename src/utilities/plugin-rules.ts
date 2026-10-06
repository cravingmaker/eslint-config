import type { Linter } from "eslint";

type PluginRule = {
  readonly meta?: {
    readonly deprecated?: unknown;
    readonly languages?: readonly string[];
  };
};
type PluginRules = Readonly<Record<string, PluginRule | undefined>>;

function getPluginConfigRules(
  pluginName: string,
  rules: unknown,
  configuredRules: unknown,
): Linter.RulesRecord {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Plugin rule maps have inconsistent public typings across packages.
  const pluginRules = rules as PluginRules;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Plugin config rule maps have inconsistent public typings across packages.
  const pluginConfigRules = configuredRules as Linter.RulesRecord;
  const deprecatedRuleIds = new Set(
    Object.entries(pluginRules)
      .filter(
        ([, rule]) =>
          rule?.meta?.deprecated !== undefined &&
          rule.meta.deprecated !== false,
      )
      .map(([ruleName]) => `${pluginName}/${ruleName}`),
  );

  return Object.fromEntries(
    Object.entries(pluginConfigRules).filter(
      ([ruleId]) => !deprecatedRuleIds.has(ruleId),
    ),
  );
}
function getPluginRules(
  pluginName: string,
  rules: unknown,
  language?: string,
  excludedRuleNames: readonly string[] = [],
): Linter.RulesRecord {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Plugin rule maps have inconsistent public typings across packages.
  const pluginRules = rules as PluginRules;

  return Object.fromEntries(
    Object.entries(pluginRules)
      .filter(([ruleName]) => !excludedRuleNames.includes(ruleName))
      .filter(
        ([, rule]) =>
          rule?.meta?.deprecated === undefined ||
          rule.meta.deprecated === false,
      )
      .filter(([, rule]) => {
        if (language === undefined || rule?.meta?.languages === undefined)
          return true;
        return (
          rule.meta.languages.includes("*") ||
          rule.meta.languages.includes(language)
        );
      })
      .map(([ruleName]) => [`${pluginName}/${ruleName}`, "error"]),
  );
}

export { getPluginConfigRules, getPluginRules };
