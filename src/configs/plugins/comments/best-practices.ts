import type { Rules } from "../../../types.js";

// Best Practices: https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/
const bestPracticesRules: Rules = {
  // Enabled rules.
  "@eslint-community/eslint-comments/disable-enable-pair": [
    "error",
    { allowWholeFile: true },
  ],
  "@eslint-community/eslint-comments/no-aggregating-enable": "error",
  "@eslint-community/eslint-comments/no-duplicate-disable": "error",
  "@eslint-community/eslint-comments/no-unlimited-disable": "error",
  "@eslint-community/eslint-comments/no-unused-enable": "error",
} as const;

export { bestPracticesRules };
