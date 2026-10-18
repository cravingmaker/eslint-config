import type { Rules } from "../../../../types.js";

// No Statements: https://github.com/eslint-functional/eslint-plugin-functional#rules.
const noStatementsRules: Rules = {
  // --- Rules with default options (1/4) -----------------------------------------------------------------------------------------------------------.
  "functional/no-return-void": [
    "error",
    { allowNull: true, allowUndefined: true, ignoreInferredTypes: false },
  ],

  // --- Rules with overridden options (3/4) --------------------------------------------------------------------------------------------------------.
  "functional/no-conditional-statements": [
    "error",
    { allowReturningBranches: true, ignoreCodePattern: undefined },
  ],
  "functional/no-expression-statements": [
    "error",
    {
      ignoreCodePattern: undefined,
      ignoreSelfReturning: false,
      ignoreVoid: true,
    },
  ],
  "functional/no-loop-statements": "error",
} as const;

export { noStatementsRules }; // 4 rules, 0 automatically fixable, 0 editor suggestions fixable.
