import type { Rules } from "../../../types.js";

import { sonarjsRules } from "./rules.js";
import { rulesOff } from "../../../utilities/type-aware.js";

// Explicit typed classification; upstream additions never become policy automatically.
const typedRuleIds = new Set([
  "sonarjs/anchor-precedence",
  "sonarjs/argument-type",
  "sonarjs/arguments-order",
  "sonarjs/array-callback-without-return",
  "sonarjs/assertions-in-tests",
  "sonarjs/bitwise-operators",
  "sonarjs/class-prototype",
  "sonarjs/concise-regex",
  "sonarjs/deprecation",
  "sonarjs/different-types-comparison",
  "sonarjs/disabled-auto-escaping",
  "sonarjs/disabled-resource-integrity",
  "sonarjs/dompurify-unsafe-config",
  "sonarjs/duplicates-in-character-class",
  "sonarjs/empty-string-repetition",
  "sonarjs/existing-groups",
  "sonarjs/function-return-type",
  "sonarjs/in-operator-type-error",
  "sonarjs/index-of-compare-to-positive-number",
  "sonarjs/jsx-no-leaked-render",
  "sonarjs/new-operator-misuse",
  "sonarjs/no-alphabetical-sort",
  "sonarjs/no-array-delete",
  "sonarjs/no-associative-arrays",
  "sonarjs/no-async-constructor",
  "sonarjs/no-collection-size-mischeck",
  "sonarjs/no-control-regex",
  "sonarjs/no-empty-after-reluctant",
  "sonarjs/no-empty-alternatives",
  "sonarjs/no-empty-character-class",
  "sonarjs/no-empty-group",
  "sonarjs/no-for-in-iterable",
  "sonarjs/no-ignored-return",
  "sonarjs/no-in-misuse",
  "sonarjs/no-incompatible-assertion-types",
  "sonarjs/no-inconsistent-returns",
  "sonarjs/no-incorrect-string-concat",
  "sonarjs/no-invalid-regexp",
  "sonarjs/no-misleading-array-reverse",
  "sonarjs/no-misleading-character-class",
  "sonarjs/no-redundant-optional",
  "sonarjs/no-regex-spaces",
  "sonarjs/no-require-or-define",
  "sonarjs/no-return-type-any",
  "sonarjs/no-selector-parameter",
  "sonarjs/no-small-switch",
  "sonarjs/no-try-promise",
  "sonarjs/no-undefined-argument",
  "sonarjs/no-useless-intersection",
  "sonarjs/non-number-in-arithmetic-expression",
  "sonarjs/null-dereference",
  "sonarjs/operation-returning-nan",
  "sonarjs/post-message",
  "sonarjs/prefer-immediate-return",
  "sonarjs/prefer-read-only-props",
  "sonarjs/prefer-regexp-exec",
  "sonarjs/reduce-initial-value",
  "sonarjs/regex-complexity",
  "sonarjs/single-char-in-character-classes",
  "sonarjs/single-character-alternation",
  "sonarjs/slow-regex",
  "sonarjs/sql-queries",
  "sonarjs/strings-comparison",
  "sonarjs/synchronous-exception-assertions",
  "sonarjs/unicode-aware-regex",
  "sonarjs/unused-import",
  "sonarjs/unused-named-groups",
  "sonarjs/values-not-convertible-to-numbers",
  "sonarjs/void-use",
]);

// The policy for the rules that need type information.
const typeAwareRules: Rules = Object.fromEntries(
  Object.entries(sonarjsRules).filter(([ruleId]) => {
    return typedRuleIds.has(ruleId);
  }),
);

// Only authored typed entries produce off guards, in the existing sorted order.
const typeAwareRulesOff: Rules = rulesOff(typeAwareRules);
const typeAwareRuleIds = [
  ...Object.keys(typeAwareRulesOff),
  // Explicit consumer overrides of omitted deprecated rules still require typed scope.
  "sonarjs/useless-string-operation",
  "sonarjs/web-sql-database",
];

export { typeAwareRuleIds, typeAwareRules, typeAwareRulesOff };
