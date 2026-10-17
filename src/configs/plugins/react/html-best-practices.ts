import type { Rules } from "../../../types.js";

import { classNameOptions } from "./shared-options.js";

// Best Practices: https://html-eslint.org/docs/react/rules
const bestPracticesRules: Rules = {
  // Enabled rules.
  "@html-eslint/react/no-duplicate-classname": [
    "error",
    { ...classNameOptions },
  ],
} as const;

export { bestPracticesRules };
