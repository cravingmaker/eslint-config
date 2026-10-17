import type { Rules } from "../../types.js";

import {
  classMethodsUseThisOptions,
  dotNotationOptions,
  // eslint-disable-next-line unicorn/name-replacements -- This mirrors the ESLint `max-params` rule name
  maxParamsOptions,
  namingConventionOptions,
  noEmptyFunctionOptions,
  noShadowOptions,
  noUnusedExpressionsOptions,
  noUseBeforeDefineOptions,
  preferDestructuring1stOptions,
  preferDestructuring2ndOptions,
  preferPromiseRejectErrorsOptions,
} from "../shared-options.js";

// Core rules that the TypeScript compiler already checks in TypeScript files.
const compilerCheckedRules: Rules = {
  "constructor-super": "off", // Ts(2335) & ts(2377)
  "getter-return": "off", // Ts(2378)
  "no-class-assign": "off", // Ts(2629)
  "no-const-assign": "off", // Ts(2588)
  "no-dupe-args": "off", // Ts(2300)
  "no-dupe-class-members": "off", // Ts(2393) & ts(2300)
  "no-dupe-keys": "off", // Ts(1117)
  "no-func-assign": "off", // Ts(2630)
  "no-import-assign": "off", // Ts(2632) & ts(2540)
  "no-new-native-nonconstructor": "off", // Ts(7009)
  "no-obj-calls": "off", // Ts(2349)
  "no-redeclare": "off", // Ts(2451)
  "no-setter-return": "off", // Ts(2408)
  "no-this-before-super": "off", // Ts(2376) & ts(17009)
  "no-undef": "off", // Ts(2304) & ts(2552)
  "no-unreachable": "off", // Ts(7027)
  "no-unsafe-negation": "off", // Ts(2365) & ts(2322) & ts(2358)
  "no-with": "off", // Ts(1101) & ts(2410)
} as const;

// Core rules replaced by typescript-eslint extension rules that work without type information.
const replacementRules: Rules = {
  "no-array-constructor": "off", // Handled by `@typescript-eslint/no-array-constructor`.
  "@typescript-eslint/no-array-constructor": "error",

  "no-unused-expressions": "off", // Handled by `@typescript-eslint/no-unused-expressions`.
  "@typescript-eslint/no-unused-expressions": [
    "error",
    { ...noUnusedExpressionsOptions },
  ],

  "no-unused-vars": "off", // Handled by `unused-imports/no-unused-vars`.
  "@typescript-eslint/no-unused-vars": "off", // Handled by `unused-imports/no-unused-vars`.

  "no-empty-function": "off", // Handled by `@typescript-eslint/no-empty-function`.
  "@typescript-eslint/no-empty-function": [
    "error",
    { ...noEmptyFunctionOptions },
  ],

  "no-useless-constructor": "off", // Handled by `@typescript-eslint/no-useless-constructor`.
  "@typescript-eslint/no-useless-constructor": "error",

  "no-unused-private-class-members": "off", // Handled by `@typescript-eslint/no-unused-private-class-members`.
  "@typescript-eslint/no-unused-private-class-members": "error",

  "class-methods-use-this": "off", // Handled by `@typescript-eslint/class-methods-use-this`.
  "@typescript-eslint/class-methods-use-this": [
    "error",
    {
      ...classMethodsUseThisOptions,
      ignoreClassesThatImplementAnInterface: "public-fields",
      ignoreOverrideMethods: true,
    },
  ],

  "default-param-last": "off", // Handled by `@typescript-eslint/default-param-last`.
  "@typescript-eslint/default-param-last": "error",

  "no-use-before-define": "off", // Handled by `@typescript-eslint/no-use-before-define`.
  "@typescript-eslint/no-use-before-define": [
    "error",
    {
      ...noUseBeforeDefineOptions,
      functions: false,
      typedefs: true,
    },
  ],

  "max-params": "off", // Handled by `@typescript-eslint/max-params`.
  "@typescript-eslint/max-params": [
    "error",
    {
      maximum: undefined,

      ...maxParamsOptions,
      countVoidThis: false,
    },
  ],

  "no-shadow": "off", // Handled by `@typescript-eslint/no-shadow`.
  "@typescript-eslint/no-shadow": [
    "error",
    {
      ...noShadowOptions,
      hoist: "functions-and-types",
    },
  ],
} as const;

// Core rules replaced by typescript-eslint extension rules that need type information.
const typeAwareReplacementRules: Rules = {
  "no-implied-eval": "off", // Handled by `@typescript-eslint/no-implied-eval`.
  "@typescript-eslint/no-implied-eval": "error",

  "prefer-promise-reject-errors": "off", // Handled by `@typescript-eslint/prefer-promise-reject-errors`.
  "@typescript-eslint/prefer-promise-reject-errors": [
    "error",
    {
      ...preferPromiseRejectErrorsOptions,
      allow: [],
      allowThrowingAny: false,
      allowThrowingUnknown: false,
    },
  ],

  "require-await": "off", // Handled by `@typescript-eslint/require-await`.
  "@typescript-eslint/require-await": "error",

  "no-throw-literal": "off", // Handled by `@typescript-eslint/only-throw-error`.
  "@typescript-eslint/only-throw-error": [
    "error",
    {
      allow: [],
      allowRethrowing: true,
      allowThrowingAny: false,
      allowThrowingUnknown: false,
    },
  ],

  "dot-notation": "off", // Handled by `@typescript-eslint/dot-notation`.
  "@typescript-eslint/dot-notation": [
    "error",
    {
      allowPattern: "",

      ...dotNotationOptions,
      allowIndexSignaturePropertyAccess: false,
      allowPrivateClassPropertyAccess: false,
      allowProtectedClassPropertyAccess: false,
    },
  ],

  "no-return-await": "off", // Handled by `@typescript-eslint/return-await`.
  "@typescript-eslint/return-await": ["error", "always"],

  camelcase: "off", // Handled by `@typescript-eslint/naming-convention`.
  "@typescript-eslint/naming-convention": ["error", ...namingConventionOptions],

  "prefer-destructuring": "off", // Handled by `@typescript-eslint/prefer-destructuring`.
  "@typescript-eslint/prefer-destructuring": [
    "error",
    { ...preferDestructuring1stOptions },
    {
      ...preferDestructuring2ndOptions,
      enforceForDeclarationWithTypeAnnotation: false,
    },
  ],
} as const;

export { compilerCheckedRules, replacementRules, typeAwareReplacementRules };
