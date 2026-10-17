import type { Rules } from "../../../types.js";

// No Exceptions: https://github.com/eslint-functional/eslint-plugin-functional#rules
const recommendedRules: Rules = {
  // Enabled rules.
  "functional/no-throw-statements": ["error", { allowToRejectPromises: false }],
} as const;

const otherRules: Rules = {
  // Enabled rules.
  "functional/no-promise-reject": "error",

  // Turned off rules.
  "functional/no-try-statements": "off", // Prefer try statements
} as const;

const noExceptionsRules: Rules = {
  ...recommendedRules,
  ...otherRules,
} as const;

export { noExceptionsRules };
