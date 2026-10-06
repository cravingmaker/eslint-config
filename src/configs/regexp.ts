import type { Linter } from "eslint";
import type { FeatureOptions, Rules } from "../types.js";

import pluginRegexp from "eslint-plugin-regexp";

import { javascriptFiles } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";

// Policy for eslint-plugin-regexp.
const regexpRules: Rules = {
  ...enableAllRules("regexp", pluginRegexp.rules),

  "regexp/hexadecimal-escape": ["error", "never"],
  "regexp/prefer-character-class": ["error", { minAlternatives: 2 }],
  "regexp/unicode-property": [
    "error",
    {
      generalCategory: "never",
      key: "long",
      property: "long",
    },
  ],

  "regexp/prefer-escape-replacement-dollar-char": "off", // Prefer WYSIWYG style
  "regexp/require-unicode-regexp": "off", // Prefer freedom with unicode regexes
  "regexp/require-unicode-sets-regexp": "off", // Prefer freedom with unicode sets regexes
} as const;

// Builds the flat config for eslint-plugin-regexp.
function regexp({
  files = javascriptFiles,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/regexp/setup",
      plugins: { regexp: pluginRegexp },
    },
    {
      files: [...files],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/regexp/rules",
      rules: { ...regexpRules, ...overrides },
    },
  ];
}

export { regexp, regexpRules };
