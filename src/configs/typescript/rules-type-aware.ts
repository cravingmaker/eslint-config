import type { Rules } from "../../types.js";

import { consistentReturnOptions } from "../shared-options.js";

// typescript-eslint's recommended rules that need type information.
const recommendedTypeAwareRules: Rules = {
  "@typescript-eslint/await-thenable": "error",
  "@typescript-eslint/no-array-delete": "error",
  "@typescript-eslint/no-base-to-string": [
    "error",
    {
      checkUnknown: false,
      ignoredTypeNames: ["Error", "RegExp", "URL", "URLSearchParams"],
    },
  ],
  "@typescript-eslint/no-duplicate-type-constituents": [
    "error",
    {
      ignoreIntersections: false,
      ignoreUnions: false,
    },
  ],
  "@typescript-eslint/no-for-in-array": "error",
  "@typescript-eslint/no-misused-promises": [
    "error",
    {
      checksConditionals: true,
      checksSpreads: true,
      checksVoidReturn: {
        arguments: true,
        attributes: true,
        inheritedMethods: true,
        properties: true,
        returns: true,
        variables: true,
      },
    },
  ],
  "@typescript-eslint/no-redundant-type-constituents": "error",
  "@typescript-eslint/no-unnecessary-type-assertion": "error",
  "@typescript-eslint/no-unsafe-argument": "error",
  "@typescript-eslint/no-unsafe-assignment": "error",
  "@typescript-eslint/no-unsafe-call": "error",
  "@typescript-eslint/no-unsafe-enum-comparison": "error",
  "@typescript-eslint/no-unsafe-member-access": [
    "error",
    { allowOptionalChaining: false },
  ],
  "@typescript-eslint/no-unsafe-return": "error",
  "@typescript-eslint/no-unsafe-unary-minus": "error",
  "@typescript-eslint/unbound-method": ["error", { ignoreStatic: false }],

  // Rules with overridden options
  "@typescript-eslint/no-floating-promises": [
    "error",
    {
      allowForKnownSafeCalls: [],
      allowForKnownSafePromises: [],
      checkThenables: false,
      ignoreIIFE: true,
      ignoreVoid: true,
    },
  ],
  "@typescript-eslint/restrict-plus-operands": [
    "error",
    {
      allowAny: false,
      allowBoolean: false,
      allowNullish: false,
      allowNumberAndString: false,
      allowRegExp: false,
      skipCompoundAssignments: false,
    },
  ],
  "@typescript-eslint/restrict-template-expressions": [
    "error",
    {
      allowAny: false,
      allowArray: false,
      allowBoolean: false,
      allowNever: false,
      allowNullish: false,
      allowNumber: true,
      allowRegExp: false,
    },
  ],
} as const;

// The rules that need type information in typescript-eslint's strict config.
const strictTypeAwareRules: Rules = {
  "@typescript-eslint/no-deprecated": ["warn", { allow: [] }],
  "@typescript-eslint/no-generated-empty-object-type": "error",

  "@typescript-eslint/no-confusing-void-expression": [
    "error",
    {
      ignoreArrowShorthand: false,
      ignoreVoidOperator: true,
    },
  ],
  "@typescript-eslint/no-meaningless-void-operator": [
    "error",
    { checkNever: false },
  ],
  "@typescript-eslint/no-misused-spread": ["error", { allow: [] }],
  "@typescript-eslint/no-mixed-enums": "error",
  "@typescript-eslint/no-unnecessary-boolean-literal-compare": [
    "error",
    {
      allowComparingNullableBooleansToFalse: true,
      allowComparingNullableBooleansToTrue: true,
      allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
    },
  ],
  "@typescript-eslint/no-unnecessary-condition": [
    "error",
    {
      allowConstantLoopConditions: "only-allowed-literals",
      allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
      checkTypePredicates: true,
    },
  ],
  "@typescript-eslint/no-unnecessary-template-expression": "error",
  "@typescript-eslint/no-unnecessary-type-arguments": "error",
  "@typescript-eslint/no-unnecessary-type-conversion": "error",
  "@typescript-eslint/no-unnecessary-type-parameters": "error",
  "@typescript-eslint/no-useless-default-assignment": [
    "error",
    { allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false },
  ],
  "@typescript-eslint/prefer-reduce-type-parameter": "error",
  "@typescript-eslint/prefer-return-this-type": "error",
  "@typescript-eslint/related-getter-setter-pairs": "error",
  "@typescript-eslint/use-unknown-in-catch-callback-variable": "error",
} as const;

