import type { Rules } from "../../../../types.js";

// Best Practice: https://html-eslint.org/docs/svelte/rules.
const bestPracticeRules: Rules = {
  // --- Rules with default options (9/9) -----------------------------------------------------------------------------------------------------------.
  "@html-eslint/svelte/no-duplicate-class": "error", // Automatically fixable by the --fix command.
  "@html-eslint/svelte/no-ineffective-attrs": "error",
  "@html-eslint/svelte/no-invalid-attr-value": ["error", { allow: [] }],
  "@html-eslint/svelte/no-obsolete-attrs": "error",
  "@html-eslint/svelte/no-obsolete-tags": "error",
  "@html-eslint/svelte/no-restricted-attr-values": "error",
  "@html-eslint/svelte/no-restricted-attrs": "error",
  "@html-eslint/svelte/require-attrs": "error", // Automatically fixable by the --fix command.
  "@html-eslint/svelte/use-baseline": ["error", { available: "widely" }],
} as const;

export { bestPracticeRules }; // 9 rules, 2 automatically fixable, 0 editor suggestions fixable.
