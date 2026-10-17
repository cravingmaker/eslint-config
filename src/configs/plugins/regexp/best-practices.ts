import type { Rules } from "../../../types.js";

// Best Practices: https://ota-meshi.github.io/eslint-plugin-regexp/rules/
const recommendedRules: Rules = {
  // Enabled rules.
  "regexp/confusing-quantifier": "error",
  "regexp/control-character-escape": "error",
  "regexp/negation": "error",
  "regexp/no-dupe-characters-character-class": "error",
  "regexp/no-empty-string-literal": "error",
  "regexp/no-extra-lookaround-assertions": "error",
  "regexp/no-invisible-character": "error",
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
  "regexp/no-non-standard-flag": "error",
  "regexp/no-obscure-range": ["error", { allowed: undefined }],
  "regexp/no-trivially-nested-assertion": "error",
  "regexp/no-trivially-nested-quantifier": "error",
  "regexp/no-unused-capturing-group": [
    "error",
    { allowNamed: false, fixable: false },
  ],
  "regexp/no-useless-character-class": ["error", { ignores: ["="] }],
  "regexp/no-useless-flag": ["error", { ignore: [], strictTypes: true }],
  "regexp/no-useless-lazy": "error",
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
  "regexp/prefer-predefined-assertion": "error",
  "regexp/prefer-range": ["error", { target: undefined }],
  "regexp/prefer-set-operation": "error",
  "regexp/simplify-set-operations": "error",
  "regexp/use-ignore-case": "error",
} as const;

const otherRules: Rules = {
  // Enabled rules.
  "regexp/no-octal": "error",
  "regexp/no-standalone-backslash": "error",
  "regexp/prefer-quantifier": ["error", { allows: [] }],
  "regexp/prefer-regexp-exec": "error",
  "regexp/prefer-regexp-test": "error",
  "regexp/sort-alternatives": "error",

  // Turned off rules.
  "regexp/prefer-escape-replacement-dollar-char": "off", // Prefer WYSIWYG style
  "regexp/require-unicode-regexp": "off", // Prefer freedom with unicode regexes
  "regexp/require-unicode-sets-regexp": "off", // Prefer freedom with unicode sets regexes
} as const;

const bestPracticesRules: Rules = {
  ...recommendedRules,
  ...otherRules,
} as const;

export { bestPracticesRules };
