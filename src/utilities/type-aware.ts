import type { Linter } from "eslint";
import type { FeatureOptions, Rules, TypeAwareScope } from "../types.js";

import { narrowFiles, withoutIgnores } from "./file-scope.js";

// The severities that turn a rule on. Apart from them, ESLint takes only `"off"` and `0`.
const severitiesOn: ReadonlySet<unknown> = new Set([1, 2, "error", "warn"]);

/**
 * Whether the settings of a rule turn it on, with one of `severitiesOn` alone or first in an array.
 */
const isOn = (entry: Readonly<Linter.RuleEntry> | undefined): boolean => {
  // `Array.isArray` narrows a readonly tuple to `any[]`.
  const severity: unknown = Array.isArray(entry) ? entry[0] : entry;
  return severitiesOn.has(severity);
};

/**
 * The files of a feature's type-aware block: the type-aware scope, within the feature's own files
 * when they are set, and without the files that its ignores leave out. The block takes them as its
 * `files` and has no `ignores`, which could bring back a file that the scope leaves out.
 */
const narrowTypeAwareScope = (
  typeAware: TypeAwareScope,
  { files, ignores = [] }: FeatureOptions = {},
): NonNullable<Linter.Config["files"]> => {
  return withoutIgnores(narrowFiles(typeAware, files), ignores);
};

/**
 * The overrides of a feature for a block that reaches files without type information. A rule that
 * needs it, one of `typeAwareRuleIds`, stops ESLint in such a file while it is on, so an override
 * that turns it on is left out, and one that turns it off stays. So do settings that ESLint rejects,
 * which it then reports as for any other rule. The feature's type-aware block takes every override.
 */
const overridesWithoutTypeInformation = (
  overrides: Readonly<Rules>,
  typeAwareRuleIds: readonly string[],
): Rules => {
  return Object.fromEntries(
    Object.entries(overrides).filter(([ruleId, entry]) => {
      return !(typeAwareRuleIds.includes(ruleId) && isOn(entry));
    }),
  );
};

/**
 * Builds a feature's block for the rules that need type information, over the files of
 * `narrowTypeAwareScope`.
 */
const typeAwareConfig = (
  feature: string,
  typeAware: TypeAwareScope,
  options: FeatureOptions = {},
  rules: Rules = {},
): Linter.Config => {
  return {
    files: narrowTypeAwareScope(typeAware, options),
    name: `@cravingmaker/eslint-config/${feature}/rules-type-aware`,
    rules,
  };
};

export {
  narrowTypeAwareScope,
  overridesWithoutTypeInformation,
  typeAwareConfig,
};
