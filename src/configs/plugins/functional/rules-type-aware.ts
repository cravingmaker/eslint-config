import type { Rules } from "../../../types.js";

import { functionalRules } from "./rules.js";

// Rules requiring type information stay off outside typed linting.
const typeAwareRulesOff: Rules = {
  "functional/functional-parameters": "off",
  "functional/immutable-data": "off",
  "functional/no-conditional-statements": "off",
  "functional/no-expression-statements": "off",
  "functional/no-mixed-types": "off",
  "functional/no-return-void": "off",
  "functional/no-throw-statements": "off",
  "functional/prefer-immutable-types": "off",
  "functional/prefer-property-signatures": "off",
  "functional/prefer-tacit": "off",
  "functional/readonly-type": "off",
  "functional/type-declaration-immutability": "off",
};

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

export { typeAwareRuleIds, typeAwareRules, typeAwareRulesOff };
