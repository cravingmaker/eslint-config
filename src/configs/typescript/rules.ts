import type { Rules } from "../../types.js";

// typescript-eslint's recommended rules that work without type information.
const recommendedRules: Rules = {
  "@typescript-eslint/no-duplicate-enum-values": "error",
  "@typescript-eslint/no-explicit-any": [
    "error",
    {
      fixToUnknown: false,
      ignoreRestArgs: false,
    },
  ],
  "@typescript-eslint/no-extra-non-null-assertion": "error",
  "@typescript-eslint/no-misused-new": "error",
  "@typescript-eslint/no-namespace": [
    "error",
    {
      allowDeclarations: false,
      allowDefinitionFiles: true,
    },
  ],
  "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
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
  "@typescript-eslint/no-unnecessary-type-constraint": "error",
  "@typescript-eslint/no-unsafe-declaration-merging": "error",
  "@typescript-eslint/no-unsafe-function-type": "error",
  "@typescript-eslint/no-wrapper-object-types": "error",
  "@typescript-eslint/prefer-as-const": "error",
  "@typescript-eslint/prefer-namespace-keyword": "error",

  // Rules with overridden options
  "@typescript-eslint/ban-ts-comment": [
    "error",
    {
      minimumDescriptionLength: 10,
      "ts-check": false,
      "ts-expect-error": "allow-with-description",
      "ts-ignore": true,
      "ts-nocheck": true,
    },
  ],
  "@typescript-eslint/no-empty-object-type": [
    "error",
    {
      allowInterfaces: "with-single-extends",
      allowObjectTypes: "never",
      allowWithName: "",
    },
  ],
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
  "@typescript-eslint/no-dynamic-delete": "error",
  "@typescript-eslint/no-extraneous-class": [
    "error",
    {
      allowConstructorOnly: false,
      allowEmpty: false,
      allowStaticOnly: false,
      allowWithDecorator: true,
    },
  ],
  "@typescript-eslint/no-invalid-void-type": [
    "error",
    {
      allowAsThisParameter: false,
      allowInGenericTypeArguments: true,
    },
  ],
  "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
  "@typescript-eslint/no-non-null-assertion": "error",
  "@typescript-eslint/unified-signatures": [
    "error",
    {
      ignoreDifferentlyNamedParameters: false,
      ignoreOverloadsWithDifferentJSDoc: false,
    },
  ],

  // Rules with overridden options
  "@typescript-eslint/prefer-literal-enum-member": [
    "error",
    { allowBitwiseExpressions: true },
  ],
} as const;

// typescript-eslint's stylistic rules that work without type information.
const stylisticRules: Rules = {
  "@typescript-eslint/ban-tslint-comment": "error",
  "@typescript-eslint/class-literal-property-style": ["error", "fields"],
  "@typescript-eslint/consistent-generic-constructors": [
    "error",
    "constructor",
  ],
  "@typescript-eslint/consistent-indexed-object-style": ["error", "record"],
  "@typescript-eslint/no-confusing-non-null-assertion": "error",
  "@typescript-eslint/no-inferrable-types": [
    "error",
    {
      ignoreParameters: false,
      ignoreProperties: false,
    },
  ],
  "@typescript-eslint/prefer-for-of": "error",
  "@typescript-eslint/prefer-function-type": "error",

  // Rules with overridden options
  "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
  "@typescript-eslint/consistent-type-assertions": [
    "error",
    {
      arrayLiteralTypeAssertions: "allow-as-parameter",
      assertionStyle: "as",
      objectLiteralTypeAssertions: "allow-as-parameter",
    },
  ],
  "@typescript-eslint/consistent-type-definitions": ["error", "type"],

  "@typescript-eslint/adjacent-overload-signatures": "error", // Off while perfectionist is on, see src/overlaps.ts
} as const;

