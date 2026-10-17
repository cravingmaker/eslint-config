import type { Rules } from "../../../types.js";

// Accessibility: https://html-eslint.org/docs/rules
const recommendedRules: Rules = {
  // Enabled rules.
  "@html-eslint/require-img-alt": ["error", { substitute: [] }],
} as const;

const otherRules: Rules = {
  // Enabled rules.
  "@html-eslint/no-abstract-roles": "error",
  "@html-eslint/no-accesskey-attrs": "error",
  "@html-eslint/no-aria-hidden-body": "error",
  "@html-eslint/no-aria-hidden-on-focusable": "error",
  "@html-eslint/no-empty-headings": "error",
  "@html-eslint/no-heading-inside-button": "error",
  "@html-eslint/no-invalid-role": "error",
  "@html-eslint/no-non-scalable-viewport": "error",
  "@html-eslint/no-positive-tabindex": "error",
  "@html-eslint/no-redundant-role": "error",
  "@html-eslint/no-skip-heading-levels": "error",
  "@html-eslint/require-content": "error",
  "@html-eslint/require-form-method": "error",
  "@html-eslint/require-frame-title": "error",
  "@html-eslint/require-input-label": "error",
  "@html-eslint/require-meta-viewport": "error",
} as const;

const accessibilityRules: Rules = {
  ...recommendedRules,
  ...otherRules,
} as const;

export { accessibilityRules };
