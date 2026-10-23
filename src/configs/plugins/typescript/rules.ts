import type { Rules } from "../../../types.js";

// Typescript-eslint's recommended rules that work without type information.
const recommendedRules: Rules = {
  // --- Rules with default options (14/17) ---------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/no-duplicate-enum-values": "error",
  "@typescript-eslint/no-explicit-any": [
    "error",
    {
      fixToUnknown: false,
      ignoreRestArgs: false,
    },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "@typescript-eslint/no-extra-non-null-assertion": "error", // Automatically fixable by the --fix command.
  "@typescript-eslint/no-misused-new": "error",
  "@typescript-eslint/no-namespace": [
    "error",
    {
      allowDeclarations: false,
      allowDefinitionFiles: true,
    },
  ],
  "@typescript-eslint/no-non-null-asserted-optional-chain": "error", // Manually fixable by editor suggestions.
  "@typescript-eslint/no-require-imports": [
    "error",
    {
      allow: [],
      allowAsImport: false,
    },
  ],
  "@typescript-eslint/no-this-alias": [
    "error",
    {
      allowDestructuring: true,
      allowedNames: [],
    },
  ],
  "@typescript-eslint/no-unnecessary-type-constraint": "error", // Manually fixable by editor suggestions.
  "@typescript-eslint/no-unsafe-declaration-merging": "error",
  "@typescript-eslint/no-unsafe-function-type": "error",
  "@typescript-eslint/no-wrapper-object-types": "error", // Automatically fixable by the --fix command.
  "@typescript-eslint/prefer-as-const": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "@typescript-eslint/prefer-namespace-keyword": "error", // Automatically fixable by the --fix command.

  // --- Rules with overridden options (3/17) -------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/ban-ts-comment": [
    "error",
    {
      minimumDescriptionLength: 10,
      "ts-check": false,
      "ts-expect-error": "allow-with-description",
      "ts-ignore": true,
      "ts-nocheck": true,
    },
  ], // Manually fixable by editor suggestions.
  "@typescript-eslint/no-empty-object-type": [
    "error",
    {
      allowInterfaces: "with-single-extends",
      allowObjectTypes: "never",
      allowWithName: "",
    },
  ], // Manually fixable by editor suggestions.
  "@typescript-eslint/triple-slash-reference": [
    "error",
    {
      lib: "never",
      path: "never",
      types: "never",
    },
  ],
} as const;

// The rules that typescript-eslint's strict config adds.
const strictRules: Rules = {
  // --- Rules with default options (5/7) -----------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/no-dynamic-delete": "error",
  "@typescript-eslint/no-invalid-void-type": [
    "error",
    {
      allowAsThisParameter: false,
      allowInGenericTypeArguments: true,
    },
  ],
  "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error", // Manually fixable by editor suggestions.
  "@typescript-eslint/no-non-null-assertion": "error", // Manually fixable by editor suggestions.
  "@typescript-eslint/unified-signatures": [
    "error",
    {
      ignoreDifferentlyNamedParameters: false,
      ignoreOverloadsWithDifferentJSDoc: false,
    },
  ],

  // --- Rules with overridden options (2/7) --------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/no-extraneous-class": [
    "error",
    {
      allowConstructorOnly: false,
      allowEmpty: false,
      allowStaticOnly: false,
      allowWithDecorator: true,
    },
  ],
  "@typescript-eslint/prefer-literal-enum-member": [
    "error",
    { allowBitwiseExpressions: true },
  ],
} as const;

