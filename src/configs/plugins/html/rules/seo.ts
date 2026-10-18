import type { Rules } from "../../../../types.js";

// SEO: https://html-eslint.org/docs/rules.
const recommendedRules: Rules = {
  // --- Rules with default options (3/3) -----------------------------------------------------------------------------------------------------------.
  "@html-eslint/no-multiple-h1": "error",
  "@html-eslint/require-lang": "error",
  "@html-eslint/require-title": "error",
} as const;

const otherRules: Rules = {
  // --- Rules with default options (1/2) -----------------------------------------------------------------------------------------------------------.
  "@html-eslint/require-meta-description": "error",

  // --- Rules with overridden options (1/2) --------------------------------------------------------------------------------------------------------.
  "@html-eslint/require-open-graph-protocol": [
    "error",
    ["og:title", "og:type", "og:url", "og:image", "og:description"],
  ],
} as const;

const seoRules: Rules = {
  ...recommendedRules, // 3/5 rules, 0 automatically fixable, 0 editor suggestions fixable.
  ...otherRules, // 2/5 rules, 0 automatically fixable, 0 editor suggestions fixable.
} as const;

export { seoRules };
