import type { Rules } from "../../../../types.js";

import { classNameOptions } from "../shared-options.js";

// Best Practices: https://html-eslint.org/docs/react/rules.
const bestPracticesRules: Rules = {
  // --- Rules with overridden options (1/1) --------------------------------------------------------------------------------------------------------.
  "@html-eslint/react/no-duplicate-classname": [
    "error",
    { ...classNameOptions },
  ], // Automatically fixable by the --fix command.
} as const;

export { bestPracticesRules }; // 1 rule, 1 automatically fixable, 0 editor suggestions fixable.
