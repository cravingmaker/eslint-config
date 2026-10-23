import type { Rules } from "../../../types.js";

import { typeAwareReplacementRules } from "./replacements.js";
import { rulesOff } from "../../../utilities/type-aware.js";

// Typescript-eslint's recommended rules that need type information.
const recommendedTypeAwareRules: Rules = {
  // --- Rules with default options (15/19) ---------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/await-thenable": "error", // Manually fixable by editor suggestions.
  "@typescript-eslint/no-array-delete": "error", // Manually fixable by editor suggestions.
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
  ], // Automatically fixable by the --fix command.
  "@typescript-eslint/no-for-in-array": "error",
  "@typescript-eslint/no-redundant-type-constituents": "error",
  "@typescript-eslint/no-unnecessary-type-assertion": [
    "error",
    { checkLiteralConstAssertions: false, typesToIgnore: [] },
  ], // Automatically fixable by the --fix command.
  "@typescript-eslint/no-unsafe-argument": "error",
  "@typescript-eslint/no-unsafe-assignment": "error",
  "@typescript-eslint/no-unsafe-call": "error",
  "@typescript-eslint/no-unsafe-enum-comparison": "error", // Manually fixable by editor suggestions.
  "@typescript-eslint/no-unsafe-member-access": [
    "error",
    { allowOptionalChaining: false },
  ],
  "@typescript-eslint/no-unsafe-return": "error",
  "@typescript-eslint/no-unsafe-unary-minus": "error",
  "@typescript-eslint/unbound-method": ["error", { ignoreStatic: false }],

  // --- Rules with overridden options (4/19) -------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/no-floating-promises": [
    "error",
    {
      allowForKnownSafeCalls: [],
      allowForKnownSafePromises: [],
      checkThenables: false,
      ignoreIIFE: true,
      ignoreVoid: true,
    },
  ], // Manually fixable by editor suggestions.
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
      allow: [{ from: "lib", name: ["Error", "URL", "URLSearchParams"] }],
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
  // --- Rules with default options (15/17) ---------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/no-deprecated": ["warn", { allow: [] }],
  "@typescript-eslint/no-generated-empty-object-type": "error",
  "@typescript-eslint/no-meaningless-void-operator": [
    "error",
    { checkNever: false },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "@typescript-eslint/no-misused-spread": ["error", { allow: [] }], // Manually fixable by editor suggestions.
  "@typescript-eslint/no-mixed-enums": "error",
  "@typescript-eslint/no-unnecessary-boolean-literal-compare": [
    "error",
    {
      allowComparingNullableBooleansToFalse: true,
      allowComparingNullableBooleansToTrue: true,
      allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
    },
  ], // Automatically fixable by the --fix command.
  "@typescript-eslint/no-unnecessary-template-expression": "error", // Automatically fixable by the --fix command.
  "@typescript-eslint/no-unnecessary-type-arguments": "error", // Automatically fixable by the --fix command.
  "@typescript-eslint/no-unnecessary-type-conversion": "error", // Manually fixable by editor suggestions.
  "@typescript-eslint/no-unnecessary-type-parameters": "error", // Manually fixable by editor suggestions.
  "@typescript-eslint/no-useless-default-assignment": [
    "error",
    { allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false },
  ], // Automatically fixable by the --fix command.
  "@typescript-eslint/prefer-reduce-type-parameter": "error", // Automatically fixable by the --fix command.
  "@typescript-eslint/prefer-return-this-type": "error", // Automatically fixable by the --fix command.
  "@typescript-eslint/related-getter-setter-pairs": "error",
  "@typescript-eslint/use-unknown-in-catch-callback-variable": "error", // Manually fixable by editor suggestions.

  // --- Rules with overridden options (2/17) -------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/no-confusing-void-expression": [
    "error",
    {
      ignoreArrowShorthand: false,
      ignoreVoidOperator: true,
      ignoreVoidReturningFunctions: false,
    },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "@typescript-eslint/no-unnecessary-condition": [
    "error",
    {
      allowConstantLoopConditions: "only-allowed-literals",
      allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
      checkTypePredicates: true,
    },
  ], // Manually fixable by editor suggestions.
} as const;

