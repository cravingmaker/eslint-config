import type { Rules } from "../../../types.js";

// Style: https://html-eslint.org/docs/rules
const recommendedRules: Rules = {
  // Turned off rules.
  "@html-eslint/attrs-newline": "off", // Covered by `prettier`
  "@html-eslint/element-newline": "off", // Covered by `prettier`
  "@html-eslint/indent": "off", // Covered by `prettier`
  "@html-eslint/no-extra-spacing-tags": "off", // Covered by `prettier`
  "@html-eslint/quotes": "off", // Covered by `prettier`
} as const;

const otherRules: Rules = {
  // Enabled rules.
  "@html-eslint/id-naming-convention": [
    "error",
    "kebab-case",
    { flags: undefined, pattern: undefined },
  ],
  "@html-eslint/lowercase": "error",
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

  // Turned off rules.
  "@html-eslint/class-spacing": "off", // Covered by `prettier`
  "@html-eslint/no-extra-spacing-text": "off", // Covered by `prettier`
  "@html-eslint/no-multiple-empty-lines": "off", // Covered by `prettier`
  "@html-eslint/no-trailing-spaces": "off", // Covered by `prettier`
} as const;

const styleRules: Rules = {
  ...recommendedRules,
  ...otherRules,
} as const;

export { styleRules };
