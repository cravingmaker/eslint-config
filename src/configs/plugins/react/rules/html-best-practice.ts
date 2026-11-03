import type { Rules } from "../../../../types.js";

import { classNameOptions } from "../shared-options.js";

// Best Practice and Best Practices: https://html-eslint.org/docs/react/rules.
// Treat upstream Best Practice and Best Practices as one local category.
// Preserve the current composition order.
const bestPracticeRules: Rules = {
  // --- Rules with overridden options (2/11) -------------------------------------------------------------------------------------------------------.
  "@html-eslint/react/no-duplicate-classname": [
    "error",
    { ...classNameOptions },
  ], // Automatically fixable by the --fix command.
  "@html-eslint/react/no-restricted-tags": [
    "warn",
    {
      message: "Use semantic alternatives or CSS instead.",
      tagPatterns: ["^(b|i|s|u)$"],
    },
  ],

  // --- Rules with default options (9/11) ----------------------------------------------------------------------------------------------------------.
  "@html-eslint/react/no-ineffective-attrs": "error",
  "@html-eslint/react/no-invalid-attr-value": ["error", { allow: [] }],
  "@html-eslint/react/no-obsolete-attrs": "error",
  "@html-eslint/react/no-obsolete-tags": "error",
  "@html-eslint/react/no-restricted-attr-values": "error",
  "@html-eslint/react/no-restricted-attrs": "error",
  "@html-eslint/react/require-attrs": "error", // Automatically fixable by the --fix command.
  "@html-eslint/react/require-li-container": "error",
  "@html-eslint/react/use-baseline": ["error", { available: "widely" }],
} as const;

export { bestPracticeRules }; // 11 rules, 2 automatically fixable, 0 editor suggestions fixable.
