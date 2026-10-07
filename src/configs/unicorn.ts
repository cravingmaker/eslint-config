import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import pluginUnicorn from "eslint-plugin-unicorn";

import { defaultContext } from "../context.js";
import { sourceFiles, withSvelteComponents } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";

// Policy for eslint-plugin-unicorn.
const unicornRules: Rules = {
  ...enableAllRules("unicorn", pluginUnicorn.rules ?? {}, {
    exclude: ["consistent-arrow-return-style"],
    language: "js/js",
  }),

  "unicorn/filename-case": [
    "error",
    {
      cases: {
        kebabCase: true,
        pascalCase: true,
      },
      // @ts-expect-error -- The schema accepts RegExp objects, but the generated type allows only plain objects
      ignore: [/^\d+_/v], // Migration files like 001_init.js
    },
  ],
  "unicorn/name-replacements": [
    "error",
    {
      allowList: {
        // Common framework/library identifiers that are intentional abbreviations
        i18n: true,
        i18nKey: true,

        // TypeScript
        tsconfigRootDir: true,
      },
      ignore: [
        // Allow spec/test file patterns
        String.raw`\.spec$`,
        String.raw`\.test$`,

        // Allow e2e test file suffixes
        String.raw`\.e2e$`,
      ],
      replacements: {
        // Near universal convention
        e: {
          error: true,
          event: false,
        },
        fn: { function: false },

        // First-class React concept
        ref: false,

        // Framework standard and APIs (Express, Hono, etc.)
        ctx: false,
        req: false,
        res: false,
      },
    },
  ],
  "unicorn/string-content": [
    "error",
    {
      patterns: {
        /*eslint-disable unicorn/string-content -- Disable to allow defining the search patterns themselves*/
        "\\.\\.\\.": "…", // Ellipsis: prefer the real Unicode character
        "<-": "←", // Left arrow: prefer Unicode
        "->": "→", // Right arrow: prefer Unicode
        /*eslint-enable unicorn/string-content -- Disable to allow defining the search patterns themselves*/
      },
    },
  ],
  "unicorn/template-indent": [
    "error",
    {
      // The defaults without `gql`, `html`, and `/* HTML */`: Prettier formats those templates
      comments: ["indent"],
      tags: ["outdent", "dedent", "sql", "styled"],
    },
  ],

  "unicorn/comment-content": "off", // Avoid enforcing terminology and brand-name wording in comments
  "unicorn/consistent-destructuring": "off", // Prefer freedom with variable accessing patterns
  "unicorn/consistent-json-file-read": "off", // Prefer explicit JSON file reading behavior
  "unicorn/empty-brace-spaces": "off", // Covered by `prettier`
  "unicorn/no-keyword-prefix": "off", // Prefer freedom with keywords / names
  "unicorn/no-nested-ternary": "off", // Prettier removes the parentheses that this rule requires; core `no-nested-ternary` applies instead
  "unicorn/no-unused-properties": "off", // Prefer freedom with properties
  "unicorn/number-literal-case": "off", // Covered by `prettier`
  "unicorn/require-post-message-target-origin": "off", // It can't distinguish between window.postMessage() and other calls like Worker#postMessage(), MessagePort#postMessage(), Client#postMessage(), and BroadcastChannel#postMessage()
  "unicorn/try-complexity": "off", // Core complexity rules already provide a less restrictive complexity policy
} as const;

// Builds the flat config for eslint-plugin-unicorn.
function unicorn(
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/unicorn/setup",
      plugins: { unicorn: pluginUnicorn },
    },
    {
      files: [
        ...(files ?? withSvelteComponents(sourceFiles, svelteComponents)),
      ],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/unicorn/rules",
      rules: { ...unicornRules, ...overrides },
    },
  ];
}

export { unicorn, unicornRules };
