import type { Rules } from "../types.js";

type AllRulesOptions = {
  // Rule names, without the plugin prefix, to leave out.
  readonly exclude?: readonly string[];
  // A language such as "js/js": rules whose `meta.languages` leaves it out are skipped.
  readonly language?: string;
};
type PluginRule = {
  readonly meta?: {
    readonly deprecated?: unknown;
    readonly languages?: readonly string[];
  };
};

/**
Turns on every rule of a plugin as an error, except deprecated rules, rules for other
languages, and excluded rules. Rules that a new plugin version adds are turned on as well;
the policy snapshots show them for review.
*/
function enableAllRules(
  pluginName: string,
  rules: unknown,
  { exclude = [], language }: AllRulesOptions = {},
): Rules {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Plugin rule maps have inconsistent public typings across packages.
  const pluginRules = rules as Readonly<Record<string, PluginRule | undefined>>;

  return Object.fromEntries(
    Object.entries(pluginRules)
      .filter(
        ([ruleName, rule]) =>
          !exclude.includes(ruleName) &&
          !isDeprecated(rule) &&
          isLanguageSupported(rule, language),
      )
      // Not `as const`: perfectionist sorts the elements of `as const` arrays.
      .map(([ruleName]): readonly [string, "error"] => [
        `${pluginName}/${ruleName}`,
        "error",
      ]),
  );
}
function isDeprecated(rule: PluginRule | undefined): boolean {
  return rule?.meta?.deprecated !== undefined && rule.meta.deprecated !== false;
}
function isLanguageSupported(
  rule: PluginRule | undefined,
  language: string | undefined,
): boolean {
  const languages = rule?.meta?.languages;
  return (
    language === undefined ||
    languages === undefined ||
    languages.includes("*") ||
    languages.includes(language)
  );
}

export { enableAllRules };