// Typescript-eslint's stylistic rules that work without type information.
const stylisticRules: Rules = {
  // --- Rules with default options (8/12) ----------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/ban-tslint-comment": "error", // Automatically fixable by the --fix command.
  "@typescript-eslint/class-literal-property-style": ["error", "fields"], // Manually fixable by editor suggestions.
  "@typescript-eslint/consistent-generic-constructors": [
    "error",
    "constructor",
  ], // Automatically fixable by the --fix command.
  "@typescript-eslint/consistent-indexed-object-style": ["error", "record"], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "@typescript-eslint/no-confusing-non-null-assertion": "error", // Manually fixable by editor suggestions.
  "@typescript-eslint/no-inferrable-types": [
    "error",
    {
      ignoreParameters: false,
      ignoreProperties: false,
    },
  ], // Automatically fixable by the --fix command.
  "@typescript-eslint/prefer-for-of": "error",
  "@typescript-eslint/prefer-function-type": "error", // Automatically fixable by the --fix command.

  // --- Rules with overridden options (3/12) -------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/array-type": [
    "error",
    { default: "array-simple", readonly: undefined },
  ], // Automatically fixable by the --fix command.
  "@typescript-eslint/consistent-type-assertions": [
    "error",
    {
      arrayLiteralTypeAssertions: "allow-as-parameter",
      assertionStyle: "as",
      objectLiteralTypeAssertions: "allow-as-parameter",
    },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "@typescript-eslint/consistent-type-definitions": ["error", "type"], // Automatically fixable by the --fix command.

  // --- Turned off rules (1/12) --------------------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/adjacent-overload-signatures": "off", // Handled by `perfectionist/sort-interfaces` and `perfectionist/sort-object-types`.
} as const;

// The other typescript-eslint rules that work without type information.
const otherRules: Rules = {
  // --- Rules with default options (6/17) ----------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/consistent-type-imports": [
    "error",
    {
      disallowTypeAnnotations: true,
      fixStyle: "separate-type-imports",
      prefer: "type-imports",
    },
  ], // Automatically fixable by the --fix command.
  "@typescript-eslint/method-signature-style": ["error", "property"], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "@typescript-eslint/no-import-type-side-effects": "error", // Automatically fixable by the --fix command.
  "@typescript-eslint/no-unnecessary-parameter-property-assignment": "error",
  "@typescript-eslint/no-useless-empty-export": "error", // Automatically fixable by the --fix command.
  "@typescript-eslint/prefer-enum-initializers": "error", // Manually fixable by editor suggestions.

  // --- Rules with overridden options (2/17) -------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/explicit-member-accessibility": [
    "error",
    {
      accessibility: "no-public",
      ignoredMethodNames: [],
      overrides: {
        constructors: "off",
        parameterProperties: "off",
      },
    },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "@typescript-eslint/no-restricted-types": [
    "error",
    {
      types: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- The key must match the restricted TypeScript type name.
        Buffer: {
          message: "Use Uint8Array instead.",
          suggest: ["Uint8Array"],
        },
      },
    },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.

  // --- Turned off rules (9/17) --------------------------------------------------------------------------------------------------------------------.
  "@typescript-eslint/explicit-function-return-type": "off", // Prefer inferred return types for internal functions.
  "@typescript-eslint/explicit-module-boundary-types": "off", // Prefer inferred boundary types unless the project requires explicit annotations.
  "@typescript-eslint/init-declarations": "off", // Prefer initialization where values become available over placeholder assignments.
  "@typescript-eslint/member-ordering": "off", // Handled by `perfectionist/sort-classes`.
  "@typescript-eslint/no-dupe-class-members": "off", // Handled by the TypeScript compiler (`ts(2300)` and `ts(2393)`); valid overload signatures remain allowed.
  "@typescript-eslint/no-invalid-this": "off", // Implicit-any `this` is checked by `strict`'s `noImplicitThis` (`ts(2683)`); explicit and contextually typed receivers remain valid.
  "@typescript-eslint/no-magic-numbers": "off", // Prefer named constants for meaningful domain values without restricting every numeric literal.
  "@typescript-eslint/no-redeclare": "off", // Handled by the TypeScript compiler (`ts(2451)` and `ts(2300)`); valid declaration merging remains allowed.
  "@typescript-eslint/parameter-properties": "off", // Allow constructor parameter properties.
} as const;

// Every typescript-eslint rule that works without type information.
const typescriptRules: Rules = {
  ...recommendedRules, // 17/53 rules, 5 automatically fixable, 6 editor suggestions fixable.
  ...strictRules, // 7/53 rules, 0 automatically fixable, 2 editor suggestions fixable.
  ...stylisticRules, // 12/53 rules, 8 automatically fixable, 4 editor suggestions fixable.
  ...otherRules, // 17/53 rules, 6 automatically fixable, 4 editor suggestions fixable.
} as const;

export { typescriptRules };
