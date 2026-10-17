import type { Rules } from "../../../types.js";

// Best Practice: https://html-eslint.org/docs/svelte/rules
const bestPracticeRules: Rules = {
  "@html-eslint/svelte/no-duplicate-class": "error",
  // Enabled rules.
  "@html-eslint/svelte/no-ineffective-attrs": "error",
  "@html-eslint/svelte/no-invalid-attr-value": ["error", { allow: [] }],
  "@html-eslint/svelte/no-obsolete-attrs": "error",
  "@html-eslint/svelte/no-obsolete-tags": "error",
  "@html-eslint/svelte/no-restricted-attr-values": "error",
  "@html-eslint/svelte/no-restricted-attrs": "error",
  "@html-eslint/svelte/require-attrs": "error",
  "@html-eslint/svelte/use-baseline": ["error", { available: "widely" }],
} as const;

export { bestPracticeRules };
