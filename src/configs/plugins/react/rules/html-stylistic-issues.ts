import type { Rules } from "../../../../types.js";

import { classNameOptions } from "../shared-options.js";

// Stylistic Issues: https://html-eslint.org/docs/react/rules.
const stylisticIssuesRules: Rules = {
  // --- Rules with overridden options (1/1) --------------------------------------------------------------------------------------------------------.
  "@html-eslint/react/classname-spacing": ["error", { ...classNameOptions }], // Automatically fixable by the --fix command.
} as const;

export { stylisticIssuesRules }; // 1 rule, 1 automatically fixable, 0 editor suggestions fixable.
