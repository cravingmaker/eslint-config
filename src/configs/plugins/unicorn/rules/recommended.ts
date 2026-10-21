import type { Rules } from "../../../../types.js";

const recommendedRules: Rules = {
  // --- Rules with default options (322/338) -------------------------------------------------------------------------------------------------------.
  "unicorn/better-dom-traversing": "error", // Manually fixable by editor suggestions.
  "unicorn/catch-error-name": ["error", { ignore: [], name: "error" }], // Automatically fixable by the --fix command.
  "unicorn/class-reference-in-static-methods": [
    "error",
    { preferSuper: true, preferThis: true },
  ], // Manually fixable by editor suggestions.
  "unicorn/consistent-assert": "error", // Automatically fixable by the --fix command.
  "unicorn/consistent-boolean-name": [
    "error",
    {
      prefixes: {},

      checkArguments: "always",
      checkFields: "never",
      checkFunctions: "always",
      checkMethods: "never",
      checkVariables: "always",
      ignore: [],
      wrappers: {},
    },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/consistent-class-member-order": [
    "error",
    {
      order: [
        "static-field",
        "static-block",
        "static-method",
        "private-field",
        "public-field",
        "constructor",
        "private-method",
        "public-method",
      ],
    },
  ], // Manually fixable by editor suggestions.
  "unicorn/consistent-compound-words": [
    "error",
    {
      allowList: {},
      checkDefaultAndNamespaceImports: "internal",
      checkProperties: false,
      checkShorthandImports: "internal",
      checkShorthandProperties: false,
      checkVariables: true,
      extendDefaultReplacements: true,
      replacements: {},
    },
  ], // Manually fixable by editor suggestions.
  "unicorn/consistent-conditional-object-spread": ["error", "logical"], // Automatically fixable by the --fix command.
  "unicorn/consistent-date-clone": "error", // Automatically fixable by the --fix command.
  "unicorn/consistent-empty-array-spread": "error", // Automatically fixable by the --fix command.
  "unicorn/consistent-existence-index-check": "error", // Automatically fixable by the --fix command.
  "unicorn/consistent-export-decorator-position": ["error", "above"], // Automatically fixable by the --fix command.
  "unicorn/consistent-function-scoping": [
    "error",
    { checkArrowFunctions: true },
  ],
  "unicorn/consistent-optional-chaining": "error", // Manually fixable by editor suggestions.
  "unicorn/consistent-template-literal-escape": "error", // Automatically fixable by the --fix command.
  "unicorn/consistent-tuple-labels": "error",
  "unicorn/default-export-style": [
    "error",
    { classes: "inline", functions: "inline" },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/dom-node-dataset": ["error", { preferAttributes: false }], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/error-message": "error",
  "unicorn/escape-case": ["error", "uppercase"], // Automatically fixable by the --fix command.
  "unicorn/expiring-todo-comments": [
    "error",
    {
      date: undefined,

      allowWarningComments: true,
      checkDates: false,
      checkDatesOnPullRequests: false,
      ignore: [],
      terms: ["todo", "fixme", "xxx"],
    },
  ],
  "unicorn/explicit-length-check": ["error", { "non-zero": "greater-than" }], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/explicit-timer-delay": ["error", "always"], // Automatically fixable by the --fix command.
  "unicorn/import-style": [
    "error",
    {
      checkDynamicImport: true,
      checkExportFrom: false,
      checkImport: true,
      checkRequire: true,
      extendDefaultStyles: true,
      styles: {},
    },
  ],
  "unicorn/isolated-functions": [
    "error",
    {
      comments: ["@isolated"],
      functions: ["makeSynchronous", "workerize"],
      overrideGlobals: {},
      selectors: [],
    },
  ],
  "unicorn/max-nested-calls": ["warn", { max: 3 }],
  "unicorn/new-for-builtins": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-abusive-eslint-disable": "error",
  "unicorn/no-accessor-recursion": "error",
  "unicorn/no-accidental-bitwise-operator": "error", // Manually fixable by editor suggestions.
  "unicorn/no-anonymous-default-export": "error", // Manually fixable by editor suggestions.
  "unicorn/no-array-callback-reference": ["error", { ignore: [] }], // Manually fixable by editor suggestions.
  "unicorn/no-array-concat-in-loop": "error",
  "unicorn/no-array-fill-with-reference-type": "error",
  "unicorn/no-array-from-fill": "error",
  "unicorn/no-array-method-this-argument": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-array-reduce": ["error", { allowSimpleOperations: true }], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-array-reverse": ["error", { allowExpressionStatement: true }], // Manually fixable by editor suggestions.
  "unicorn/no-array-sort": ["error", { allowExpressionStatement: true }], // Manually fixable by editor suggestions.
  "unicorn/no-array-sort-for-min-max": "error", // Manually fixable by editor suggestions.
  "unicorn/no-array-splice": "error", // Manually fixable by editor suggestions.
  "unicorn/no-async-iterator-callback": "error",
  "unicorn/no-async-promise-finally": "error",
  "unicorn/no-await-expression-member": "error", // Automatically fixable by the --fix command.
  "unicorn/no-await-in-promise-methods": "error", // Manually fixable by editor suggestions.
  "unicorn/no-blob-to-file": "error", // Manually fixable by editor suggestions.
  "unicorn/no-boolean-sort-comparator": "error", // Manually fixable by editor suggestions.
  "unicorn/no-break-in-nested-loop": ["error", { checkContinue: true }],
  "unicorn/no-canvas-to-image": "error",
  "unicorn/no-chained-comparison": "error", // Manually fixable by editor suggestions.
  "unicorn/no-collection-bracket-access": "error", // Manually fixable by editor suggestions.
  "unicorn/no-computed-property-existence-check": "error", // Manually fixable by editor suggestions.
  "unicorn/no-conflicting-constraints": "error",
  "unicorn/no-confusing-array-splice": "error", // Manually fixable by editor suggestions.
  "unicorn/no-confusing-array-with": "error",
  "unicorn/no-console-spaces": "error", // Automatically fixable by the --fix command.
  "unicorn/no-constant-zero-expression": "error", // Manually fixable by editor suggestions.
  "unicorn/no-declarations-before-early-exit": "error", // Automatically fixable by the --fix command.
  "unicorn/no-document-cookie": "error",
  "unicorn/no-double-comparison": "error", // Manually fixable by editor suggestions.
  "unicorn/no-duplicate-logical-operands": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-duplicate-loops": "error",
  "unicorn/no-duplicate-set-values": "error",
  "unicorn/no-empty-file": ["error", { allowComments: false }],
  "unicorn/no-error-property-assignment": "error",
  "unicorn/no-exports-in-scripts": "error",
  "unicorn/no-for-each": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-for-loop": "error", // Automatically fixable by the --fix command.
  "unicorn/no-global-object-property-assignment": "error",
  "unicorn/no-immediate-mutation": ["error", { checkConditionals: false }], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-impossible-length-comparison": "error",
  "unicorn/no-incomplete-accessor-override": "error",
  "unicorn/no-incorrect-query-selector": "error", // Automatically fixable by the --fix command.
  "unicorn/no-incorrect-template-string-interpolation": "error", // Manually fixable by editor suggestions.
  "unicorn/no-ineffective-csp-directives": "error",
  "unicorn/no-instanceof-builtins": [
    "error",
    { exclude: [], include: [], strategy: "loose", useErrorIsError: false },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-invalid-argument-count": ["error", {}],
  "unicorn/no-invalid-boolean-attribute-value": "error", // Manually fixable by editor suggestions.
  "unicorn/no-invalid-character-comparison": "error",
  "unicorn/no-invalid-dom-token": "error", // Manually fixable by editor suggestions.
  "unicorn/no-invalid-fetch-options": "error",
  "unicorn/no-invalid-integrity": "error",
  "unicorn/no-invalid-intl-options": "error", // Manually fixable by editor suggestions.
  "unicorn/no-invalid-property-descriptor": "error", // Manually fixable by editor suggestions.
  "unicorn/no-invalid-remove-event-listener": "error",
  "unicorn/no-invalid-response-options": "error", // Manually fixable by editor suggestions.
  "unicorn/no-invalid-style-set-property": "error", // Manually fixable by editor suggestions.
  "unicorn/no-invalid-temporal-arithmetic": "error", // Manually fixable by editor suggestions.
  "unicorn/no-invalid-url-protocol-comparison": "error", // Automatically fixable by the --fix command.
  "unicorn/no-invalid-well-known-symbol-methods": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-late-current-target-access": "error",
  "unicorn/no-late-event-control": "error",
  "unicorn/no-lonely-if": "error", // Automatically fixable by the --fix command.
  "unicorn/no-loop-iterable-mutation": "error",
  "unicorn/no-magic-array-flat-depth": "error",
  "unicorn/no-mismatched-map-key": "error",
  "unicorn/no-misrefactored-assignment": "error", // Manually fixable by editor suggestions.
  "unicorn/no-multiple-promise-resolver-calls": "error",
  "unicorn/no-named-default": "error", // Automatically fixable by the --fix command.
  "unicorn/no-negated-array-predicate": "error", // Automatically fixable by the --fix command.
  "unicorn/no-negated-comparison": [
    "error",
    { checkLogicalExpressions: false },
  ], // Automatically fixable by the --fix command.
  "unicorn/no-negated-condition": "error", // Automatically fixable by the --fix command.
  "unicorn/no-negation-in-equality-check": "error", // Manually fixable by editor suggestions.
  "unicorn/no-new-array": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-non-function-verb-prefix": [
    "error",
    {
      ignore: [],
      verbs: [
        "get",
        "set",
        "unset",
        "delete",
        "add",
        "remove",
        "destroy",
        "create",
      ],
    },
  ],
  "unicorn/no-nonstandard-builtin-properties": "error",
  "unicorn/no-null": [
    "error",
    { checkArguments: true, checkStrictEquality: false },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-object-as-default-parameter": "error",
  "unicorn/no-object-methods-with-collections": "error", // Manually fixable by editor suggestions.
  "unicorn/no-optional-chaining-on-undeclared-variable": "error",
  "unicorn/no-prevent-default-in-passive-listener": "error", // Manually fixable by editor suggestions.
  "unicorn/no-process-exit": "error",
  "unicorn/no-redundant-comparison": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-return-array-push": "error", // Manually fixable by editor suggestions.
  "unicorn/no-selector-as-dom-name": "error", // Automatically fixable by the --fix command.
  "unicorn/no-shorthand-property-overrides": "error",
  "unicorn/no-single-promise-in-promise-methods": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-static-only-class": "error", // Automatically fixable by the --fix command.
  "unicorn/no-subtraction-comparison": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-thenable": "error",
  "unicorn/no-this-assignment": "error",
  "unicorn/no-this-outside-of-class": "error",
  "unicorn/no-top-level-assignment-in-function": "error",
  "unicorn/no-top-level-side-effects": "error",
  "unicorn/no-transition-all": "error",
  "unicorn/no-uncalled-method": "error",
  "unicorn/no-undeclared-class-members": "error", // Manually fixable by editor suggestions.
  "unicorn/no-unnecessary-array-flat-depth": "error", // Automatically fixable by the --fix command.
  "unicorn/no-unnecessary-array-flat-map": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-unnecessary-array-splice-count": "error", // Automatically fixable by the --fix command.
  "unicorn/no-unnecessary-await": "error", // Automatically fixable by the --fix command.
  "unicorn/no-unnecessary-boolean-comparison": "error", // Automatically fixable by the --fix command.
  "unicorn/no-unnecessary-fetch-options": "error", // Automatically fixable by the --fix command.
  "unicorn/no-unnecessary-global-this": "error", // Automatically fixable by the --fix command.
  "unicorn/no-unnecessary-parameters": ["error", { minimumCallCount: 2 }], // Automatically fixable by the --fix command.
  "unicorn/no-unnecessary-polyfills": ["error", { targets: undefined }],
  "unicorn/no-unnecessary-slice-end": "error", // Automatically fixable by the --fix command.
  "unicorn/no-unnecessary-splice": "error", // Automatically fixable by the --fix command.
  "unicorn/no-unnecessary-string-trim": "error", // Automatically fixable by the --fix command.
  "unicorn/no-unreadable-array-destructuring": [
    "error",
    { maximumIgnoredElements: 1 },
  ], // Automatically fixable by the --fix command.
  "unicorn/no-unreadable-for-of-expression": "error",
  "unicorn/no-unreadable-iife": "error", // Manually fixable by editor suggestions.
  "unicorn/no-unreadable-object-destructuring": "error",
  "unicorn/no-unsafe-buffer-conversion": "error", // Manually fixable by editor suggestions.
  "unicorn/no-unsafe-json-serialization": "error", // Manually fixable by editor suggestions.
  "unicorn/no-unsafe-promise-all-settled-values": "error",
  "unicorn/no-unsafe-property-key": "error",
  "unicorn/no-unsafe-sqlite-interpolation": "error",
  "unicorn/no-unsafe-string-replacement": "error",
  "unicorn/no-unused-builtin-method-return": "error",
  "unicorn/no-unused-iterator-helper": "error", // Manually fixable by editor suggestions.
  "unicorn/no-url-in-search-params": "error", // Manually fixable by editor suggestions.
  "unicorn/no-useless-boolean-cast": "error", // Automatically fixable by the --fix command.
  "unicorn/no-useless-coercion": "error", // Automatically fixable by the --fix command.
  "unicorn/no-useless-collection-argument": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-useless-compound-assignment": "error", // Manually fixable by editor suggestions.
  "unicorn/no-useless-concat": "error", // Automatically fixable by the --fix command.
  "unicorn/no-useless-continue": "error", // Automatically fixable by the --fix command.
  "unicorn/no-useless-delete-check": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-useless-else": "error", // Automatically fixable by the --fix command.
  "unicorn/no-useless-error-capture-stack-trace": "error", // Automatically fixable by the --fix command.
  "unicorn/no-useless-fallback-in-spread": "error", // Automatically fixable by the --fix command.
  "unicorn/no-useless-iterator-to-array": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-useless-length-check": "error", // Automatically fixable by the --fix command.
  "unicorn/no-useless-logical-operand": "error", // Automatically fixable by the --fix command.
  "unicorn/no-useless-override": "error", // Automatically fixable by the --fix command.
  "unicorn/no-useless-promise-resolve-reject": "error", // Automatically fixable by the --fix command.
  "unicorn/no-useless-re-export": "error",
  "unicorn/no-useless-recursion": "error",
  "unicorn/no-useless-set-construction": "error", // Automatically fixable by the --fix command.
  "unicorn/no-useless-spread": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-useless-switch-case": "error", // Manually fixable by editor suggestions.
  "unicorn/no-useless-template-literals": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-useless-undefined": [
    "error",
    { checkArguments: true, checkArrowFunctionBody: true },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-using-resource-escape": "error",
  "unicorn/no-xor-as-exponentiation": "error", // Manually fixable by editor suggestions.
  "unicorn/no-zero-fractions": "error", // Automatically fixable by the --fix command.
  "unicorn/numeric-separators-style": [
    "error",
    {
      binary: { groupLength: 4, minimumDigits: 0 },
      hexadecimal: { groupLength: 2, minimumDigits: 0 },
      number: {
        fractionGroupLength: Infinity,
        groupLength: 3,
        minimumDigits: 5,
      },
      octal: { groupLength: 4, minimumDigits: 0 },
      onlyIfContainsSeparator: false,
    },
  ], // Automatically fixable by the --fix command.
  "unicorn/prefer-abort-signal-any": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-abort-signal-timeout": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-add-event-listener": [
    "error",
    { excludedPackages: ["koa", "sax"] },
  ], // Automatically fixable by the --fix command.
  "unicorn/prefer-add-event-listener-options": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-aggregate-error": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-array-find": ["error", { checkFromLast: true }], // Automatically fixable by the --fix command.
  "unicorn/prefer-array-flat": ["error", { functions: [] }], // Automatically fixable by the --fix command.
  "unicorn/prefer-array-flat-map": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-array-from-async": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-array-from-map": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-array-from-range": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-array-index-of": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-array-iterable-methods": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-array-last-methods": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-array-slice": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-array-some": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-at": [
    "error",
    { checkAllIndexAccess: false, getLastElementFunctions: [] },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  // Complemented by `promise/prefer-await-to-then` for void-discarded chains inside functions.
  "unicorn/prefer-await": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-bigint-literals": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-blob-reading-methods": "error",
  "unicorn/prefer-block-statement-over-iife": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-boolean-return": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-class-fields": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-classlist-toggle": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-code-point": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-combined-guards": [
    "error",
    { checkCompoundConditions: false, checkMultiStatementBodies: false },
  ], // Automatically fixable by the --fix command.
  "unicorn/prefer-continue": [
    "error",
    { checkShortBodies: false, maximumStatements: 1 },
  ], // Automatically fixable by the --fix command.
  "unicorn/prefer-date-now": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-default-parameters": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-direct-iteration": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-dom-node-append": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-dom-node-html-methods": [
    "error",
    { checkGetHTML: true, checkSetHTML: false },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-dom-node-remove": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-dom-node-replace-children": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-dom-node-text-content": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-early-return": [
    "error",
    { checkShortBodies: false, maximumStatements: 1 },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-else-if": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-escaped-irregular-whitespace": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-event-target": "error",
  "unicorn/prefer-export-from": ["error", { checkUsedVariables: true }], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-flat-math-min-max": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-get-or-insert-computed": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-global-number-constants": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-global-this": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-group-by": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-has-check": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-hoisting-branch-code": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-https": ["error", { ignore: [] }], // Automatically fixable by the --fix command.
  "unicorn/prefer-identifier-import-export-specifiers": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-includes": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-includes-over-repeated-comparisons": [
    "error",
    { minimumComparisons: 3 },
  ],
  "unicorn/prefer-iterable-in-constructor": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-iterator-helpers": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-iterator-to-array": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-iterator-to-array-at-end": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-keyboard-event-key": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-literal-ascii": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-location-assign": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-logical-operator-over-ternary": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-map-from-entries": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-math-abs": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-math-constants": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-math-min-max": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-math-trunc": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-minimal-ternary": [
    "error",
    { checkComputedMemberAccess: false, checkVaryingBase: false },
  ], // Automatically fixable by the --fix command.
  "unicorn/prefer-modern-dom-apis": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-modern-math-apis": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-module": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-native-coercion-functions": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-negative-index": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-node-protocol": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-number-coercion": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-number-is-safe-integer": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-number-properties": [
    "error",
    { checkInfinity: false, checkNaN: false },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-object-define-properties": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-object-destructuring-defaults": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-object-from-entries": ["error", { functions: [] }], // Automatically fixable by the --fix command.
  "unicorn/prefer-object-iterable-methods": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-observer-apis": "error",
  "unicorn/prefer-optional-catch-binding": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-path2d": "error",
  "unicorn/prefer-private-class-fields": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-promise-static-methods": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-promise-try": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-promise-with-resolvers": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-prototype-methods": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-query-selector": ["error", { allowWithVariables: false }], // Automatically fixable by the --fix command.
  "unicorn/prefer-queue-microtask": [
    "error",
    { checkSetImmediate: false, checkSetTimeout: false },
  ], // Automatically fixable by the --fix command.
  "unicorn/prefer-reflect-apply": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-regexp-test": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-response-static-json": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-scoped-selector": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-set-has": ["error", { minimumItems: 0 }], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-set-methods": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-set-size": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-short-escape-sequences": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-simple-condition-first": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-simple-sort-comparator": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-simplified-conditions": [
    "error",
    { negatedConditions: "simplify" },
  ], // Automatically fixable by the --fix command.
  "unicorn/prefer-single-array-predicate": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-single-call": ["error", { ignore: [] }], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-single-object-destructuring": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-single-replace": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-smaller-scope": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-split-limit": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-spread": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-string-match-all": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-string-pad-start-end": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-string-raw": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-string-repeat": ["error", { minimumRepetitions: 3 }], // Automatically fixable by the --fix command.
  "unicorn/prefer-string-replace-all": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-string-slice": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-string-starts-ends-with": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-string-trim-start-end": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-structured-clone": ["error", { functions: [] }], // Manually fixable by editor suggestions.
  "unicorn/prefer-switch": [
    "error",
    { emptyDefaultCase: "no-default-comment", minimumCases: 3 },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-temporal-conversion": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-ternary": ["error", "always"], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-then-catch": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-toggle-attribute": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-top-level-await": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-type-error": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-type-literal-last": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-unary-minus": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-unicode-code-point-escapes": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-url-can-parse": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-url-href": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-url-search-parameters": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-while-loop-condition": "error", // Automatically fixable by the --fix command.
  "unicorn/relative-url-style": ["error", "never"], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/require-array-join-separator": "error", // Automatically fixable by the --fix command.
  // Complemented by `@typescript-eslint/require-array-sort-compare` for computed access and optional calls with type information.
  "unicorn/require-array-sort-compare": "error", // Manually fixable by editor suggestions.
  "unicorn/require-css-escape": ["error", { checkAllSelectors: false }], // Automatically fixable by the --fix command.
  "unicorn/require-module-attributes": "error", // Automatically fixable by the --fix command.
  "unicorn/require-module-specifiers": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/require-number-to-fixed-digits-argument": "error", // Automatically fixable by the --fix command.
  "unicorn/require-passive-events": "error", // Automatically fixable by the --fix command.
  "unicorn/require-proxy-trap-boolean-return": "error", // Automatically fixable by the --fix command.
  "unicorn/require-text-decoder-streaming": "error", // Manually fixable by editor suggestions.
  "unicorn/single-line-block-comment-style": [
    "error",
    "multiline",
    { ignore: [] },
  ], // Automatically fixable by the --fix command.
  "unicorn/switch-case-braces": ["error", "always"], // Automatically fixable by the --fix command.
  "unicorn/switch-case-break-position": "error", // Automatically fixable by the --fix command.
  "unicorn/text-encoding-identifier-case": ["error", { withDash: false }], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/throw-new-error": "error", // Automatically fixable by the --fix command.

  // --- Rules with overridden options (3/338) ------------------------------------------------------------------------------------------------------.
  "unicorn/filename-case": [
    "error",
    {
      checkDirectories: true,
      directoryRoots: [],
      multipleFileExtensions: true,

      cases: {
        kebabCase: true,
        pascalCase: true,
      },
      // @ts-expect-error -- The schema accepts RegExp objects, but the generated type allows only plain objects.
      ignore: [/^\d+_/v], // Migration files like 001_init.js.
    },
  ],
  "unicorn/name-replacements": [
    "error",
    {
      checkDefaultAndNamespaceImports: "internal",
      checkFilenames: true,
      checkProperties: false,
      checkShorthandImports: "internal",
      checkShorthandProperties: false,
      checkVariables: true,
      extendDefaultAllowList: true,
      extendDefaultReplacements: true,

      allowList: {
        // Common framework/library identifiers that are intentional abbreviations.
        i18n: true,
        i18nKey: true,

        // TypeScript.
        tsconfigRootDir: true,
      },
      ignore: [
        // Allow spec/test file patterns.
        String.raw`\.spec$`,
        String.raw`\.test$`,

        // Allow e2e test file suffixes.
        String.raw`\.e2e$`,
      ],
      replacements: {
        // Near universal convention.
        e: {
          error: true,
          event: false,
        },
        fn: { function: false },

        // First-class React concept.
        ref: false,

        // Framework standard and APIs (Express, Hono, etc.).
        ctx: false,
        req: false,
        res: false,
      },
    },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/template-indent": [
    "error",
    {
      indent: undefined,

      functions: ["dedent", "stripIndent"],
      selectors: [],

      // The defaults without `gql`, `html`, and `/* HTML */`: Prettier formats those templates.
      comments: ["indent"],
      tags: ["outdent", "dedent", "sql", "styled"],
    },
  ], // Automatically fixable by the --fix command.

  // --- Turned off rules (13/338) ------------------------------------------------------------------------------------------------------------------.
  "unicorn/consistent-json-file-read": "off", // Prefer explicit JSON file reading behavior. Automatically fixable by the --fix command.
  "unicorn/empty-brace-spaces": "off", // Handled by `prettier`. Automatically fixable by the --fix command.
  "unicorn/logical-assignment-operators": "off", // Handled by `logical-assignment-operators`. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-duplicate-if-branches": "off", // Handled by `sonarjs/no-duplicated-branches` and `sonarjs/no-all-duplicated-branches`, which also inspect non-adjacent and switch branches.
  "unicorn/no-empty-link-text": "off", // Markdown-only rule; preserve the existing Markdown policy.
  "unicorn/no-leading-empty-lines": "off", // Handled by `prettier`. Automatically fixable by the --fix command.
  "unicorn/no-nested-ternary": "off", // Handled by `no-nested-ternary`, prettier removes the parentheses that this rule requires. Automatically fixable by the --fix command.
  "unicorn/no-new-buffer": "off", // Handled by `no-restricted-syntax`; Buffer API autofixes conflict with the Uint8Array policy. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-typeof-undefined": "off", // Handled by `no-undefined`, which requires typeof checks. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/no-unnecessary-nested-ternary": "off", // Handled by `no-nested-ternary` for nested result branches; simplification requires manual review. Automatically fixable by the --fix command.
  "unicorn/number-literal-case": "off", // Handled by `prettier`. Automatically fixable by the --fix command.
  "unicorn/operator-assignment": "off", // Handled by `operator-assignment`. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-iterator-zip": "off", // `Iterator.zip` is unavailable in the checked Node 24.22 and 26.12 runtimes. Manually fixable by editor suggestions.
} as const;

export { recommendedRules }; // 338 rules, 198 automatically fixable, 136 editor suggestions fixable.
