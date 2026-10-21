import type { Rules } from "../../../../types.js";

// Best Practice: https://html-eslint.org/docs/rules.
const recommendedRules: Rules = {
  // --- Rules with default options (8/9) -----------------------------------------------------------------------------------------------------------.
  "@html-eslint/no-duplicate-attrs": "error", // Manually fixable by editor suggestions.
  "@html-eslint/no-duplicate-id": "error",
  "@html-eslint/no-duplicate-in-head": "error",
  "@html-eslint/no-obsolete-attrs": "error",
  "@html-eslint/no-obsolete-tags": "error",
  "@html-eslint/require-doctype": "error", // Automatically fixable by the --fix command.
  "@html-eslint/require-li-container": "error",
  "@html-eslint/use-baseline": ["error", { available: "widely" }],

  // --- Rules with overridden options (1/9) --------------------------------------------------------------------------------------------------------.
  "@html-eslint/require-closing-tags": [
    "warn",
    {
      selfClosing: "always",
      // HTML custom elements need explicit end tags; a trailing slash does not close them.
      selfClosingCustomPatterns: [],
    },
  ], // Automatically fixable by the --fix command.
} as const;

const otherRules: Rules = {
  // --- Rules with default options (17/22) ---------------------------------------------------------------------------------------------------------.
  "@html-eslint/css-no-empty-blocks": "error",
  "@html-eslint/head-order": ["error", { ignores: [] }], // Automatically fixable by the --fix command.
  "@html-eslint/no-duplicate-class": "error", // Automatically fixable by the --fix command.
  "@html-eslint/no-ineffective-attrs": "error",
  "@html-eslint/no-inline-styles": ["warn", { allowExpressions: false }],
  "@html-eslint/no-invalid-attr-value": ["error", { allow: [] }],
  "@html-eslint/no-invalid-entity": "error",
  "@html-eslint/no-nested-interactive": "error",
  "@html-eslint/no-script-style-type": "error", // Automatically fixable by the --fix command.
  "@html-eslint/no-target-blank": "error",
  "@html-eslint/no-whitespace-only-children": ["error", { tagPatterns: [] }], // Automatically fixable by the --fix command.
  "@html-eslint/prefer-https": "error",
  "@html-eslint/require-button-type": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "@html-eslint/require-details-summary": "error",
  "@html-eslint/require-explicit-size": [
    "error",
    { allowClass: [], allowId: [] },
  ],
  "@html-eslint/require-meta-charset": "error", // Automatically fixable by the --fix command.
  "@html-eslint/svg-require-viewbox": "error",

  // --- Rules with overridden options (5/22) -------------------------------------------------------------------------------------------------------.
  "@html-eslint/max-element-depth": ["error", { max: 6 }],
  "@html-eslint/no-restricted-attr-values": [
    "error",
    {
      attrPatterns: ["href", "src", "action", "formaction"],
      attrValuePatterns: [
        String.raw`^\s*javascript:`,
        String.raw`^\s*vbscript:`,
        String.raw`^\s*data:text/html`,
      ],
      message:
        "Inline scripts and data URIs in navigation attributes pose a severe security risk. Use addEventListener() and strict CSP.",
    },
  ],
  "@html-eslint/no-restricted-attrs": [
    "warn",
    {
      attrPatterns: ["^on[a-z]+$"],
      message: "Use addEventListener() instead.",
      tagPatterns: [".*"],
    },
  ],
  "@html-eslint/no-restricted-tags": [
    "warn",
    {
      message: "Use semantic alternatives or CSS instead.",
      tagPatterns: ["^(b|i|s|u)$"],
    },
  ],
  "@html-eslint/require-attrs": [
    "error",
    {
      attr: "alt",
      message:
        "Add an alt attribute to images to support screen readers and ensure accessibility.",
      tag: "img",
    },
    {
      attr: "width",
      message:
        "Set the width attribute on images to reserve space and prevent page layout shifting as the image loads.",
      tag: "img",
    },
    {
      attr: "height",
      message:
        "Set the height attribute on images to reserve space and prevent page layout shifting as the image loads.",
      tag: "img",
    },
    {
      attr: "loading",
      message:
        "Include the loading attribute to control image load priority and improve initial page performance.",
      tag: "img",
    },
    {
      attr: "decoding",
      message:
        "Include the decoding attribute to optimize how the browser renders the image.",
      tag: "img",
    },
    {
      attr: "title",
      message:
        "Add a title attribute to iframes to describe the nested content for screen readers.",
      tag: "iframe",
    },
    {
      attr: "type",
      message:
        "Set the type attribute on input fields to ensure predictable user input handling and mobile keyboard behavior.",
      tag: "input",
    },
  ], // Automatically fixable by the --fix command.
} as const;

const bestPracticeRules: Rules = {
  ...recommendedRules, // 9/31 rules, 2 automatically fixable, 1 editor suggestions fixable.
  ...otherRules, // 22/31 rules, 7 automatically fixable, 1 editor suggestions fixable.
} as const;

export { bestPracticeRules };
