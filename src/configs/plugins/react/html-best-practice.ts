import type { Rules } from "../../../types.js";

// Best Practice: https://html-eslint.org/docs/react/rules
const bestPracticeRules: Rules = {
  // Enabled rules.
  "@html-eslint/react/no-ineffective-attrs": "error",
  "@html-eslint/react/no-invalid-attr-value": ["error", { allow: [] }],
  "@html-eslint/react/no-obsolete-attrs": "error",
  "@html-eslint/react/no-obsolete-tags": "error",
  "@html-eslint/react/no-restricted-attr-values": "error",
  "@html-eslint/react/no-restricted-attrs": "error",
  "@html-eslint/react/require-attrs": "error",
  "@html-eslint/react/use-baseline": ["error", { available: "widely" }],
} as const;

export { bestPracticeRules };
