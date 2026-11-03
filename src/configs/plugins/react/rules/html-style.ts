import type { Rules } from "../../../../types.js";

// Style: https://html-eslint.org/docs/react/rules.
const styleRules: Rules = {
  // --- Rules with default options (1/1) -----------------------------------------------------------------------------------------------------------.
  "@html-eslint/react/id-naming-convention": [
    "error",
    "kebab-case",
    { flags: undefined, pattern: undefined },
  ],
} as const;

export { styleRules }; // 1 rule, 0 automatically fixable, 0 editor suggestions fixable.
