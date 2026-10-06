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
  // eslint-disable-next-line unicorn/name-replacements -- This mirrors the ESLint `no-unused-vars` rule name
  noUnusedVarsOptions,
  noUseBeforeDefineOptions,
  preferDestructuring1stOptions,
  preferDestructuring2ndOptions,
  preferPromiseRejectErrorsOptions,
} from "../shared-options.js";

// Core rules that the TypeScript compiler already checks in TypeScript files.
const compilerCheckedRules: Rules = {
  "constructor-super": "off", // ts(2335) & ts(2377)
  "getter-return": "off", // ts(2378)
  "no-class-assign": "off", // ts(2629)
  "no-const-assign": "off", // ts(2588)
  "no-dupe-args": "off", // ts(2300)
  "no-dupe-class-members": "off", // ts(2393) & ts(2300)
  "no-dupe-keys": "off", // ts(1117)
  "no-func-assign": "off", // ts(2630)
  "no-import-assign": "off", // ts(2632) & ts(2540)
  "no-new-native-nonconstructor": "off", // ts(7009)
  "no-obj-calls": "off", // ts(2349)
  "no-redeclare": "off", // ts(2451)
  "no-setter-return": "off", // ts(2408)
  "no-this-before-super": "off", // ts(2376) & ts(17009)
  "no-undef": "off", // ts(2304) & ts(2552)
  "no-unreachable": "off", // ts(7027)
  "no-unsafe-negation": "off", // ts(2365) & ts(2322) & ts(2358)
  "no-with": "off", // ts(1101) & ts(2410)
} as const;

// Core rules replaced by typescript-eslint extension rules that work without type information.
const replacementRules: Rules = {
  "no-array-constructor": "off",
  "@typescript-eslint/no-array-constructor": "error",

  "no-unused-expressions": "off",
  "@typescript-eslint/no-unused-expressions": [
    "error",
    { ...noUnusedExpressionsOptions },
  ],

  "no-unused-vars": "off",
  "@typescript-eslint/no-unused-vars": ["off", { ...noUnusedVarsOptions }], // Covered by `eslint-plugin-unused-imports/no-unused-vars`

  "no-empty-function": "off",
  "@typescript-eslint/no-empty-function": [
    "error",
    { ...noEmptyFunctionOptions },
  ],

  "no-useless-constructor": "off",
  "@typescript-eslint/no-useless-constructor": "error",

  "no-unused-private-class-members": "off",
  "@typescript-eslint/no-unused-private-class-members": "error",

  "class-methods-use-this": "off",
  "@typescript-eslint/class-methods-use-this": [
    "error",
    {
      ...classMethodsUseThisOptions,
      ignoreClassesThatImplementAnInterface: "public-fields",
      ignoreOverrideMethods: true,
    },
  ],

  "default-param-last": "off",
  "@typescript-eslint/default-param-last": "error",

  "no-use-before-define": "off",
  "@typescript-eslint/no-use-before-define": [
    "error",
    {
      ...noUseBeforeDefineOptions,
      functions: false,
      typedefs: true,
    },
  ],

  "max-params": "off",
  "@typescript-eslint/max-params": [
    "error",
    {
      ...maxParamsOptions,
      countVoidThis: false,
    },
  ],

  "no-shadow": "off",
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
  "no-implied-eval": "off",
  "@typescript-eslint/no-implied-eval": "error",

  "prefer-promise-reject-errors": "off",
  "@typescript-eslint/prefer-promise-reject-errors": [
    "error",
    {
      ...preferPromiseRejectErrorsOptions,
      allow: [],
      allowThrowingAny: false,
      allowThrowingUnknown: false,
    },
  ],

  "require-await": "off",
  "@typescript-eslint/require-await": "error",

  "no-throw-literal": "off",
  "@typescript-eslint/only-throw-error": [
    "error",
    {
      allow: [],
      allowRethrowing: true,
      allowThrowingAny: false,
      allowThrowingUnknown: false,
    },
  ],

  "dot-notation": "off",
  "@typescript-eslint/dot-notation": [
    "error",
    {
      ...dotNotationOptions,
      allowIndexSignaturePropertyAccess: false,
      allowPrivateClassPropertyAccess: false,
      allowProtectedClassPropertyAccess: false,
    },
  ],

  "no-return-await": "off",
  "@typescript-eslint/return-await": ["error", "always"],

  camelcase: "off",
  "@typescript-eslint/naming-convention": ["error", ...namingConventionOptions],

  "prefer-destructuring": "off",
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
