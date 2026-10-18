import type { Rules } from "../../../types.js";

import {
  classMethodsUseThisOptions,
  dotNotationOptions,
  // eslint-disable-next-line unicorn/name-replacements -- This mirrors the ESLint `max-params` rule name.
  maxParamsOptions,
  namingConventionOptions,
  noEmptyFunctionOptions,
  noShadowOptions,
  noUnusedExpressionsOptions,
  noUseBeforeDefineOptions,
  preferDestructuring1stOptions,
  preferDestructuring2ndOptions,
  preferPromiseRejectErrorsOptions,
} from "../../shared-options.js";

// Core rules that the TypeScript compiler already checks in TypeScript files.
const compilerCheckedRules: Rules = {
  // --- Turned off rules (18/18) -------------------------------------------------------------------------------------------------------------------.
  "constructor-super": "off", // Handled by the TypeScript compiler (`ts(2335)` & `ts(2377)`).
  "getter-return": "off", // Handled by the TypeScript compiler (`ts(2378)`).
  "no-class-assign": "off", // Handled by the TypeScript compiler (`ts(2629)`).
  "no-const-assign": "off", // Handled by the TypeScript compiler (`ts(2588)`).
  "no-dupe-args": "off", // Handled by the TypeScript compiler (`ts(2300)`).
  "no-dupe-class-members": "off", // Handled by the TypeScript compiler (`ts(2393)` & `ts(2300)`).
  "no-dupe-keys": "off", // Handled by the TypeScript compiler (`ts(1117)`).
  "no-func-assign": "off", // Handled by the TypeScript compiler (`ts(2630)`).
  "no-import-assign": "off", // Handled by the TypeScript compiler (`ts(2632)` & `ts(2540)`).
  "no-new-native-nonconstructor": "off", // Handled by the TypeScript compiler (`ts(7009)`).
  "no-obj-calls": "off", // Handled by the TypeScript compiler (`ts(2349)`).
  "no-redeclare": "off", // Handled by the TypeScript compiler (`ts(2451)`).
  "no-setter-return": "off", // Handled by the TypeScript compiler (`ts(2408)`).
  "no-this-before-super": "off", // Handled by the TypeScript compiler (`ts(2376)` & `ts(17009)`).
  "no-undef": "off", // Handled by the TypeScript compiler (`ts(2304)` & `ts(2552)`).
  "no-unreachable": "off", // Handled by the TypeScript compiler (`ts(7027)`).
  "no-unsafe-negation": "off", // Handled by the TypeScript compiler (`ts(2365)` & `ts(2322)` & `ts(2358)`). Manually fixable by editor suggestions.
  "no-with": "off", // Handled by the TypeScript compiler (`ts(1101)` & `ts(2410)`).
} as const;

// Core rules replaced by typescript-eslint extension rules that work without type information.
const replacementRules: Rules = {
  // --- Rules with default options (6/22) ----------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/default-param-last": "error",
  "@typescript-eslint/no-array-constructor": "error", // Automatically fixable by the --fix command.
  "@typescript-eslint/no-empty-function": [
    "error",
    { ...noEmptyFunctionOptions },
  ], // Manually fixable by editor suggestions.
  "@typescript-eslint/no-shadow": [
    "error",
    {
      ...noShadowOptions,
      hoist: "functions-and-types",
    },
  ],
  "@typescript-eslint/no-unused-private-class-members": "error",
  "@typescript-eslint/no-useless-constructor": "error", // Manually fixable by editor suggestions.

  // --- Rules with overridden options (4/22) -------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/class-methods-use-this": [
    "error",
    {
      ...classMethodsUseThisOptions,
      ignoreClassesThatImplementAnInterface: "public-fields",
      ignoreOverrideMethods: true,
    },
  ],
  "@typescript-eslint/max-params": [
    "error",
    {
      maximum: undefined,

      ...maxParamsOptions,
      countVoidThis: false,
    },
  ],
  "@typescript-eslint/no-unused-expressions": [
    "error",
    { ...noUnusedExpressionsOptions },
  ],
  "@typescript-eslint/no-use-before-define": [
    "error",
    {
      ...noUseBeforeDefineOptions,
      functions: false,
      typedefs: true,
    },
  ],

  // --- Turned off rules (12/22) -------------------------------------------------------------------------------------------------------------------.
  "class-methods-use-this": "off", // Handled by `@typescript-eslint/class-methods-use-this`.
  "default-param-last": "off", // Handled by `@typescript-eslint/default-param-last`.
  "max-params": "off", // Handled by `@typescript-eslint/max-params`.
  "no-array-constructor": "off", // Handled by `@typescript-eslint/no-array-constructor`. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "no-empty-function": "off", // Handled by `@typescript-eslint/no-empty-function`. Manually fixable by editor suggestions.
  "no-shadow": "off", // Handled by `@typescript-eslint/no-shadow`.
  "no-unused-expressions": "off", // Handled by `@typescript-eslint/no-unused-expressions`.
  "no-unused-private-class-members": "off", // Handled by `@typescript-eslint/no-unused-private-class-members`. Manually fixable by editor suggestions.
  "no-unused-vars": "off", // Handled by `unused-imports/no-unused-vars`. Manually fixable by editor suggestions.
  "no-use-before-define": "off", // Handled by `@typescript-eslint/no-use-before-define`.
  "no-useless-constructor": "off", // Handled by `@typescript-eslint/no-useless-constructor`. Manually fixable by editor suggestions.
  "@typescript-eslint/no-unused-vars": "off", // Handled by `unused-imports/no-unused-vars`. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
} as const;

