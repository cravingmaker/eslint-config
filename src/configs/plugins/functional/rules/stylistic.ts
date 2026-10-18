import type { Rules } from "../../../../types.js";

// Stylistic: https://github.com/eslint-functional/eslint-plugin-functional#rules.
const stylisticRules: Rules = {
  // --- Rules with default options (2/3) -----------------------------------------------------------------------------------------------------------.
  "functional/prefer-property-signatures": [
    "error",
    { ignoreIfReadonlyWrapped: false },
  ],
  "functional/prefer-tacit": ["error", { checkMemberExpressions: false }], // Manually fixable by editor suggestions.

  // --- Rules with overridden options (1/3) --------------------------------------------------------------------------------------------------------.
  "functional/readonly-type": ["error", "keyword"], // Automatically fixable by the --fix command.
} as const;

export { stylisticRules }; // 3 rules, 1 automatically fixable, 1 editor suggestions fixable.
