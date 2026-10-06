import type { Linter } from "eslint";
import type { FeatureOptions, RuleOptionOf, Rules } from "../types.js";

import pluginHtml from "@html-eslint/eslint-plugin";
import htmlParser from "@html-eslint/parser";

import { htmlFiles } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";

const newLineOptions = {
  inline: ["$inline"],
  skip: ["pre", "code", "textarea"],
} satisfies RuleOptionOf<"@html-eslint/element-newline">;

// Policy for @html-eslint/eslint-plugin.
const htmlRules: Rules = {
  ...enableAllRules("@html-eslint", pluginHtml.rules),

  "@html-eslint/attrs-newline": ["error", { ...newLineOptions }],
  "@html-eslint/element-newline": ["error", { ...newLineOptions }],
  "@html-eslint/id-naming-convention": ["error", "kebab-case"],
  "@html-eslint/indent": ["error", 2],
  "@html-eslint/max-element-depth": ["error", { max: 6 }],
  "@html-eslint/no-extra-spacing-tags": [
    "error",
    {
      disallowInAssignment: true,
      disallowMissing: true,
      disallowTabs: true,
      enforceBeforeSelfClose: true,
    },
  ],
  "@html-eslint/no-extra-spacing-text": [
    "error",
    { skip: ["pre", "code", "textarea"] },
  ],
  "@html-eslint/no-inline-styles": "warn",
  "@html-eslint/no-multiple-empty-lines": ["error", { max: 1 }],
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
  "@html-eslint/quotes": [
    "error",
    "double",
    { enforceTemplatedAttrValue: true },
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
} as const;

// Builds the flat config for HTML files.
function html({
  files = htmlFiles,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] {
  return [
    {
      files: [...files],
      ignores: [...ignores],
      languageOptions: { parser: htmlParser },
      name: "@cravingmaker/eslint-config/html/rules",
      plugins: { "@html-eslint": pluginHtml },
      rules: { ...htmlRules, ...overrides },
    },
  ];
}

export { html };
