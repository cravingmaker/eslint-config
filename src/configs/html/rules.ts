import type { Rules } from "../../types.js";

// Policy for @html-eslint/eslint-plugin.
const htmlRules: Rules = {
  "@html-eslint/css-no-empty-blocks": "error",
  "@html-eslint/head-order": ["error", { ignores: [] }],
  "@html-eslint/lowercase": "error",
  "@html-eslint/no-abstract-roles": "error",
  "@html-eslint/no-accesskey-attrs": "error",
  "@html-eslint/no-aria-hidden-body": "error",
  "@html-eslint/no-aria-hidden-on-focusable": "error",
  "@html-eslint/no-duplicate-attrs": "error",
  "@html-eslint/no-duplicate-class": "error",
  "@html-eslint/no-duplicate-id": "error",
  "@html-eslint/no-duplicate-in-head": "error",
  "@html-eslint/no-empty-headings": "error",
  "@html-eslint/no-heading-inside-button": "error",
  "@html-eslint/no-ineffective-attrs": "error",
  "@html-eslint/no-invalid-attr-value": ["error", { allow: [] }],
  "@html-eslint/no-invalid-entity": "error",
  "@html-eslint/no-invalid-role": "error",
  "@html-eslint/no-multiple-h1": "error",
  "@html-eslint/no-nested-interactive": "error",
  "@html-eslint/no-non-scalable-viewport": "error",
  "@html-eslint/no-obsolete-attrs": "error",
  "@html-eslint/no-obsolete-tags": "error",
  "@html-eslint/no-positive-tabindex": "error",
  "@html-eslint/no-redundant-role": "error",
  "@html-eslint/no-script-style-type": "error",
  "@html-eslint/no-skip-heading-levels": "error",
  "@html-eslint/no-target-blank": "error",
  "@html-eslint/no-whitespace-only-children": ["error", { tagPatterns: [] }],
  "@html-eslint/prefer-https": "error",
  "@html-eslint/require-button-type": "error",
  "@html-eslint/require-content": "error",
  "@html-eslint/require-details-summary": "error",
  "@html-eslint/require-doctype": "error",
  "@html-eslint/require-explicit-size": [
    "error",
    { allowClass: [], allowId: [] },
  ],
  "@html-eslint/require-form-method": "error",
  "@html-eslint/require-frame-title": "error",
  "@html-eslint/require-img-alt": ["error", { substitute: [] }],
  "@html-eslint/require-input-label": "error",
  "@html-eslint/require-lang": "error",
  "@html-eslint/require-li-container": "error",
  "@html-eslint/require-meta-charset": "error",
  "@html-eslint/require-meta-description": "error",
  "@html-eslint/require-meta-viewport": "error",
  "@html-eslint/require-title": "error",
  "@html-eslint/svg-require-viewbox": "error",
  "@html-eslint/use-baseline": ["error", { available: "widely" }],

  "@html-eslint/id-naming-convention": [
    "error",
    "kebab-case",
    { flags: undefined, pattern: undefined },
  ],
  "@html-eslint/max-element-depth": ["error", { max: 6 }],
  "@html-eslint/no-inline-styles": ["warn", { allowExpressions: false }],
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
  ],
  "@html-eslint/require-closing-tags": [
    "warn",
    {
      selfClosing: "always",
      selfClosingCustomPatterns: ["-"],
    },
  ],
  "@html-eslint/require-open-graph-protocol": [
    "error",
    ["og:title", "og:type", "og:url", "og:image", "og:description"],
  ],
  "@html-eslint/sort-attrs": [
    "error",
    {
      priority: [
        // Astro
        { pattern: "client:.*" },
        { pattern: "(is|set):.*" },

        // Svelte
        { pattern: "bind:.*" },
        { pattern: "on:.*" },
        { pattern: "use:.*" },
        { pattern: "(transition|in|out|animate):.*" },
        { pattern: "(class|style):.*" },

        // Vue
        { pattern: "v-.*" },

        // Alpine
        { pattern: "x-.*" },

        // HTMX
        { pattern: "hx-.*" },

        // HTML
        "id",
        "class",
        "name",
        "type",
        "for",
        "href",
        "src",
        "value",
        "alt",
        "title",
        "role",
        { pattern: "aria-.*" },
        "disabled",
        "readonly",
        "required",
        { pattern: "data-.*" },
        { pattern: "on.*" },
        "style",
      ],
    },
  ],

  // Layout: whitespace, line breaks, indentation, and attribute quotes
  "@html-eslint/attrs-newline": "off", // Covered by `prettier`
  "@html-eslint/class-spacing": "off", // Covered by `prettier`
  "@html-eslint/element-newline": "off", // Covered by `prettier`
  "@html-eslint/indent": "off", // Covered by `prettier`
  "@html-eslint/no-extra-spacing-tags": "off", // Covered by `prettier`
  "@html-eslint/no-extra-spacing-text": "off", // Covered by `prettier`
  "@html-eslint/no-multiple-empty-lines": "off", // Covered by `prettier`
  "@html-eslint/no-trailing-spaces": "off", // Covered by `prettier`
  "@html-eslint/quotes": "off", // Covered by `prettier`
} as const;

export { htmlRules };
