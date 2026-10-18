import type { Rules } from "../../../../types.js";

// No Exceptions: https://github.com/eslint-functional/eslint-plugin-functional#rules.
const recommendedRules: Rules = {
  // --- Rules with default options (1/1) -----------------------------------------------------------------------------------------------------------.
  "functional/no-throw-statements": ["error", { allowToRejectPromises: false }],
} as const;

const otherRules: Rules = {
  // --- Rules with overridden options (1/2) --------------------------------------------------------------------------------------------------------.
  "functional/no-promise-reject": "error",

  // --- Turned off rules (1/2) ---------------------------------------------------------------------------------------------------------------------.
  "functional/no-try-statements": "off", // Prefer try statements.
} as const;

const noExceptionsRules: Rules = {
  ...recommendedRules, // 1/3 rules, 0 automatically fixable, 0 editor suggestions fixable.
  ...otherRules, // 2/3 rules, 0 automatically fixable, 0 editor suggestions fixable.
} as const;

export { noExceptionsRules };
