import type { Rules } from "../../../types.js";

// Stylistic Issues: https://ota-meshi.github.io/eslint-plugin-regexp/rules/
const recommendedRules: Rules = {
  // Enabled rules.
  // eslint-disable-next-line unicorn/prefer-string-raw -- This schema option requires a string literal type.
  "regexp/match-any": ["error", { allows: ["[\\s\\S]", "dotAll"] }],
  "regexp/no-useless-escape": "error",
  "regexp/no-useless-non-capturing-group": ["error", { allowTop: "partial" }],
  "regexp/prefer-character-class": ["error", { minAlternatives: 2 }],
  "regexp/prefer-d": ["error", { insideCharacterClass: "ignore" }],
  "regexp/prefer-plus-quantifier": "error",
  "regexp/prefer-question-quantifier": "error",
  "regexp/prefer-star-quantifier": "error",
  "regexp/prefer-unicode-codepoint-escapes": "error",
  "regexp/prefer-w": "error",
  "regexp/sort-flags": "error",
} as const;

const otherRules: Rules = {
  // Enabled rules.
  "regexp/grapheme-string-literal": "error",
  "regexp/hexadecimal-escape": ["error", "never"],
  "regexp/letter-case": [
    "error",
    {
      caseInsensitive: "lowercase",
      controlEscape: "uppercase",
      hexadecimalEscape: "lowercase",
      unicodeEscape: "lowercase",
    },
  ],
  "regexp/prefer-lookaround": [
    "error",
    { lookbehind: true, strictTypes: true },
  ],
  "regexp/prefer-named-backreference": "error",
  "regexp/prefer-named-replacement": ["error", { strictTypes: true }],
  "regexp/prefer-result-array-groups": ["error", { strictTypes: true }],
  "regexp/sort-character-class-elements": [
    "error",
    {
      order: [
        // eslint-disable-next-line unicorn/prefer-string-raw -- This schema option requires a string literal type.
        "\\s",
        // eslint-disable-next-line unicorn/prefer-string-raw -- This schema option requires a string literal type.
        "\\w",
        // eslint-disable-next-line unicorn/prefer-string-raw -- This schema option requires a string literal type.
        "\\d",
        // eslint-disable-next-line unicorn/prefer-string-raw -- This schema option requires a string literal type.
        "\\p",
        "*",
        // eslint-disable-next-line unicorn/prefer-string-raw -- This schema option requires a string literal type.
        "\\q",
        "[]",
      ],
    },
  ],
  "regexp/unicode-escape": ["error", "unicodeCodePointEscape"],
  "regexp/unicode-property": [
    "error",
    {
      generalCategory: "never",
      key: "long",
      property: "long",
    },
  ],

  // Turned off rules.
  "regexp/prefer-named-capture-group": "off", // Handled by `prefer-named-capture-group`.
} as const;

const stylisticIssuesRules: Rules = {
  ...recommendedRules,
  ...otherRules,
} as const;

export { stylisticIssuesRules };
