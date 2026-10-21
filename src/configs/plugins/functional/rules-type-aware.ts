import type { Rules } from "../../../types.js";

import { functionalRules } from "./rules.js";

// Rules requiring type information stay off outside typed linting.
const typeAwareRulesOff: Rules = {
  // --- Turned off rules (12/12) -------------------------------------------------------------------------------------------------------------------.
  "functional/functional-parameters": "off", // Requires type information; enabled only in the type-aware scope.
  "functional/immutable-data": "off", // Requires type information; enabled only in the type-aware scope.
  "functional/no-conditional-statements": "off", // Requires type information; enabled only in the type-aware scope.
  "functional/no-expression-statements": "off", // Requires type information; enabled only in the type-aware scope.
  "functional/no-mixed-types": "off", // Requires type information; enabled only in the type-aware scope.
  "functional/no-return-void": "off", // Requires type information; enabled only in the type-aware scope.
  "functional/no-throw-statements": "off", // Requires type information; enabled only in the type-aware scope.
  "functional/prefer-immutable-types": "off", // Requires type information; enabled only in the type-aware scope. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "functional/prefer-property-signatures": "off", // Requires type information; enabled only in the type-aware scope.
  "functional/prefer-tacit": "off", // Handled by `unicorn/no-array-callback-reference`; explicit consumer enablement still requires type information. Manually fixable by editor suggestions.
  "functional/readonly-type": "off", // Requires type information; enabled only in the type-aware scope. Automatically fixable by the --fix command.
  "functional/type-declaration-immutability": "off", // Requires type information; enabled only in the type-aware scope. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
} as const;

const typeAwareRuleIds = [
  ...Object.keys(typeAwareRulesOff),
  // A consumer can still override this deprecated rule; it also needs typed scope.
  "functional/prefer-readonly-type",
];

// The policy for the rules that need type information.
const typeAwareRules: Rules = Object.fromEntries(
  Object.entries(functionalRules).filter(([ruleId]) => {
    return Object.hasOwn(typeAwareRulesOff, ruleId);
  }),
);

export {
  typeAwareRuleIds,
  typeAwareRules,
  typeAwareRulesOff, // 12 rules, 3 automatically fixable, 3 editor suggestions fixable.
};
