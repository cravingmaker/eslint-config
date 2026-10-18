import type { Rules } from "../../../../types.js";

// Stylistic Issues: https://html-eslint.org/docs/svelte/rules.
const stylisticIssuesRules: Rules = {
  // --- Rules with default options (1/1) -----------------------------------------------------------------------------------------------------------.
  "@html-eslint/svelte/class-spacing": "error", // Automatically fixable by the --fix command.
} as const;

export { stylisticIssuesRules }; // 1 rule, 1 automatically fixable, 0 editor suggestions fixable.
