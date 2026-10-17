import type { Rules } from "../../../types.js";

// Stylistic Issues: https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/
const stylisticIssuesRules: Rules = {
  // Enabled rules.
  "@eslint-community/eslint-comments/no-use": [
    "error",
    {
      additionalDirectives: [],
      allow: ["eslint-disable", "eslint-enable", "eslint-disable-next-line"],
    },
  ],
  "@eslint-community/eslint-comments/require-description": [
    "error",
    { additionalDirectives: [], ignore: [] },
  ],

  // Turned off rules.
  "@eslint-community/eslint-comments/no-restricted-disable": "off", // Project specific
} as const;

export { stylisticIssuesRules };
