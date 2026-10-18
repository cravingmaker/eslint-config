import type { Rules } from "../../../../types.js";

// Stylistic Issues: https://eslint-community.github.io/eslint-plugin-eslint-comments/rules/.
const stylisticIssuesRules: Rules = {
  // --- Rules with default options (1/3) -----------------------------------------------------------------------------------------------------------.
  "@eslint-community/eslint-comments/require-description": [
    "error",
    { additionalDirectives: [], ignore: [] },
  ],

  // --- Rules with overridden options (1/3) --------------------------------------------------------------------------------------------------------.
  "@eslint-community/eslint-comments/no-use": [
    "error",
    {
      additionalDirectives: [],
      allow: ["eslint-disable", "eslint-enable", "eslint-disable-next-line"],
    },
  ],

  // --- Turned off rules (1/3) ---------------------------------------------------------------------------------------------------------------------.
  "@eslint-community/eslint-comments/no-restricted-disable": "off", // Project specific.
} as const;

export { stylisticIssuesRules }; // 3 rules, 0 automatically fixable, 0 editor suggestions fixable.
