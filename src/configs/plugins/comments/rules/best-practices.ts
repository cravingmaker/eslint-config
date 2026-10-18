import type { Rules } from "../../../../types.js";

// Best Practices: https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/.
const bestPracticesRules: Rules = {
  // --- Rules with default options (4/5) -----------------------------------------------------------------------------------------------------------.
  "@eslint-community/eslint-comments/no-aggregating-enable": "error",
  "@eslint-community/eslint-comments/no-duplicate-disable": "error",
  "@eslint-community/eslint-comments/no-unlimited-disable": "error",
  "@eslint-community/eslint-comments/no-unused-enable": "error",

  // --- Rules with overridden options (1/5) --------------------------------------------------------------------------------------------------------.
  "@eslint-community/eslint-comments/disable-enable-pair": [
    "error",
    { allowWholeFile: true },
  ],
} as const;

export { bestPracticesRules }; // 5 rules, 0 automatically fixable, 0 editor suggestions fixable.