// Core rules replaced by typescript-eslint extension rules that need type information.
const typeAwareReplacementRules: Rules = {
  // --- Rules with default options (4/16) ----------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/dot-notation": [
    "error",
    {
      allowPattern: "",

      ...dotNotationOptions,
      allowIndexSignaturePropertyAccess: false,
      allowPrivateClassPropertyAccess: false,
      allowProtectedClassPropertyAccess: false,
    },
  ], // Automatically fixable by the --fix command.
  "@typescript-eslint/no-implied-eval": "error",
  "@typescript-eslint/prefer-promise-reject-errors": [
    "error",
    {
      ...preferPromiseRejectErrorsOptions,
      allow: [],
      allowThrowingAny: false,
      allowThrowingUnknown: false,
    },
  ],
  "@typescript-eslint/require-await": "error", // Manually fixable by editor suggestions.

  // --- Rules with overridden options (4/16) -------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/naming-convention": ["error", ...namingConventionOptions],
  "@typescript-eslint/only-throw-error": [
    "error",
    {
      allow: [],
      allowRethrowing: true,
      allowThrowingAny: false,
      allowThrowingUnknown: false,
    },
  ],
  "@typescript-eslint/prefer-destructuring": [
    "error",
    { ...preferDestructuring1stOptions },
    {
      ...preferDestructuring2ndOptions,
      enforceForDeclarationWithTypeAnnotation: false,
    },
  ], // Automatically fixable by the --fix command.
  "@typescript-eslint/return-await": ["error", "always"], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.

  // --- Turned off rules (8/16) --------------------------------------------------------------------------------------------------------------------.
  camelcase: "off", // Handled by `@typescript-eslint/naming-convention`.
  "dot-notation": "off", // Handled by `@typescript-eslint/dot-notation`. Automatically fixable by the --fix command.
  "no-implied-eval": "off", // Handled by `@typescript-eslint/no-implied-eval`.
  "no-return-await": "off", // Handled by `@typescript-eslint/return-await`. Manually fixable by editor suggestions.
  "no-throw-literal": "off", // Handled by `@typescript-eslint/only-throw-error`.
  "prefer-destructuring": "off", // Handled by `@typescript-eslint/prefer-destructuring`. Automatically fixable by the --fix command.
  "prefer-promise-reject-errors": "off", // Handled by `@typescript-eslint/prefer-promise-reject-errors`.
  "require-await": "off", // Handled by `@typescript-eslint/require-await`. Manually fixable by editor suggestions.
} as const;

export {
  compilerCheckedRules, // 18 rules, 0 automatically fixable, 1 editor suggestions fixable.
  replacementRules, // 22 rules, 3 automatically fixable, 8 editor suggestions fixable.
  typeAwareReplacementRules, // 16 rules, 5 automatically fixable, 4 editor suggestions fixable.
};
