import type { Rules } from "../../../types.js";

// SEO: https://html-eslint.org/docs/rules
const recommendedRules: Rules = {
  // Enabled rules.
  "@html-eslint/no-multiple-h1": "error",
  "@html-eslint/require-lang": "error",
  "@html-eslint/require-title": "error",
} as const;

const otherRules: Rules = {
  // Enabled rules.
  "@html-eslint/require-meta-description": "error",
  "@html-eslint/require-open-graph-protocol": [
    "error",
    ["og:title", "og:type", "og:url", "og:image", "og:description"],
  ],
} as const;

const seoRules: Rules = {
  ...recommendedRules,
  ...otherRules,
} as const;

export { seoRules };
