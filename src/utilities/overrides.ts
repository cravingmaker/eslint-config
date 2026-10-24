import type { Linter } from "eslint";
import type { Rules } from "../types.js";

/**
 * The settings of a rule after an override, as ESLint merges the rules of a later config object:
 * an override that gives a severity alone, such as `"warn"`, `1`, or `["warn"]`, keeps the options
 * of `policy`, and one with options replaces them, without a deep merge.
 */
const overrideEntry = (
  policy: Readonly<Linter.RuleEntry> | undefined,
  override: Readonly<Linter.RuleEntry> | undefined,
): Linter.RuleEntry | undefined => {
  const options: readonly unknown[] =
    typeof policy === "object" ? policy.slice(1) : [];
  if (typeof override === "object") {
    return override.length === 1 && options.length > 0
      ? [override[0], ...options]
      : [...override];
  }
  return typeof override === "undefined" || options.length === 0
    ? override
    : [override, ...options];
};

/**
 * The rule map `rules` with a feature's `overrides` applied, as ESLint applies the rules of a later
 * config object: an override that gives a severity alone, such as `"warn"`, `1`, or `["warn"]`,
 * keeps the options that `rules` give the rule, and an override with options replaces them, without
 * a deep merge.
 */
const withOverrides = (
  rules: Readonly<Rules>,
  overrides: Readonly<Rules>,
): Rules => {
  const policy = new Map(Object.entries(rules));
  return {
    ...rules,
    ...Object.fromEntries(
      Object.entries(overrides).map(([ruleId, override]) => {
        return [ruleId, overrideEntry(policy.get(ruleId), override)];
      }),
    ),
  };
};

export { withOverrides };
