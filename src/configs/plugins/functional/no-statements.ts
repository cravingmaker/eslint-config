import type { Rules } from "../../../types.js";

// No Statements: https://github.com/eslint-functional/eslint-plugin-functional#rules
const noStatementsRules: Rules = {
  // Enabled rules.
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
  "functional/no-return-void": [
    "error",
    { allowNull: true, allowUndefined: true, ignoreInferredTypes: false },
  ],
} as const;

export { noStatementsRules };
