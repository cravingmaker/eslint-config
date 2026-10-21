import type { Rules } from "../../../../types.js";

// Stylistic Issues: https://ota-meshi.github.io/eslint-plugin-regexp/rules/.
const recommendedRules: Rules = {
  // --- Rules with default options (10/11) ---------------------------------------------------------------------------------------------------------.
  // eslint-disable-next-line unicorn/prefer-string-raw -- This schema option requires a string literal type.
  "regexp/match-any": ["error", { allows: ["[\\s\\S]", "dotAll"] }], // Automatically fixable by the --fix command.
  // Complemented by `no-useless-escape` for string, template, and additional regex-literal checks.
  "regexp/no-useless-escape": "error", // Automatically fixable by the --fix command.
  "regexp/no-useless-non-capturing-group": ["error", { allowTop: "partial" }], // Automatically fixable by the --fix command.
  "regexp/prefer-d": ["error", { insideCharacterClass: "ignore" }], // Automatically fixable by the --fix command.
  "regexp/prefer-plus-quantifier": "error", // Automatically fixable by the --fix command.
  "regexp/prefer-question-quantifier": "error", // Automatically fixable by the --fix command.
  "regexp/prefer-star-quantifier": "error", // Automatically fixable by the --fix command.
  "regexp/prefer-unicode-codepoint-escapes": "error", // Automatically fixable by the --fix command.
  "regexp/prefer-w": "error", // Automatically fixable by the --fix command.
  "regexp/sort-flags": "error", // Automatically fixable by the --fix command.

  // --- Rules with overridden options (1/11) -------------------------------------------------------------------------------------------------------.
  "regexp/prefer-character-class": ["error", { minAlternatives: 2 }], // Automatically fixable by the --fix command.
} as const;

const otherRules: Rules = {
  // --- Rules with default options (9/11) ----------------------------------------------------------------------------------------------------------.
  "regexp/grapheme-string-literal": "error",
  "regexp/letter-case": [
    "error",
    {
      caseInsensitive: "lowercase",
      controlEscape: "uppercase",
      hexadecimalEscape: "lowercase",
      unicodeEscape: "lowercase",
    },
  ], // Automatically fixable by the --fix command.
  "regexp/prefer-lookaround": [
    "error",
    { lookbehind: true, strictTypes: true },
  ], // Automatically fixable by the --fix command.
  "regexp/prefer-named-backreference": "error", // Automatically fixable by the --fix command.
  "regexp/prefer-named-replacement": ["error", { strictTypes: true }], // Automatically fixable by the --fix command.
  "regexp/prefer-result-array-groups": ["error", { strictTypes: true }], // Automatically fixable by the --fix command.
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
  ], // Automatically fixable by the --fix command.
  "regexp/unicode-escape": ["error", "unicodeCodePointEscape"], // Automatically fixable by the --fix command.
  "regexp/unicode-property": [
    "error",
    {
      generalCategory: "never",
      key: "long",
      property: "long",
    },
  ], // Automatically fixable by the --fix command.

  // --- Rules with overridden options (1/11) -------------------------------------------------------------------------------------------------------.
  "regexp/hexadecimal-escape": ["error", "never"], // Automatically fixable by the --fix command.

  // --- Turned off rules (1/11) --------------------------------------------------------------------------------------------------------------------.
  "regexp/prefer-named-capture-group": "off", // Handled by `prefer-named-capture-group`.
} as const;

const stylisticIssuesRules: Rules = {
  ...recommendedRules, // 11/22 rules, 11 automatically fixable, 0 editor suggestions fixable.
  ...otherRules, // 11/22 rules, 9 automatically fixable, 0 editor suggestions fixable.
} as const;

export { stylisticIssuesRules };
