import type { Rules } from "../../types.js";

// Typescript-eslint's recommended rules that work without type information.
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

// Typescript-eslint's stylistic rules that work without type information.
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
  "@typescript-eslint/array-type": [
    "error",
    { default: "array-simple", readonly: undefined },
  ],
  "@typescript-eslint/consistent-type-assertions": [
    "error",
    {
      arrayLiteralTypeAssertions: "allow-as-parameter",
      assertionStyle: "as",
      objectLiteralTypeAssertions: "allow-as-parameter",
    },
  ],
  "@typescript-eslint/consistent-type-definitions": ["error", "type"],

  "@typescript-eslint/adjacent-overload-signatures": "off", // Handled by `perfectionist/sort-interfaces` and `perfectionist/sort-object-types`.
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
      ignoredMethodNames: [],

      accessibility: "no-public",
      overrides: {
        constructors: "off",
        parameterProperties: "off",
      },
    },
  ],

  "@typescript-eslint/member-ordering": "off", // Handled by `perfectionist/sort-classes`.

  "@typescript-eslint/explicit-function-return-type": "off",
  "@typescript-eslint/explicit-module-boundary-types": "off",
  "@typescript-eslint/no-restricted-types": [
    "error",
    {
      types: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- The key must match the restricted TypeScript type name
        Buffer: {
          message: "Use Uint8Array instead.",
          suggest: ["Uint8Array"],
        },
      },
    },
  ],
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
