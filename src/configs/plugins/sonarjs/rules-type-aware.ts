import type { Rules } from "../../../types.js";

import { sonarjsRules } from "./rules.js";

// Rules requiring type information stay off outside typed linting, including disabled alternatives
// that a consumer may choose through overrides. The list is fixed rather than discovered at runtime.
const typeAwareRulesOff: Rules = {
  // --- Turned off rules (69/69) -------------------------------------------------------------------------------------------------------------------.
  "sonarjs/anchor-precedence": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/argument-type": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/arguments-order": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/array-callback-without-return": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/assertions-in-tests": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/bitwise-operators": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/class-prototype": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/concise-regex": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/deprecation": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/different-types-comparison": "off", // Requires type information; enabled only in the type-aware scope. Manually fixable by editor suggestions.
  "sonarjs/disabled-auto-escaping": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/disabled-resource-integrity": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/dompurify-unsafe-config": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/duplicates-in-character-class": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/empty-string-repetition": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/existing-groups": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/function-return-type": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/in-operator-type-error": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/index-of-compare-to-positive-number": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/jsx-no-leaked-render": "off", // Requires type information; enabled only in the type-aware scope. Manually fixable by editor suggestions.
  "sonarjs/new-operator-misuse": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-alphabetical-sort": "off", // Requires type information; enabled only in the type-aware scope. Manually fixable by editor suggestions.
  "sonarjs/no-array-delete": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-associative-arrays": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-async-constructor": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-collection-size-mischeck": "off", // Requires type information; enabled only in the type-aware scope. Manually fixable by editor suggestions.
  "sonarjs/no-control-regex": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-empty-after-reluctant": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-empty-alternatives": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-empty-character-class": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-empty-group": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-for-in-iterable": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-ignored-return": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-in-misuse": "off", // Requires type information; enabled only in the type-aware scope. Manually fixable by editor suggestions.
  "sonarjs/no-incompatible-assertion-types": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-inconsistent-returns": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-incorrect-string-concat": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-invalid-regexp": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-misleading-array-reverse": "off", // Requires type information; enabled only in the type-aware scope. Manually fixable by editor suggestions.
  "sonarjs/no-misleading-character-class": "off", // Requires type information; enabled only in the type-aware scope. Manually fixable by editor suggestions.
  "sonarjs/no-redundant-optional": "off", // Requires type information; enabled only in the type-aware scope. Manually fixable by editor suggestions.
  "sonarjs/no-regex-spaces": "off", // Requires type information; enabled only in the type-aware scope. Manually fixable by editor suggestions.
  "sonarjs/no-require-or-define": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-return-type-any": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-selector-parameter": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-small-switch": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-try-promise": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/no-undefined-argument": "off", // Requires type information; enabled only in the type-aware scope. Manually fixable by editor suggestions.
  "sonarjs/no-useless-intersection": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/non-number-in-arithmetic-expression": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/null-dereference": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/operation-returning-nan": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/post-message": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/prefer-immediate-return": "off", // Requires type information; enabled only in the type-aware scope. Automatically fixable by the --fix command.
  "sonarjs/prefer-read-only-props": "off", // Requires type information; enabled only in the type-aware scope. Manually fixable by editor suggestions.
  "sonarjs/prefer-regexp-exec": "off", // Prefer `regexp/prefer-regexp-exec` for manual review; consumer enablement requires type information. Manually fixable by editor suggestions.
  "sonarjs/reduce-initial-value": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/regex-complexity": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/single-char-in-character-classes": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/single-character-alternation": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/slow-regex": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/sql-queries": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/strings-comparison": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/synchronous-exception-assertions": "off", // Requires type information; enabled only in the type-aware scope. Manually fixable by editor suggestions.
  "sonarjs/unicode-aware-regex": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/unused-import": "off", // Requires type information; enabled only in the type-aware scope. Manually fixable by editor suggestions.
  "sonarjs/unused-named-groups": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/values-not-convertible-to-numbers": "off", // Requires type information; enabled only in the type-aware scope.
  "sonarjs/void-use": "off", // Requires type information; enabled only in the type-aware scope.
} as const;

const typeAwareRuleIds = [
  ...Object.keys(typeAwareRulesOff),
  // Deprecated rules are omitted from policy maps; explicit consumer overrides still need typed scope.
  "sonarjs/useless-string-operation",
  "sonarjs/web-sql-database",
];

// The policy for the rules that need type information.
const typeAwareRules: Rules = Object.fromEntries(
  Object.entries(sonarjsRules).filter(([ruleId]) => {
    return Object.hasOwn(typeAwareRulesOff, ruleId);
  }),
);

export { typeAwareRuleIds, typeAwareRules, typeAwareRulesOff };
