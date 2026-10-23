import type { Rules } from "../../../types.js";

import { functionalRules } from "./rules.js";
import { rulesOff } from "../../../utilities/type-aware.js";

// Explicit typed classification; upstream additions never become policy automatically.
const typedRuleIds = new Set([
  "functional/functional-parameters",
  "functional/immutable-data",
  "functional/no-conditional-statements",
  "functional/no-expression-statements",
  "functional/no-mixed-types",
  "functional/no-return-void",
  "functional/no-throw-statements",
  "functional/prefer-immutable-types",
  "functional/prefer-property-signatures",
  "functional/prefer-tacit",
  "functional/readonly-type",
  "functional/type-declaration-immutability",
]);

// The policy for the rules that need type information.
const typeAwareRules: Rules = Object.fromEntries(
  Object.entries(functionalRules).filter(([ruleId]) => {
    return typedRuleIds.has(ruleId);
  }),
);

// Only authored typed entries produce off guards, in the existing sorted order.
const typeAwareRulesOff: Rules = rulesOff(typeAwareRules);
const typeAwareRuleIds = [
  ...Object.keys(typeAwareRulesOff),
  // Explicit consumer overrides of omitted deprecated rules still require typed scope.
  "functional/prefer-readonly-type",
];

export {
  typeAwareRuleIds,
  typeAwareRules,
  typeAwareRulesOff, // 12 rules, 3 automatically fixable, 3 editor suggestions fixable.
};
