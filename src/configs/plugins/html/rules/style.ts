import type { Rules } from "../../../../types.js";

// Style: https://html-eslint.org/docs/rules.
const recommendedRules: Rules = {
  // --- Turned off rules (5/5) ---------------------------------------------------------------------------------------------------------------------.
  "@html-eslint/attrs-newline": "off", // Handled by `prettier`. Automatically fixable by the --fix command.
  "@html-eslint/element-newline": "off", // Handled by `prettier`. Automatically fixable by the --fix command.
  "@html-eslint/indent": "off", // Handled by `prettier`. Automatically fixable by the --fix command.
  "@html-eslint/no-extra-spacing-tags": "off", // Handled by `prettier`. Automatically fixable by the --fix command.
  "@html-eslint/quotes": "off", // Handled by `prettier`. Automatically fixable by the --fix command.
} as const;

const otherRules: Rules = {
  // --- Rules with default options (2/7) -----------------------------------------------------------------------------------------------------------.
  "@html-eslint/id-naming-convention": [
    "error",
    "kebab-case",
    { flags: undefined, pattern: undefined },
  ],
  "@html-eslint/lowercase": "error", // Automatically fixable by the --fix command.

  // --- Rules with overridden options (1/7) --------------------------------------------------------------------------------------------------------.
  "@html-eslint/sort-attrs": [
    "error",
    {
      priority: [
        // Astro.
        { pattern: "client:.*" },
        { pattern: "(is|set):.*" },

        // Svelte.
        { pattern: "bind:.*" },
        { pattern: "on:.*" },
        { pattern: "use:.*" },
        { pattern: "(transition|in|out|animate):.*" },
        { pattern: "(class|style):.*" },

        // Vue.
        { pattern: "v-.*" },

        // Alpine.
        { pattern: "x-.*" },

        // HTMX.
        { pattern: "hx-.*" },

        // HTML.
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
  ], // Automatically fixable by the --fix command.

  // --- Turned off rules (4/7) ---------------------------------------------------------------------------------------------------------------------.
  "@html-eslint/class-spacing": "off", // Handled by `prettier`. Automatically fixable by the --fix command.
  "@html-eslint/no-extra-spacing-text": "off", // Handled by `prettier`. Automatically fixable by the --fix command.
  "@html-eslint/no-multiple-empty-lines": "off", // Handled by `prettier`. Automatically fixable by the --fix command.
  "@html-eslint/no-trailing-spaces": "off", // Handled by `prettier`. Automatically fixable by the --fix command.
} as const;

const styleRules: Rules = {
  ...recommendedRules, // 5/12 rules, 5 automatically fixable, 0 editor suggestions fixable.
  ...otherRules, // 7/12 rules, 6 automatically fixable, 0 editor suggestions fixable.
} as const;

export { styleRules };
