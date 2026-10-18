import type { Rules } from "../../../../types.js";

// Best Practice: https://html-eslint.org/docs/react/rules.
const bestPracticeRules: Rules = {
  // --- Rules with default options (8/8) -----------------------------------------------------------------------------------------------------------.
  "@html-eslint/react/no-ineffective-attrs": "error",
  "@html-eslint/react/no-invalid-attr-value": ["error", { allow: [] }],
  "@html-eslint/react/no-obsolete-attrs": "error",
  "@html-eslint/react/no-obsolete-tags": "error",
  "@html-eslint/react/no-restricted-attr-values": "error",
  "@html-eslint/react/no-restricted-attrs": "error",
  "@html-eslint/react/require-attrs": "error", // Automatically fixable by the --fix command.
  "@html-eslint/react/use-baseline": ["error", { available: "widely" }],
} as const;

export { bestPracticeRules }; // 8 rules, 1 automatically fixable, 0 editor suggestions fixable.
