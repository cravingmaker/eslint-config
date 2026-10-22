import type { Rules } from "../../../../types.js";

import { classNameOptions } from "../shared-options.js";

// Best Practice and Best Practices: https://html-eslint.org/docs/react/rules.
// Treat upstream Best Practice and Best Practices as one local category.
// Preserve the current composition order.
const bestPracticeRules: Rules = {
  // --- Rules with overridden options (1/9) --------------------------------------------------------------------------------------------------------.
  "@html-eslint/react/no-duplicate-classname": [
    "error",
    { ...classNameOptions },
  ], // Automatically fixable by the --fix command.

  // --- Rules with default options (8/9) -----------------------------------------------------------------------------------------------------------.
  "@html-eslint/react/no-ineffective-attrs": "error",
  "@html-eslint/react/no-invalid-attr-value": ["error", { allow: [] }],
  "@html-eslint/react/no-obsolete-attrs": "error",
  "@html-eslint/react/no-obsolete-tags": "error",
  "@html-eslint/react/no-restricted-attr-values": "error",
  "@html-eslint/react/no-restricted-attrs": "error",
  "@html-eslint/react/require-attrs": "error", // Automatically fixable by the --fix command.
  "@html-eslint/react/use-baseline": ["error", { available: "widely" }],
} as const;

export { bestPracticeRules }; // 9 rules, 2 automatically fixable, 0 editor suggestions fixable.
