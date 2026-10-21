import type { Rules } from "../../../../types.js";

// Best Practices: https://ota-meshi.github.io/eslint-plugin-regexp/rules/.
const recommendedRules: Rules = {
  // --- Rules with default options (29/29) ---------------------------------------------------------------------------------------------------------.
  "regexp/confusing-quantifier": "error",
  "regexp/control-character-escape": "error", // Automatically fixable by the --fix command.
  "regexp/negation": "error", // Automatically fixable by the --fix command.
  "regexp/no-dupe-characters-character-class": "error", // Automatically fixable by the --fix command.
  "regexp/no-empty-string-literal": "error",
  "regexp/no-extra-lookaround-assertions": "error", // Automatically fixable by the --fix command.
  "regexp/no-invisible-character": "error", // Automatically fixable by the --fix command.
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
  "regexp/no-trivially-nested-assertion": "error", // Automatically fixable by the --fix command.
  "regexp/no-trivially-nested-quantifier": "error", // Automatically fixable by the --fix command.
  "regexp/no-unused-capturing-group": [
    "error",
    { allowNamed: false, fixable: false },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "regexp/no-useless-character-class": ["error", { ignores: ["="] }], // Automatically fixable by the --fix command.
  "regexp/no-useless-flag": ["error", { ignore: [], strictTypes: true }], // Automatically fixable by the --fix command.
  "regexp/no-useless-lazy": "error", // Automatically fixable by the --fix command.
  "regexp/no-useless-quantifier": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "regexp/no-useless-range": "error", // Automatically fixable by the --fix command.
  "regexp/no-useless-set-operand": "error", // Automatically fixable by the --fix command.
  "regexp/no-useless-string-literal": "error", // Automatically fixable by the --fix command.
  "regexp/no-useless-two-nums-quantifier": "error", // Automatically fixable by the --fix command.
  "regexp/no-zero-quantifier": "error", // Manually fixable by editor suggestions.
  "regexp/optimal-lookaround-quantifier": "error", // Manually fixable by editor suggestions.
  "regexp/optimal-quantifier-concatenation": [
    "error",
    { capturingGroups: "report" },
  ], // Automatically fixable by the --fix command.
  "regexp/prefer-predefined-assertion": "error", // Automatically fixable by the --fix command.
  "regexp/prefer-range": ["error", { target: undefined }], // Automatically fixable by the --fix command.
  "regexp/prefer-set-operation": "error", // Automatically fixable by the --fix command.
  "regexp/simplify-set-operations": "error", // Automatically fixable by the --fix command.
  "regexp/use-ignore-case": "error", // Automatically fixable by the --fix command.
} as const;

const otherRules: Rules = {
  // --- Rules with default options (6/9) -----------------------------------------------------------------------------------------------------------.
  "regexp/no-octal": "error", // Manually fixable by editor suggestions.
  "regexp/no-standalone-backslash": "error",
  "regexp/prefer-quantifier": ["error", { allows: [] }], // Automatically fixable by the --fix command.
  // Unknown flags can cause false positives; preserve global-match semantics during manual fixes.
  "regexp/prefer-regexp-exec": "error",
  "regexp/prefer-regexp-test": "error", // Automatically fixable by the --fix command.
  "regexp/sort-alternatives": "error", // Automatically fixable by the --fix command.

  // --- Turned off rules (3/9) ---------------------------------------------------------------------------------------------------------------------.
  "regexp/prefer-escape-replacement-dollar-char": "off", // Prefer WYSIWYG style.
  "regexp/require-unicode-regexp": "off", // Prefer core `require-unicode-regexp` for reviewed Unicode-mode suggestions. Automatically fixable by the --fix command.
  "regexp/require-unicode-sets-regexp": "off", // Allow either `u` or `v` through core `require-unicode-regexp`. Automatically fixable by the --fix command.
} as const;

const bestPracticesRules: Rules = {
  ...recommendedRules, // 29/38 rules, 22 automatically fixable, 4 editor suggestions fixable.
  ...otherRules, // 9/38 rules, 5 automatically fixable, 1 editor suggestions fixable.
} as const;

export { bestPracticesRules };
