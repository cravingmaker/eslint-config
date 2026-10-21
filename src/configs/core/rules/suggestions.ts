import type { Rules } from "../../../types.js";

import {
  classMethodsUseThisOptions,
  dotNotationOptions,
  // eslint-disable-next-line unicorn/name-replacements -- This mirrors the ESLint `max-params` rule name.
  maxParamsOptions,
  noEmptyFunctionOptions,
  noShadowOptions,
  noUnusedExpressionsOptions,
  preferDestructuring1stOptions,
  preferDestructuring2ndOptions,
  preferPromiseRejectErrorsOptions,
} from "../../shared-options.js";

const recommendedRules: Rules = {
  // --- Rules with default options (17/17) ---------------------------------------------------------------------------------------------------------.
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
  // Complemented by `regexp/no-useless-escape` for RegExp constructor patterns.
  "no-useless-escape": ["error", { allowRegexCharacters: [] }], // Manually fixable by editor suggestions.
  "no-with": "error",
  "preserve-caught-error": [
    "error",
    { errorClassNames: [], requireCatchParameter: false },
  ], // Manually fixable by editor suggestions.
  "require-yield": "error",
} as const;

const otherRules: Rules = {
  // --- Rules with default options (65/122) --------------------------------------------------------------------------------------------------------.
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
  curly: "error", // Override `eslint-config-prettier`. Automatically fixable by the --fix command.
  // Complemented by `@typescript-eslint/switch-exhaustiveness-check` for missing typed literal and enum cases.
  "default-case": ["error", { commentPattern: undefined }],
  "default-case-last": "error",
  "default-param-last": "error",
  "dot-notation": ["error", { allowPattern: "", ...dotNotationOptions }], // Automatically fixable by the --fix command.
  eqeqeq: ["error", "always", { null: "always" }], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "func-names": ["error", "always", { generators: "always" }],
  "guard-for-in": "error",
  "no-alert": "error",
  "no-array-constructor": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "no-bitwise": [
    "error",
    {
      allow: [],
      int32Hint: undefined,
    },
  ],
  "no-caller": "error",
  "no-empty-function": ["error", { ...noEmptyFunctionOptions }], // Manually fixable by editor suggestions.
  "no-eq-null": "error",
  "no-eval": ["error", { allowIndirect: false }],
  "no-extend-native": ["error", { exceptions: [] }],
  "no-extra-bind": "error", // Automatically fixable by the --fix command.
  "no-extra-label": "error", // Automatically fixable by the --fix command.
  "no-implicit-coercion": [
    "error",
    {
      allow: [],
      boolean: true,
      disallowTemplateShorthand: false,
      number: true,
      string: true,
    },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
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
  "no-lonely-if": "error", // Automatically fixable by the --fix command.
  "no-loop-func": "error",
  "no-multi-assign": ["error", { ignoreNonDeclaration: false }],
  "no-multi-str": "error",
  "no-nested-ternary": "error",
  "no-new": "error",
  "no-new-func": "error",
  "no-new-wrappers": "error",
  "no-object-constructor": "error", // Manually fixable by editor suggestions.
  "no-octal-escape": "error",
  "no-proto": "error",
  "no-script-url": "error",
  "no-throw-literal": "error",
  "no-undef-init": "error", // Automatically fixable by the --fix command.
  "no-undefined": "error",
  "no-unneeded-ternary": ["error", { defaultAssignment: true }], // Automatically fixable by the --fix command.
  "no-useless-call": "error",
  "no-useless-computed-key": ["error", { enforceForClassMembers: true }], // Automatically fixable by the --fix command.
  "no-useless-concat": "error",
  "no-useless-constructor": "error", // Manually fixable by editor suggestions.
  "no-useless-rename": [
    "error",
    {
      ignoreDestructuring: false,
      ignoreExport: false,
      ignoreImport: false,
    },
  ], // Automatically fixable by the --fix command.
  "no-useless-return": "error", // Automatically fixable by the --fix command.
  "no-var": "error", // Automatically fixable by the --fix command.
  "prefer-exponentiation-operator": "error", // Automatically fixable by the --fix command.
  "prefer-named-capture-group": "error", // Manually fixable by editor suggestions.
  "prefer-numeric-literals": "error", // Automatically fixable by the --fix command.
  "prefer-object-has-own": "error", // Automatically fixable by the --fix command.
  "prefer-object-spread": "error", // Automatically fixable by the --fix command.
  "prefer-promise-reject-errors": [
    "error",
    { ...preferPromiseRejectErrorsOptions },
  ],
  "prefer-rest-params": "error",
  "prefer-spread": "error",
  "prefer-template": "error", // Automatically fixable by the --fix command.
  radix: "error", // Manually fixable by editor suggestions.
  "require-await": "error", // Manually fixable by editor suggestions.
  "symbol-description": "error",
  yoda: [
    "error",
    "never",
    {
      exceptRange: false,
      onlyEquality: false,
    },
  ], // Automatically fixable by the --fix command.

  // --- Rules with overridden options (27/122) -----------------------------------------------------------------------------------------------------.
  "arrow-body-style": ["error", "always"], // Automatically fixable by the --fix command.
  "capitalized-comments": [
    "error",
    "always",
    {
      ignoreConsecutiveComments: true,
      ignoreInlineComments: true,
      ignorePattern: "",
    },
  ], // Automatically fixable by the --fix command.
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
  "logical-assignment-operators": ["error", "never"], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
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
  "max-params": [
    "error",
    {
      countThis: "never",
      ...maxParamsOptions,
    },
  ],
  "no-else-return": ["error", { allowElseIf: false }], // Automatically fixable by the --fix command.
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
  ], // Automatically fixable by the --fix command.
  "one-var": ["error", "never"], // Automatically fixable by the --fix command.
  "operator-assignment": ["error", "never"], // Automatically fixable by the --fix command.
  "prefer-const": [
    "error",
    {
      destructuring: "all",
      ignoreReadBeforeAssign: false,
    },
  ], // Automatically fixable by the --fix command.
  "prefer-destructuring": [
    "error",
    { ...preferDestructuring1stOptions },
    { ...preferDestructuring2ndOptions },
  ], // Automatically fixable by the --fix command.
  "prefer-regex-literals": ["error", { disallowRedundantWrapping: true }], // Manually fixable by editor suggestions.
  // Complemented by `sonarjs/unicode-aware-regex` for implicit string patterns when type information is available.
  "require-unicode-regexp": ["error", { requireFlag: undefined }], // Adding either flag can change matching behavior, so review existing patterns. Manually fixable by editor suggestions.

  // --- Turned off rules (30/122) ------------------------------------------------------------------------------------------------------------------.
  "consistent-return": "off", // Prefer type-aware return analysis over syntax-only consistency checks.
  "consistent-this": "off", // Prefer lexical this through arrow functions over introducing aliases.
  "func-style": "off", // Handled by `@cravingmaker/prefer-arrow-functions`, preserving expression style and semantic exceptions that this rule cannot express.
  "id-denylist": "off", // Prefer to restrict identifier names only when explicit naming conventions require it.
  "id-length": "off", // Prefer descriptive names while allowing conventional short identifiers where appropriate.
  "id-match": "off", // Prefer context-aware naming conventions over a single restrictive regex.
  "init-declarations": "off", // Prefer initialization where values become available over unnecessary placeholder assignments.
  "max-classes-per-file": "off", // Prefer cohesive class organization over arbitrary per-file limits.
  "max-statements": "off", // Prefer meaningful complexity checks over arbitrary statement limits.
  "new-cap": "off", // Prefer explicit constructor semantics over capitalization-based assumptions.
  "no-console": "off", // Prefer to allow console output in scripts and CLIs; apply logging restrictions where needed. Manually fixable by editor suggestions.
  "no-continue": "off", // Prefer early iteration skipping when it reduces unnecessary nesting.
  "no-div-regex": "off", // Prefer natural regex syntax over unnecessary character classes. Automatically fixable by the --fix command.
  "no-inline-comments": "off", // Prefer to allow concise inline comments when they clarify adjacent code.
  "no-invalid-this": "off", // Prefer TypeScript's strict/noImplicitThis checks where available.
  "no-magic-numbers": "off", // Prefer named constants for meaningful domain values without unnecessarily restricting literals.
  "no-negated-condition": "off", // Handled by `unicorn/no-negated-condition`.
  "no-plusplus": "off", // Prefer increment and decrement operators for counters while assessing side effects separately.
  "no-restricted-exports": "off", // Prefer to restrict export names only when explicit public API conventions require it.
  "no-restricted-properties": "off", // Prefer to add restrictions only for specific APIs with documented alternatives.
  "no-restricted-syntax": "off", // Prefer targeted rules; broad syntax restrictions need a concrete justification.
  "no-ternary": "off", // Prefer conditional expressions to avoid unnecessary branching statements.
  "no-underscore-dangle": "off", // Prefer to allow underscores for naming conventions, unused bindings, and external API compatibility.
  "no-warning-comments": "off", // Handled by `unicorn/expiring-todo-comments`.
  "prefer-arrow-callback": "off", // Handled by `@cravingmaker/prefer-arrow-functions` without automatic function-identity changes. Automatically fixable by the --fix command.
  "sort-imports": "off", // Handled by `perfectionist/sort-imports`. Automatically fixable by the --fix command.
  "sort-keys": "off", // Handled by `perfectionist/sort-objects`.
  "sort-vars": "off", // Prefer declaration order based on dependencies and readability. Automatically fixable by the --fix command.
  strict: "off", // Prefer to configure strictness separately for scripts; ES modules are implicitly strict. Automatically fixable by the --fix command.
  "vars-on-top": "off", // Unnecessary, see `no-var`.
} as const;

const suggestionRules: Rules = {
  ...recommendedRules, // 17/139 rules, 3 automatically fixable, 6 editor suggestions fixable.
  ...otherRules, // 122/139 rules, 34 automatically fixable, 13 editor suggestions fixable.
} as const;

export { suggestionRules };