// typescript-eslint's stylistic rules that need type information.
const stylisticTypeAwareRules: Rules = {
  "@typescript-eslint/non-nullable-type-assertion-style": "error",
  "@typescript-eslint/prefer-find": "error",
  "@typescript-eslint/prefer-includes": "error",
  "@typescript-eslint/prefer-regexp-exec": "error",
  "@typescript-eslint/prefer-string-starts-ends-with": [
    "error",
    { allowSingleElementEquality: "never" },
  ],

  // Rules with overridden options
  "@typescript-eslint/prefer-nullish-coalescing": [
    "error",
    {
      allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
      ignoreBooleanCoercion: false,
      ignoreConditionalTests: true,
      ignoreIfStatements: false,
      ignoreMixedLogicalExpressions: false,
      ignorePrimitives: {
        bigint: false,
        boolean: true,
        number: false,
        string: true,
      },
      ignoreTernaryTests: false,
    },
  ],
  "@typescript-eslint/prefer-optional-chain": [
    "error",
    {
      allowPotentiallyUnsafeFixesThatModifyTheReturnTypeIKnowWhatImDoing: false,
      checkAny: true,
      checkBigInt: true,
      checkBoolean: true,
      checkNumber: true,
      checkString: true,
      checkUnknown: true,
      requireNullish: true,
    },
  ],
} as const;

// The other typescript-eslint rules that need type information.
const otherTypeAwareRules: Rules = {
  "@typescript-eslint/no-unnecessary-qualifier": "error",
  "@typescript-eslint/no-unsafe-type-assertion": "error",
  "@typescript-eslint/prefer-readonly": ["error", { onlyInlineLambdas: false }],
  "@typescript-eslint/promise-function-async": [
    "error",
    {
      allowAny: false,
      allowedPromiseNames: [],
      checkArrowFunctions: true,
      checkFunctionDeclarations: true,
      checkFunctionExpressions: true,
      checkMethodDeclarations: true,
    },
  ],
  "@typescript-eslint/require-array-sort-compare": [
    "error",
    { ignoreStringArrays: true },
  ],
  "@typescript-eslint/strict-boolean-expressions": [
    "error",
    {
      allowAny: false,
      allowNullableBoolean: false,
      allowNullableEnum: false,
      allowNullableNumber: false,
      allowNullableObject: true,
      allowNullableString: false,
      allowNumber: true,
      allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
      allowString: true,
    },
  ],
  "@typescript-eslint/strict-void-return": "error",
  "@typescript-eslint/switch-exhaustiveness-check": [
    "error",
    {
      allowDefaultCaseForExhaustiveSwitch: true,
      considerDefaultExhaustiveForUnions: false,
      defaultCaseCommentPattern: "^no default$",
      requireDefaultForNonUnion: true,
    },
  ],

  // Rules with overridden options
  "@typescript-eslint/consistent-type-exports": [
    "error",
    {
      fixMixedExportsWithInlineTypeSpecifier: true,
    },
  ],

  "@typescript-eslint/prefer-readonly-parameter-types": "off",

  // 'consistent-return': 'off',  // Uncomment this if @typescript-eslint/consistent-return is enabled
  "@typescript-eslint/consistent-return": [
    "off",
    { ...consistentReturnOptions },
  ], // It's recommended to use tsconfig's noImplicitReturns option rather than this rule
} as const;

// Every typescript-eslint rule that needs type information.
const typescriptTypeAwareRules: Rules = {
  ...recommendedTypeAwareRules,
  ...strictTypeAwareRules,
  ...stylisticTypeAwareRules,
  ...otherTypeAwareRules,
} as const;

export { typescriptTypeAwareRules };
