import type { Rules } from "../../types.js";

import {
  classMethodsUseThisOptions,
  dotNotationOptions,
  // eslint-disable-next-line unicorn/name-replacements -- This mirrors the ESLint `max-params` rule name
  maxParamsOptions,
  noEmptyFunctionOptions,
  noShadowOptions,
  noUnusedExpressionsOptions,
  preferDestructuring1stOptions,
  preferDestructuring2ndOptions,
  preferPromiseRejectErrorsOptions,
} from "../shared-options.js";

const recommendedRules: Rules = {
  // --- Rules with default options (17/17) ----------------------------------------------------------------------------------------------------------
  "no-case-declarations": "error", // Manually fixable by editor suggestions.
  "no-delete-var": "error",
  "no-empty": ["error", { allowEmptyCatch: false }], // Manually fixable by editor suggestions.
  "no-empty-static-block": "error", // Manually fixable by editor suggestions.
  "no-extra-boolean-cast": ["error", { enforceForInnerExpressions: false }], // Automatically fixable by the --fix command.
  "no-global-assign": ["error", { exceptions: [] }],
  "no-nonoctal-decimal-escape": "error", // Manually fixable by editor suggestions.
  "no-octal": "error",
  "no-redeclare": ["error", { builtinGlobals: true }],
  "no-regex-spaces": "error", // Automatically fixable by the --fix command.
  "no-shadow-restricted-names": ["error", { reportGlobalThis: true }],
  "no-unused-labels": "error", // Automatically fixable by the --fix command.
  "no-useless-catch": "error",
  "no-useless-escape": ["error", { allowRegexCharacters: [] }], // Manually fixable by editor suggestions.
  "no-with": "error",
  "preserve-caught-error": [
    "error",
    { errorClassNames: [], requireCatchParameter: false },
  ], // Manually fixable by editor suggestions.
  "require-yield": "error",
} as const;