// Typescript-eslint's stylistic rules that need type information.
const stylisticTypeAwareRules: Rules = {
  // --- Rules with default options (4/7) -----------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/non-nullable-type-assertion-style": "error", // Automatically fixable by the --fix command.
  "@typescript-eslint/prefer-find": "error", // Manually fixable by editor suggestions.
  "@typescript-eslint/prefer-includes": "error", // Automatically fixable by the --fix command.
  "@typescript-eslint/prefer-string-starts-ends-with": [
    "error",
    { allowSingleElementEquality: "never" },
  ], // Automatically fixable by the --fix command.

  // --- Rules with overridden options (2/7) --------------------------------------------------------------------------------------------------------.
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
  ], // Manually fixable by editor suggestions.
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
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.

  // --- Turned off rules (1/7) ---------------------------------------------------------------------------------------------------------------------.
  // Temporarily disabled: this autofix can change results when RegExp inherits global flags.
  // Prefer manual review with `regexp/prefer-regexp-exec`; computed-access reports are not fully covered.
  "@typescript-eslint/prefer-regexp-exec": "off", // Automatically fixable by the --fix command.
} as const;

// The other typescript-eslint rules that need type information.
const otherTypeAwareRules: Rules = {
  // --- Rules with default options (6/11) ----------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/no-unnecessary-qualifier": "error", // Automatically fixable by the --fix command.
  "@typescript-eslint/no-unsafe-type-assertion": "error",
  "@typescript-eslint/prefer-readonly": ["error", { onlyInlineLambdas: false }], // Automatically fixable by the --fix command.
  // Complemented by `unicorn/require-array-sort-compare` for string arrays, explicit undefined comparators, and untyped files.
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
  ], // Manually fixable by editor suggestions.
  "@typescript-eslint/strict-void-return": ["error", { allowReturnAny: false }], // Manually fixable by editor suggestions.

  // --- Rules with overridden options (3/11) -------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/consistent-type-exports": [
    "error",
    {
      fixMixedExportsWithInlineTypeSpecifier: true,
    },
  ], // Automatically fixable by the --fix command.
  "@typescript-eslint/promise-function-async": [
    "error",
    {
      // Treat opaque any/unknown returns as potentially asynchronous and require explicit review.
      allowAny: false,
      allowedPromiseNames: [],
      checkArrowFunctions: true,
      checkFunctionDeclarations: true,
      checkFunctionExpressions: true,
      checkMethodDeclarations: true,
    },
  ], // Automatically fixable by the --fix command.
  // Complemented by `default-case` for untyped switches and general default-or-comment enforcement.
  "@typescript-eslint/switch-exhaustiveness-check": [
    "error",
    {
      allowDefaultCaseForExhaustiveSwitch: true,
      considerDefaultExhaustiveForUnions: false,
      defaultCaseCommentPattern: "^no default$",
      requireDefaultForNonUnion: true,
    },
  ], // Manually fixable by editor suggestions.

  // --- Turned off rules (2/11) --------------------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/consistent-return": "off", // Handled by the TypeScript compiler (`ts(7030)`) with `noImplicitReturns`.
  "@typescript-eslint/prefer-readonly-parameter-types": "off", // Handled by `functional/prefer-immutable-types`.
} as const;

// Every typescript-eslint rule that needs type information.
const typescriptTypeAwareRules: Rules = {
  ...recommendedTypeAwareRules, // 19/54 rules, 2 automatically fixable, 4 editor suggestions fixable.
  ...strictTypeAwareRules, // 17/54 rules, 8 automatically fixable, 7 editor suggestions fixable.
  ...stylisticTypeAwareRules, // 7/54 rules, 5 automatically fixable, 3 editor suggestions fixable.
  ...otherTypeAwareRules, // 11/54 rules, 4 automatically fixable, 3 editor suggestions fixable.
} as const;

// Rules requiring type information stay off outside typed linting.
const typescriptTypeAwareRulesOff: Rules = rulesOff({
  ...typescriptTypeAwareRules,
  // Core replacement entries stay in their own typed block; this guard covers only the plugin.
  ...Object.fromEntries(
    Object.entries(typeAwareReplacementRules).filter(([ruleId]) => {
      return ruleId.startsWith("@typescript-eslint/");
    }),
  ),
});

export {
  typescriptTypeAwareRules,
  typescriptTypeAwareRulesOff, // 62 rules, 22 automatically fixable, 19 editor suggestions fixable.
};
