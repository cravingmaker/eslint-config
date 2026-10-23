import type { RuleOptionOf, Rules } from "../../../types.js";

const commonOptions = {
  fallbackSort: { type: "unsorted" },
  ignoreCase: true,
  locales: "en-US",
  order: "asc",
  specialCharacters: "trim",
  type: "natural",
} as const;

const commonCollectionRuleOptions = {
  ...commonOptions,
  partitionByNewLine: true,
} as const;

const commonTsShapeRuleOptions = {
  ...commonOptions,
  groups: [
    "index-signature",
    ["required-property", "required-method"],
    ["optional-property", "optional-method"],
    "unknown",
  ],
  newlinesBetween: 1,
  newlinesInside: 0,
} satisfies RuleOptionOf<"perfectionist/sort-object-types">;

const commonTsCompositionRuleOptions = {
  ...commonOptions,
  groups: [
    "keyword",
    "named",
    "literal",
    "operator",
    "import",
    "object",
    "function",
    "tuple",
    ["intersection", "union"],
    "conditional",
    "unknown",
    "nullish",
  ],
} satisfies RuleOptionOf<"perfectionist/sort-union-types">;

const perfectionistRules: Rules = {
  // --- Rules with overridden options (22/23) ------------------------------------------------------------------------------------------------------.
  "perfectionist/sort-array-includes": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      groups: ["literal"],
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      useConfigurationIf: {},
      ...commonCollectionRuleOptions,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-arrays": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      groups: ["literal"],
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,

      ...commonCollectionRuleOptions,
      useConfigurationIf: {
        matchesAstSelector: "TSAsExpression > ArrayExpression", // Only fires on `[...] as const` — safe to sort.
      },
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-classes": [
    "error",
    {
      alphabet: "",
      customGroups: [
        // #private static property.
        {
          groupName: "hash-private-static-property",
          modifiers: ["private", "static"],
          selector: "property",
        },
        // #private instance property.
        {
          groupName: "hash-private-property",
          modifiers: ["private"],
          selector: "property",
        },
        // #private static auto-accessor.
        {
          groupName: "hash-private-static-accessor",
          modifiers: ["private", "static"],
          selector: "accessor-property",
        },
        // #private instance auto-accessor.
        {
          groupName: "hash-private-accessor",
          modifiers: ["private"],
          selector: "accessor-property",
        },
        // #private static getter.
        {
          groupName: "hash-private-static-get-method",
          modifiers: ["private", "static"],
          selector: "get-method",
        },
        // #private instance getter.
        {
          groupName: "hash-private-get-method",
          modifiers: ["private"],
          selector: "get-method",
        },
        // #private static setter.
        {
          groupName: "hash-private-static-set-method",
          modifiers: ["private", "static"],
          selector: "set-method",
        },
        // #private instance setter.
        {
          groupName: "hash-private-set-method",
          modifiers: ["private"],
          selector: "set-method",
        },
        // #private static method.
        {
          groupName: "hash-private-static-method",
          modifiers: ["private", "static"],
          selector: "method",
        },
        // #private instance method.
        {
          groupName: "hash-private-method",
          modifiers: ["private"],
          selector: "method",
        },
      ],
      fallbackSort: { type: "unsorted" },
      groups: [
        // Static properties.
        "public-static-property",
        "protected-static-property",
        "private-static-property",
        "hash-private-static-property",

        // Static initialization.
        "static-block",

        // Instance decorated properties (metadata-bearing, declared first).
        "public-decorated-property",
        "protected-decorated-property",
        "private-decorated-property",

        // Instance regular properties.
        "public-property",
        "protected-property",
        "private-property",
        "hash-private-property",

        // Abstract properties.
        "public-abstract-property",
        "protected-abstract-property",

        // Structural signatures.
        "index-signature",

        // Constructors.
        "public-constructor",
        "protected-constructor",
        "private-constructor",

        // Static auto-accessors (accessor keyword).
        "public-static-accessor-property",
        "protected-static-accessor-property",
        "private-static-accessor-property",
        "hash-private-static-accessor",

        // Static getters.
        "public-static-get-method",
        "protected-static-get-method",
        "private-static-get-method",
        "hash-private-static-get-method",

        // Static setters.
        "public-static-set-method",
        "protected-static-set-method",
        "private-static-set-method",
        "hash-private-static-set-method",

        // Static methods.
        "public-static-method",
        "protected-static-method",
        "private-static-method",
        "hash-private-static-method",

        // Instance decorated auto-accessors.
        "public-decorated-accessor-property",
        "protected-decorated-accessor-property",
        "private-decorated-accessor-property",

        // Instance regular auto-accessors.
        "public-accessor-property",
        "protected-accessor-property",
        "private-accessor-property",
        "hash-private-accessor",

        // Abstract auto-accessors.
        "public-abstract-accessor-property",
        "protected-abstract-accessor-property",

        // Instance decorated getters.
        "public-decorated-get-method",
        "protected-decorated-get-method",
        "private-decorated-get-method",

        // Instance regular getters.
        "public-get-method",
        "protected-get-method",
        "private-get-method",
        "hash-private-get-method",

        // Abstract getters.
        "public-abstract-get-method",
        "protected-abstract-get-method",

        // Instance decorated setters.
        "public-decorated-set-method",
        "protected-decorated-set-method",
        "private-decorated-set-method",

        // Instance regular setters.
        "public-set-method",
        "protected-set-method",
        "private-set-method",
        "hash-private-set-method",

        // Abstract setters.
        "public-abstract-set-method",
        "protected-abstract-set-method",

        // Instance decorated methods.
        "public-decorated-method",
        "protected-decorated-method",
        "private-decorated-method",

        // Instance regular methods.
        "public-method",
        "protected-method",
        "private-method",
        "hash-private-method",

        // Abstract methods.
        "public-abstract-method",
        "protected-abstract-method",

        "unknown",
      ],
      ignoreCallbackDependenciesPatterns: [],
      ignoreCase: true,
      locales: "en-US",
      newlinesBetween: "ignore",
      newlinesBetweenOverloadSignatures: 0,
      newlinesInside: "newlinesBetween",
      order: "asc",
      partitionByComment: false,
      partitionByNewLine: false,
      specialCharacters: "keep",
      type: "alphabetical",
      useConfigurationIf: {},
      useExperimentalDependencyDetection: true,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-decorators": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      groups: [],
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      partitionByNewLine: false,
      sortOnAccessors: true,
      sortOnClasses: true,
      sortOnMethods: true,
      sortOnParameters: true,
      sortOnProperties: true,
      ...commonOptions,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-enums": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      groups: [],
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      sortByValue: "ifNumericEnum",
      useConfigurationIf: {},
      useExperimentalDependencyDetection: true,

      ...commonOptions,
      partitionByNewLine: true,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-export-attributes": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      groups: [],
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      partitionByNewLine: false,
      useConfigurationIf: {},
      ...commonOptions,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-exports": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      groups: [],
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      partitionByNewLine: false,
      ...commonOptions,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-heritage-clauses": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      groups: [],
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      partitionByNewLine: false,
      useConfigurationIf: {},
      ...commonOptions,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-import-attributes": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      groups: [],
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      partitionByNewLine: false,
      useConfigurationIf: {},
      ...commonOptions,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-imports": [
    "error",
    {
      alphabet: "",
      environment: "node",
      maxLineLength: Infinity,
      newlinesInside: 0,
      partitionByComment: false,
      partitionByNewLine: false,
      sortBy: "path",
      sortSideEffects: false,
      tsconfig: { rootDir: "" },
      useExperimentalDependencyDetection: true,

      ...commonOptions,
      customGroups: [
        {
          anyOf: [{ elementNamePattern: "^node:" }],
          groupName: "node",
        },
        {
          anyOf: [{ elementNamePattern: "^bun:" }],
          groupName: "bun",
        },
      ],
      groups: [
        [
          "type-builtin",
          "type-external",
          "type-internal",
          "type-parent",
          "type-sibling",
          "type-index",
        ],
        "type",
        "node",
        "bun",
        "builtin",
        "external",
        "internal",
        ["parent", "sibling", "index"],
        ["side-effect", "side-effect-style"],
        "style",
        "unknown",
      ],
      internalPattern: ["^~/.*", "^@/.*"],
      newlinesBetween: 1,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-interfaces": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      partitionByComment: false,
      partitionByNewLine: false,
      sortBy: "name",
      useConfigurationIf: {},
      ...commonTsShapeRuleOptions,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-intersection-types": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      ignoreCallableTypes: true,
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      partitionByNewLine: false,
      useConfigurationIf: {},
      ...commonTsCompositionRuleOptions,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-jsx-props": [
    "error",
    {
      alphabet: "",
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByNewLine: false,
      useConfigurationIf: {},

      ...commonOptions,
      customGroups: [
        {
          elementNamePattern: "^on[A-Z]",
          groupName: "callback",
        },
      ],
      groups: ["multiline-prop", "prop", "shorthand-prop", "callback"],
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-maps": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      groups: [],
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      useConfigurationIf: {},
      ...commonCollectionRuleOptions,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-modules": [
    "error",
    {
      additionalModuleBlockTypes: [],
      alphabet: "",
      customGroups: [],
      newlinesBetweenOverloadSignatures: 0,
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      partitionByNewLine: false,
      tsconfig: { rootDir: "" },
      useExperimentalDependencyDetection: true,

      ...commonOptions,
      groups: [
        ["interface", "type", "declare-interface", "declare-type"],
        ["enum", "declare-enum"],
        ["class", "declare-class"],
        ["function", "async-function", "declare-function"],
        "unknown",
        [
          "export-interface",
          "export-type",
          "export-enum",
          "export-declare-enum",
          "export-class",
          "export-default-class",
          "export-default-decorated-class",
          "export-declare-class",
          "export-function",
          "export-default-function",
          "export-async-function",
          "export-default-async-function",
          "export-declare-function",
        ],
      ],
      // The installed spacing fixer counts documentation paragraphs and can repeatedly produce a no-op fix.
      // Keep declaration ordering; function-variable separation is handled by `@stylistic/padding-line-between-statements`.
      newlinesBetween: "ignore",
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-named-exports": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      ignoreAlias: false,
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      partitionByNewLine: false,
      useConfigurationIf: {},

      ...commonOptions,
      groups: ["type-export", "value-export", "unknown"],
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-named-imports": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      groups: [],
      ignoreAlias: false,
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      partitionByNewLine: false,
      useConfigurationIf: {},
      ...commonOptions,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-object-types": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      partitionByComment: false,
      partitionByNewLine: false,
      sortBy: "name",
      useConfigurationIf: {},
      ...commonTsShapeRuleOptions,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-objects": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      groups: [],
      ignoreCallbackDependenciesPatterns: [],
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      partitionByComputedKey: false,
      sortBy: "name",
      styledComponents: true,
      useConfigurationIf: {},
      useExperimentalDependencyDetection: true,
      ...commonCollectionRuleOptions,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-sets": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      groups: ["literal"],
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      useConfigurationIf: {},
      ...commonCollectionRuleOptions,
    },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-switch-case": [
    "error",
    { alphabet: "", ...commonOptions },
  ], // Automatically fixable by the --fix command.
  "perfectionist/sort-union-types": [
    "error",
    {
      alphabet: "",
      customGroups: [],
      newlinesBetween: "ignore",
      newlinesInside: "newlinesBetween",
      partitionByComment: false,
      partitionByNewLine: false,
      useConfigurationIf: {},
      ...commonTsCompositionRuleOptions,
    },
  ], // Automatically fixable by the --fix command.

  // --- Turned off rules (1/23) --------------------------------------------------------------------------------------------------------------------.
  "perfectionist/sort-variable-declarations": "off", // Handled by `one-var`, which allows one declarator per declaration. Automatically fixable by the --fix command.
} as const;

export { perfectionistRules }; // 23 rules, 23 automatically fixable, 0 editor suggestions fixable.
