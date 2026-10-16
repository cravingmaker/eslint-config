import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import pluginRegexp from "eslint-plugin-regexp";

import { defaultContext } from "../context.js";
import { sourceFiles, withSvelteComponents } from "../globs.js";
import { narrowFiles } from "../utilities/file-scope.js";

// Policy for eslint-plugin-regexp. Unset character ranges inherit settings.regexp.
const regexpRules: Rules = {
  "regexp/confusing-quantifier": "error",
  "regexp/control-character-escape": "error",
  "regexp/grapheme-string-literal": "error",
  "regexp/letter-case": [
    "error",
    {
      caseInsensitive: "lowercase",
      controlEscape: "uppercase",
      hexadecimalEscape: "lowercase",
      unicodeEscape: "lowercase",
    },
  ],
  // eslint-disable-next-line unicorn/prefer-string-raw -- This schema option requires a string literal type.
  "regexp/match-any": ["error", { allows: ["[\\s\\S]", "dotAll"] }],
  "regexp/negation": "error",
  "regexp/no-contradiction-with-assertion": "error",
  "regexp/no-control-character": "error",
  "regexp/no-dupe-characters-character-class": "error",
  "regexp/no-dupe-disjunctions": [
    "error",
    {
      report: "trivial",
      reportExponentialBacktracking: "potential",
      reportUnreachable: "certain",
    },
  ],
  "regexp/no-empty-alternative": "error",
  "regexp/no-empty-capturing-group": "error",
  "regexp/no-empty-character-class": "error",
  "regexp/no-empty-group": "error",
  "regexp/no-empty-lookarounds-assertion": "error",
  "regexp/no-empty-string-literal": "error",
  "regexp/no-escape-backspace": "error",
  "regexp/no-extra-lookaround-assertions": "error",
  "regexp/no-invalid-regexp": "error",
  "regexp/no-invisible-character": "error",
  "regexp/no-lazy-ends": ["error", { ignorePartial: true }],
  "regexp/no-legacy-features": [
    "error",
    {
      prototypeMethods: ["compile"],
      staticProperties: [
        "input",
        "$_",
        "lastMatch",
        "$&",
        "lastParen",
        "$+",
        "leftContext",
        "$`",
        "rightContext",
        "$'",
        "$1",
        "$2",
        "$3",
        "$4",
        "$5",
        "$6",
        "$7",
        "$8",
        "$9",
      ],
    },
  ],
  "regexp/no-misleading-capturing-group": [
    "error",
    { reportBacktrackingEnds: true },
  ],
  "regexp/no-misleading-unicode-character": ["error", { fixable: false }],
  "regexp/no-missing-g-flag": ["error", { strictTypes: true }],
  "regexp/no-non-standard-flag": "error",
  "regexp/no-obscure-range": ["error", { allowed: undefined }],
  "regexp/no-octal": "error",
  "regexp/no-optional-assertion": "error",
  "regexp/no-potentially-useless-backreference": "error",
  "regexp/no-standalone-backslash": "error",
  "regexp/no-super-linear-backtracking": ["error", { report: "certain" }],
  "regexp/no-super-linear-move": [
    "error",
    { ignorePartial: true, ignoreSticky: true, report: "certain" },
  ],
  "regexp/no-trivially-nested-assertion": "error",
  "regexp/no-trivially-nested-quantifier": "error",
  "regexp/no-unused-capturing-group": [
    "error",
    { allowNamed: false, fixable: false },
  ],
  "regexp/no-useless-assertions": "error",
  "regexp/no-useless-backreference": "error",
  "regexp/no-useless-character-class": ["error", { ignores: ["="] }],
  "regexp/no-useless-dollar-replacements": "error",
  "regexp/no-useless-escape": "error",
  "regexp/no-useless-flag": ["error", { ignore: [], strictTypes: true }],
  "regexp/no-useless-lazy": "error",
  "regexp/no-useless-non-capturing-group": ["error", { allowTop: "partial" }],
  "regexp/no-useless-quantifier": "error",
  "regexp/no-useless-range": "error",
  "regexp/no-useless-set-operand": "error",
  "regexp/no-useless-string-literal": "error",
  "regexp/no-useless-two-nums-quantifier": "error",
  "regexp/no-zero-quantifier": "error",
  "regexp/optimal-lookaround-quantifier": "error",
  "regexp/optimal-quantifier-concatenation": [
    "error",
    { capturingGroups: "report" },
  ],
  "regexp/prefer-d": ["error", { insideCharacterClass: "ignore" }],
  "regexp/prefer-lookaround": [
    "error",
    { lookbehind: true, strictTypes: true },
  ],
  "regexp/prefer-named-backreference": "error",
  "regexp/prefer-named-capture-group": "error",
  "regexp/prefer-named-replacement": ["error", { strictTypes: true }],
  "regexp/prefer-plus-quantifier": "error",
  "regexp/prefer-predefined-assertion": "error",
  "regexp/prefer-quantifier": ["error", { allows: [] }],
  "regexp/prefer-question-quantifier": "error",
  "regexp/prefer-range": ["error", { target: undefined }],
  "regexp/prefer-regexp-exec": "error",
  "regexp/prefer-regexp-test": "error",
  "regexp/prefer-result-array-groups": ["error", { strictTypes: true }],
  "regexp/prefer-set-operation": "error",
  "regexp/prefer-star-quantifier": "error",
  "regexp/prefer-unicode-codepoint-escapes": "error",
  "regexp/prefer-w": "error",
  "regexp/simplify-set-operations": "error",
  "regexp/sort-alternatives": "error",
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
  "regexp/sort-flags": "error",
  "regexp/strict": "error",
  "regexp/unicode-escape": ["error", "unicodeCodePointEscape"],
  "regexp/use-ignore-case": "error",

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
function regexp(
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/regexp/setup",
      plugins: { regexp: pluginRegexp },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/regexp/rules",
      rules: { ...regexpRules, ...overrides },
    },
  ];
}

export { regexp };
