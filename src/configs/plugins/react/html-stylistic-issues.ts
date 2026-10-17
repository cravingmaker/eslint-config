import type { Rules } from "../../../types.js";

import { classNameOptions } from "./shared-options.js";

// Stylistic Issues: https://html-eslint.org/docs/react/rules
const stylisticIssuesRules: Rules = {
  // Enabled rules.
  "@html-eslint/react/classname-spacing": ["error", { ...classNameOptions }],
} as const;

export { stylisticIssuesRules };
