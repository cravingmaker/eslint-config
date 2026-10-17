import type { Rules } from "../../../types.js";

// Stylistic Issues: https://html-eslint.org/docs/svelte/rules
const stylisticIssuesRules: Rules = {
  // Enabled rules.
  "@html-eslint/svelte/class-spacing": "error",
} as const;

export { stylisticIssuesRules };
