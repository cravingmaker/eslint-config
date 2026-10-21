import type { Rules } from "../../../types.js";

import { noUseBeforeDefineOptions } from "../../shared-options.js";

const recommendedRules: Rules = {
  // --- Rules with default options (37/47) ---------------------------------------------------------------------------------------------------------.
  "constructor-super": "error",
  "for-direction": "error",
  "no-async-promise-executor": "error",
  "no-class-assign": "error",
  "no-compare-neg-zero": "error", // Manually fixable by editor suggestions.
  "no-cond-assign": ["error", "except-parens"],
  "no-const-assign": "error",
  "no-constant-binary-expression": [
    "error",
    { checkRelationalComparisons: false },
  ],
  "no-constant-condition": ["error", { checkLoops: "allExceptWhileTrue" }],
  "no-debugger": "error",
  "no-dupe-args": "error",
  "no-dupe-class-members": "error",
  "no-dupe-else-if": "error",
  "no-dupe-keys": "error",
  "no-duplicate-case": "error",
  "no-empty-pattern": ["error", { allowObjectPatternsAsParameters: false }],
  "no-ex-assign": "error",
  "no-fallthrough": [
    "error",
    {
      allowEmptyCase: false,
      commentPattern: undefined,
      reportUnusedFallthroughComment: false,
    },
  ],
  "no-func-assign": "error",
  "no-import-assign": "error",
  "no-irregular-whitespace": [
    "error",
    {
      skipComments: false,
      skipJSXText: false,
      skipRegExps: false,
      skipStrings: true,
      skipTemplates: false,
    },
  ],
  "no-loss-of-precision": "error",
  "no-misleading-character-class": ["error", { allowEscape: false }], // Manually fixable by editor suggestions.
  "no-new-native-nonconstructor": "error",
  "no-obj-calls": "error",
  "no-prototype-builtins": "error", // Manually fixable by editor suggestions.
  "no-self-assign": ["error", { props: true }],
  "no-setter-return": "error",
  "no-sparse-arrays": "error",
  "no-this-before-super": "error",
  "no-unassigned-vars": "error",
  "no-unreachable": "error",
  "no-unsafe-finally": "error",
  "no-unused-private-class-members": "error", // Manually fixable by editor suggestions.
  "no-useless-assignment": "error",
  "use-isnan": [
    "error",
    {
      enforceForIndexOf: false,
      enforceForSwitchCase: true,
    },
  ], // Manually fixable by editor suggestions.
  "valid-typeof": ["error", { requireStringLiterals: false }], // Manually fixable by editor suggestions.

  // --- Rules with overridden options (4/47) -------------------------------------------------------------------------------------------------------.
  "getter-return": [
    "error",
    {
      allowImplicit: true, // See `unicorn/no-useless-undefined`.
    },
  ],
  "no-undef": ["error", { typeof: true }],
  "no-unsafe-negation": ["error", { enforceForOrderingRelations: true }], // Manually fixable by editor suggestions.
  "no-unsafe-optional-chaining": [
    "error",
    { disallowArithmeticOperators: true },
  ],

  // --- Turned off rules (6/47) --------------------------------------------------------------------------------------------------------------------.
  "no-control-regex": "off", // Handled by `regexp/no-control-character`; intentional constructor control escapes are allowed.
  "no-empty-character-class": "off", // Handled by `regexp/no-empty-character-class`.
  "no-invalid-regexp": "off", // Handled by `regexp/no-invalid-regexp`.
  "no-unexpected-multiline": "off", // Handled by `prettier`.
  "no-unused-vars": ["off"], // Handled by `unused-imports/no-unused-vars`. Manually fixable by editor suggestions.
  "no-useless-backreference": "off", // Handled by `regexp/no-useless-backreference`.
} as const;

const otherRules: Rules = {
  // --- Rules with default options (10/12) ---------------------------------------------------------------------------------------------------------.
  "no-await-in-loop": "error",
  "no-constructor-return": "error",
  "no-inner-declarations": [
    "error",
    "functions",
    { blockScopedFunctions: "allow" },
  ],
  "no-promise-executor-return": ["error", { allowVoid: false }], // Manually fixable by editor suggestions.
  "no-self-compare": "error",
  "no-template-curly-in-string": "error",
  "no-unmodified-loop-condition": [
    "error",
    { checkConditionalExpressions: false },
  ],
  "no-unreachable-loop": ["error", { ignore: [] }],
  "no-use-before-define": ["error", { ...noUseBeforeDefineOptions }],
  "require-atomic-updates": ["error", { allowProperties: false }],

  // --- Rules with overridden options (1/12) -------------------------------------------------------------------------------------------------------.
  "array-callback-return": [
    "error",
    {
      allowImplicit: true, // See `unicorn/no-useless-undefined`.
      allowVoid: false,
      checkForEach: false,
    },
  ], // Manually fixable by editor suggestions.

  // --- Turned off rules (1/12) --------------------------------------------------------------------------------------------------------------------.
  "no-duplicate-imports": "off", // Handled by `import-x/no-duplicates`.
} as const;

const possibleProblemRules: Rules = {
  ...recommendedRules, // 47/59 rules, 0 automatically fixable, 8 editor suggestions fixable.
  ...otherRules, // 12/59 rules, 0 automatically fixable, 2 editor suggestions fixable.
} as const;

export { possibleProblemRules };