// The other typescript-eslint rules that work without type information.
const otherRules: Rules = {
  "@typescript-eslint/consistent-type-imports": [
    "error",
    {
      disallowTypeAnnotations: true,
      fixStyle: "separate-type-imports",
      prefer: "type-imports",
    },
  ],
  "@typescript-eslint/method-signature-style": ["error", "property"],
  "@typescript-eslint/no-import-type-side-effects": "error",
  "@typescript-eslint/no-unnecessary-parameter-property-assignment": "error",

  "@typescript-eslint/no-useless-empty-export": "error",
  "@typescript-eslint/prefer-enum-initializers": "error",

  // Rules with overridden options
  "@typescript-eslint/explicit-member-accessibility": [
    "error",
    {
      accessibility: "no-public",
      overrides: {
        constructors: "off",
        parameterProperties: "off",
      },
    },
  ],

  "@typescript-eslint/member-ordering": [
    "error", // Off while perfectionist is on, see src/overlaps.ts
    {
      default: {
        memberTypes: [
          // Static state (shared across instances — most "global", declared first)
          "public-static-field",
          "protected-static-field",
          "private-static-field",
          "#private-static-field",

          // Static initialization blocks
          "static-initialization",

          // Instance state (decorated fields first — they carry metadata worth seeing early)
          "public-decorated-field",
          "protected-decorated-field",
          "private-decorated-field",
          "public-instance-field",
          "protected-instance-field",
          "private-instance-field",
          "#private-instance-field",

          // Abstract fields
          "public-abstract-field",
          "protected-abstract-field",

          // Type-level signatures (structural, not runtime)
          "signature",
          "call-signature",

          // Construction (how instances come to life)
          "public-constructor",
          "protected-constructor",
          "private-constructor",

          // Static accessors & methods
          "public-static-accessor",
          "protected-static-accessor",
          "private-static-accessor",
          "#private-static-accessor",
          "public-static-get",
          "protected-static-get",
          "private-static-get",
          "#private-static-get",
          "public-static-set",
          "protected-static-set",
          "private-static-set",
          "#private-static-set",
          "public-static-method",
          "protected-static-method",
          "private-static-method",
          "#private-static-method",

          // Instance accessors (getters/setters sit near their backing fields)
          "public-decorated-accessor",
          "protected-decorated-accessor",
          "private-decorated-accessor",
          "public-instance-accessor",
          "protected-instance-accessor",
          "private-instance-accessor",
          "#private-instance-accessor",
          "public-abstract-accessor",
          "protected-abstract-accessor",
          "public-decorated-get",
          "protected-decorated-get",
          "private-decorated-get",
          "public-instance-get",
          "protected-instance-get",
          "private-instance-get",
          "#private-instance-get",
          "public-abstract-get",
          "protected-abstract-get",
          "public-decorated-set",
          "protected-decorated-set",
          "private-decorated-set",
          "public-instance-set",
          "protected-instance-set",
          "private-instance-set",
          "#private-instance-set",
          "public-abstract-set",
          "protected-abstract-set",

          // Instance methods (public API surface first, internals last)
          "public-decorated-method",
          "protected-decorated-method",
          "private-decorated-method",
          "public-instance-method",
          "protected-instance-method",
          "private-instance-method",
          "#private-instance-method",
          "public-abstract-method",
          "protected-abstract-method",
        ],
        order: "alphabetically-case-insensitive",
      },
    },
  ],

  "@typescript-eslint/explicit-function-return-type": [
    "off",
    {
      allowConciseArrowFunctionExpressionsStartingWithVoid: false,
      allowDirectConstAssertionInArrowFunctions: true,
      allowedNames: [],
      allowExpressions: false,
      allowFunctionsWithoutTypeParameters: false,
      allowHigherOrderFunctions: true,
      allowIIFEs: false,
      allowTypedFunctionExpressions: true,
    },
  ],
  "@typescript-eslint/explicit-module-boundary-types": [
    "off",
    {
      allowArgumentsExplicitlyTypedAsAny: false,
      allowDirectConstAssertionInArrowFunctions: true,
      allowedNames: [],
      allowHigherOrderFunctions: true,
      allowOverloadFunctions: false,
      allowTypedFunctionExpressions: true,
    },
  ],
  "@typescript-eslint/no-restricted-types": "off",
  "@typescript-eslint/parameter-properties": "off",

  // 'init-declarations': 'off', //Uncomment this if @typescript-eslint/init-declarations is enabled
  "@typescript-eslint/init-declarations": "off",

  // 'no-dupe-class-members': 'off', // Uncomment this if @typescript-eslint/no-dupe-class-members is enabled
  "@typescript-eslint/no-dupe-class-members": "off", // Not recommended to enable this in new TypeScript projects

  // 'no-invalid-this': 'off', // Uncomment this if @typescript-eslint/no-invalid-this is enabled
  "@typescript-eslint/no-invalid-this": "off", // Not recommended to enable this in new TypeScript projects

  // 'no-magic-numbers': 'off', // Uncomment this if @typescript-eslint/no-magic-numbers is enabled
  "@typescript-eslint/no-magic-numbers": "off",

  // 'no-redeclare': 'off', // Uncomment this if @typescript-eslint/no-redeclare is enabled
  "@typescript-eslint/no-redeclare": "off", // Not recommended to enable this in new TypeScript projects
} as const;

// Every typescript-eslint rule that works without type information.
const typescriptRules: Rules = {
  ...recommendedRules,
  ...strictRules,
  ...stylisticRules,
  ...otherRules,
} as const;

export { typescriptRules };