const otherRules: Rules = {
  // --- Rules with default options (68/123) ---------------------------------------------------------------------------------------------------------
  "accessor-pairs": [
    "error",
    {
      enforceForClassMembers: true,
      enforceForTSTypes: false,
      getWithoutSet: false,
      setWithoutGet: true,
    },
  ],
  "block-scoped-var": "error",
  camelcase: [
    "error",
    {
      allow: [],
      ignoreDestructuring: false,
      ignoreGlobals: false,
      ignoreImports: false,
      properties: "always",
    },
  ],
  "class-methods-use-this": [
    "error",
    {
      ignoreClassesWithImplements: undefined,
      ...classMethodsUseThisOptions,
    },
  ],
  curly: "error", // Override `eslint-config-prettier`
  "default-case": ["error", { commentPattern: undefined }],
  "default-case-last": "error",
  "default-param-last": "error",
  "dot-notation": ["error", { allowPattern: "", ...dotNotationOptions }],
  eqeqeq: ["error", "always", { null: "always" }],
  "func-names": ["error", "always", { generators: "always" }],
  "func-style": [
    "error",
    "expression",
    {
      allowArrowFunctions: false,
      allowTypeAnnotation: false,
      overrides: undefined,
    },
  ],
  "guard-for-in": "error",
  "no-alert": "error",
  "no-array-constructor": "error",
  "no-bitwise": [
    "error",
    {
      allow: [],
      int32Hint: undefined,
    },
  ],
  "no-caller": "error",
  "no-empty-function": ["error", { ...noEmptyFunctionOptions }],
  "no-eq-null": "error",
  "no-eval": ["error", { allowIndirect: false }],
  "no-extend-native": ["error", { exceptions: [] }],
  "no-extra-bind": "error",
  "no-extra-label": "error",
  "no-implicit-coercion": [
    "error",
    {
      allow: [],
      boolean: true,
      disallowTemplateShorthand: false,
      number: true,
      string: true,
    },
  ],
  "no-implicit-globals": ["error", { lexicalBindings: false }],
  "no-implied-eval": "error",
  "no-iterator": "error",
  "no-label-var": "error",
  "no-labels": [
    "error",
    {
      allowLoop: false,
      allowSwitch: false,
    },
  ],
  "no-lone-blocks": "error",
  "no-lonely-if": "error",
  "no-loop-func": "error",
  "no-multi-assign": ["error", { ignoreNonDeclaration: false }],
  "no-multi-str": "error",
  "no-nested-ternary": "error",
  "no-new": "error",
  "no-new-func": "error",
  "no-new-wrappers": "error",
  "no-object-constructor": "error",
  "no-octal-escape": "error",
  "no-proto": "error",
  "no-script-url": "error",
  "no-throw-literal": "error",
  "no-undef-init": "error",
  "no-undefined": "error",
  "no-unneeded-ternary": ["error", { defaultAssignment: true }],
  "no-useless-call": "error",
  "no-useless-computed-key": ["error", { enforceForClassMembers: true }],
  "no-useless-concat": "error",
  "no-useless-constructor": "error",
  "no-useless-rename": [
    "error",
    {
      ignoreDestructuring: false,
      ignoreExport: false,
      ignoreImport: false,
    },
  ],
  "no-useless-return": "error",
  "no-var": "error",
  "prefer-arrow-callback": [
    "error",
    {
      allowNamedFunctions: false,
      allowUnboundThis: true,
    },
  ],
  "prefer-exponentiation-operator": "error",
  "prefer-named-capture-group": "error",
  "prefer-numeric-literals": "error",
  "prefer-object-has-own": "error",
  "prefer-object-spread": "error",
  "prefer-promise-reject-errors": [
    "error",
    { ...preferPromiseRejectErrorsOptions },
  ],
  "prefer-rest-params": "error",
  "prefer-spread": "error",
  "prefer-template": "error",
  radix: "error",
  "require-await": "error",
  "symbol-description": "error",
  "unicode-bom": ["error", "never"],
  yoda: [
    "error",
    "never",
    {
      exceptRange: false,
      onlyEquality: false,
    },
  ],

  // --- Rules with overridden options (27/123) ------------------------------------------------------------------------------------------------------
  "arrow-body-style": ["error", "always"],
  "capitalized-comments": [
    "error",
    "always",
    {
      ignoreConsecutiveComments: true,
      ignoreInlineComments: true,
      ignorePattern: "",
    },
  ],
  complexity: [
    "error",
    {
      max: 10,
      variant: "classic",
    },
  ],
  "func-name-matching": [
    "error",
    "always",
    {
      considerPropertyDescriptor: true,
      includeCommonJSModuleExports: false,
    },
  ],
  "grouped-accessor-pairs": [
    "error",
    "getBeforeSet",
    { enforceForTSTypes: true },
  ],
  "logical-assignment-operators": ["error", "never"],
  "max-params": [
    "error",
    {
      countThis: "never",
      ...maxParamsOptions,
    },
  ],
  "no-else-return": ["error", { allowElseIf: false }],
  "no-param-reassign": ["error", { props: false }],
  "no-restricted-globals": [
    "error",
    {
      checkGlobalObject: true,
      globalObjects: ["global"],
      globals: [{ message: "Use Uint8Array instead.", name: "Buffer" }],
    },
  ],
  "no-restricted-imports": [
    "error",
    { message: "Use Uint8Array instead.", name: "buffer" },
    { message: "Use Uint8Array instead.", name: "node:buffer" },
  ],
  "no-return-assign": ["error", "always"],
  "no-sequences": ["error", { allowInParentheses: false }],
  "no-shadow": ["error", { ...noShadowOptions }],
  "no-unused-expressions": ["error", { ...noUnusedExpressionsOptions }],
  "no-void": ["error", { allowAsStatement: true }],
  "object-shorthand": [
    "error",
    "always",
    {
      avoidExplicitReturnArrows: false,
      avoidQuotes: false,
      ignoreConstructors: true,
      methodsIgnorePattern: undefined,
    },
  ],
  "one-var": ["error", "never"],
  "operator-assignment": ["error", "never"],
  "prefer-const": [
    "error",
    {
      destructuring: "all",
      ignoreReadBeforeAssign: false,
    },
  ],
  "prefer-destructuring": [
    "error",
    { ...preferDestructuring1stOptions },
    { ...preferDestructuring2ndOptions },
  ],
  "prefer-regex-literals": ["error", { disallowRedundantWrapping: true }],
  "require-unicode-regexp": ["error", { requireFlag: undefined }], // Adding either flag can change matching behavior, so review existing patterns.

  "max-depth": ["warn", { max: 3 }],
  "max-lines": [
    "warn",
    {
      max: 600,
      skipBlankLines: true,
      skipComments: true,
    },
  ],
  "max-lines-per-function": [
    "warn",
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- ESLint rule options use PascalCase for AST node names.
      IIFEs: true,
      max: 60,
      skipBlankLines: true,
      skipComments: true,
    },
  ],
  "max-nested-callbacks": [
    "warn",
    {
      checkConstructorCallCallbacks: true,
      max: 3,
    },
  ],

  // --- Turned off rules (28/123) -------------------------------------------------------------------------------------------------------------------
  "no-negated-condition": "off", // Handled by `unicorn/no-negated-condition`.
  "no-warning-comments": "off", // Handled by `unicorn/expiring-todo-comments`.
  "sort-imports": "off", // Handled by `perfectionist/sort-imports`.
  "sort-keys": "off", // Handled by `perfectionist/sort-objects`.

  "vars-on-top": "off", // Unnecessary, see `no-var`.

  "consistent-return": "off", // Prefer type-aware return analysis over syntax-only consistency checks.
  "consistent-this": "off", // Prefer lexical this through arrow functions over introducing aliases.
  "id-denylist": "off", // Prefer to restrict identifier names only when explicit naming conventions require it.
  "id-length": "off", // Prefer descriptive names while allowing conventional short identifiers where appropriate.
  "id-match": "off", // Prefer context-aware naming conventions over a single restrictive regex.
  "init-declarations": "off", // Prefer initialization where values become available over unnecessary placeholder assignments.
  "max-classes-per-file": "off", // Prefer cohesive class organization over arbitrary per-file limits.
  "max-statements": "off", // Prefer meaningful complexity checks over arbitrary statement limits.
  "new-cap": "off", // Prefer explicit constructor semantics over capitalization-based assumptions.
  "no-console": "off", // Prefer to allow console output in scripts and CLIs; apply logging restrictions where needed.
  "no-continue": "off", // Prefer early iteration skipping when it reduces unnecessary nesting.
  "no-div-regex": "off", // Prefer natural regex syntax over unnecessary character classes.
  "no-inline-comments": "off", // Prefer to allow concise inline comments when they clarify adjacent code.
  "no-invalid-this": "off", // Prefer TypeScript's strict/noImplicitThis checks where available.
  "no-magic-numbers": "off", // Prefer named constants for meaningful domain values without unnecessarily restricting literals.
  "no-plusplus": "off", // Prefer increment and decrement operators for counters while assessing side effects separately.
  "no-restricted-exports": "off", // Prefer to restrict export names only when explicit public API conventions require it.
  "no-restricted-properties": "off", // Prefer to add restrictions only for specific APIs with documented alternatives.
  "no-restricted-syntax": "off", // Prefer targeted rules; broad syntax restrictions need a concrete justification.
  "no-ternary": "off", // Prefer conditional expressions to avoid unnecessary branching statements.
  "no-underscore-dangle": "off", // Prefer to allow underscores for naming conventions, unused bindings, and external API compatibility.
  "sort-vars": "off", // Prefer declaration order based on dependencies and readability.
  strict: "off", // Prefer to configure strictness separately for scripts; ES modules are implicitly strict.
};

const suggestionRules: Rules = {
  ...recommendedRules, // 17/140 rules, 2/17 automatically fixable, 6/17 manually fixable.
  ...otherRules, // 123/140 rules, -/123 automatically fixable, -/123 manually fixable.
} as const;

export { suggestionRules };
