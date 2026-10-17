import type { Rules } from "../../../types.js";

// Stylistic: https://github.com/eslint-functional/eslint-plugin-functional#rules
const stylisticRules: Rules = {
  // Enabled rules.
  "functional/prefer-property-signatures": [
    "error",
    { ignoreIfReadonlyWrapped: false },
  ],
  "functional/prefer-tacit": ["error", { checkMemberExpressions: false }],
  "functional/readonly-type": ["error", "keyword"],
} as const;

export { stylisticRules };
