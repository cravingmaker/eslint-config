import type { Rules } from "../../../types.js";

// Rules: https://github.com/SonarSource/SonarJS/blob/master/packages/analysis/src/jsts/rules/README.md.
// Recommended and other rules are inventoried explicitly; the upstream preset never selects policy.
// Keep test checks in their current scope: runners also support filenames outside .test/.spec.
const recommendedRules: Rules = {
  // --- Rules with default options (132/230) -------------------------------------------------------------------------------------------------------.
  "sonarjs/anchor-precedence": "error",
  "sonarjs/arguments-order": "error",
  "sonarjs/assertions-in-test-cases": "error",
  "sonarjs/assertions-in-tests": "warn",
  "sonarjs/async-test-assertions": "error",
  // Keep AWS CDK checks active: a root manifest may omit workspace or optional dependencies.
  "sonarjs/aws-apigateway-public-api": "error",
  "sonarjs/aws-ec2-rds-dms-public": "error",
  "sonarjs/aws-ec2-unencrypted-ebs-volume": "error",
  "sonarjs/aws-efs-unencrypted": "error",
  "sonarjs/aws-iam-all-privileges": "error",
  "sonarjs/aws-iam-privilege-escalation": "error",
  "sonarjs/aws-iam-public-access": "error",
  "sonarjs/aws-opensearchservice-domain": "error",
  "sonarjs/aws-rds-unencrypted-databases": "error",
  "sonarjs/aws-restricted-ip-admin-access": "error",
  "sonarjs/aws-s3-bucket-granted-access": "error",
  "sonarjs/aws-s3-bucket-insecure-http": "error",
  "sonarjs/aws-s3-bucket-public-access": "error",
  "sonarjs/aws-s3-bucket-versioning": "error",
  "sonarjs/aws-sagemaker-unencrypted-notebook": "error",
  "sonarjs/aws-sns-unencrypted-topics": "error",
  "sonarjs/aws-sqs-unencrypted-queue": "error",
  "sonarjs/chai-determinate-assertion": "error",
  "sonarjs/cognitive-complexity": ["warn", 15],
  "sonarjs/content-security-policy": "warn",
  "sonarjs/disabled-resource-integrity": "error",
  "sonarjs/disabled-timeout": "error",
  "sonarjs/dompurify-unsafe-config": "error",
  "sonarjs/dynamically-constructed-templates": "error",
  "sonarjs/encryption-secure-mode": "warn",
  "sonarjs/explicit-test-skip": "error", // Manually fixable by editor suggestions.
  "sonarjs/file-permissions": "warn",
  "sonarjs/file-uploads": "warn",
  "sonarjs/hardcoded-secret-signatures": "warn",
  "sonarjs/hashing": "warn",
  "sonarjs/hooks-before-test-cases": "error",
  "sonarjs/inconsistent-function-call": "error",
  "sonarjs/insecure-jwt-token": "error",
  "sonarjs/inverted-assertion-arguments": "error", // Manually fixable by editor suggestions.
  "sonarjs/jsx-no-leaked-render": "error", // Manually fixable by editor suggestions.
  "sonarjs/link-with-target-blank": "error",
  "sonarjs/memoize-cache-key": "error",
  "sonarjs/misplaced-loop-counter": "error",
  "sonarjs/no-all-duplicated-branches": "error",
  "sonarjs/no-angular-bypass-sanitization": "error",
  "sonarjs/no-async-constructor": "error",
  "sonarjs/no-code-after-done": "error",
  "sonarjs/no-debounce-throttle-in-render": "error",
  "sonarjs/no-debug-commands-in-ui-tests": "error", // Automatically fixable by the --fix command.
  "sonarjs/no-default-utility-imports": "error",
  "sonarjs/no-duplicate-parameterized-test-case": "error", // Automatically fixable by the --fix command.
  "sonarjs/no-duplicate-test-title": "error",
  "sonarjs/no-duplicated-branches": "error",
  "sonarjs/no-element-overwrite": "error",
  "sonarjs/no-empty-collection": "error",
  "sonarjs/no-empty-parameterized-test-dataset": "error",
  "sonarjs/no-empty-test-file": "error",
  "sonarjs/no-empty-test-title": "error",
  "sonarjs/no-equals-in-for-termination": "error",
  "sonarjs/no-exclusive-tests": "error", // Manually fixable by editor suggestions.
  "sonarjs/no-fixed-wait-in-tests": "error",
  "sonarjs/no-floating-point-equality": "warn",
  "sonarjs/no-forced-browser-interaction": "error",
  "sonarjs/no-hardcoded-ip": "warn",
  "sonarjs/no-hardcoded-passwords": [
    "warn",
    { passwordWords: ["password", "pwd", "passwd", "passphrase"] },
  ],
  "sonarjs/no-hardcoded-secrets": [
    "warn",
    {
      randomnessSensibility: 5,
      secretWords: "api[_.-]?key,auth,credential,secret,token",
    },
  ],
  "sonarjs/no-identical-functions": ["warn", 3],
  "sonarjs/no-incompatible-assertion-types": "error",
  "sonarjs/no-incomplete-assertions": "error",
  "sonarjs/no-internal-api-use": "error",
  "sonarjs/no-interpolation-in-inline-snapshots": "error",
  "sonarjs/no-invariant-returns": "error",
  "sonarjs/no-literal-call": "error",
  "sonarjs/no-mime-sniff": "warn",
  "sonarjs/no-mutate-reactive-state-in-updated-hook": "error",
  "sonarjs/no-os-command-from-path": "warn",
  "sonarjs/no-referrer-policy": "warn",
  "sonarjs/no-same-argument-assert": "error",
  "sonarjs/no-selector-parameter": "warn",
  "sonarjs/no-session-cookies-on-static-assets": "error",
  "sonarjs/no-skipped-tests": "warn",
  "sonarjs/no-small-switch": "error",
  "sonarjs/no-table-as-layout": "error",
  "sonarjs/no-trivial-assertions": "error", // Manually fixable by editor suggestions.
  "sonarjs/no-try-promise": "error",
  "sonarjs/no-uniq-key": "error",
  "sonarjs/no-unthrown-error": "error", // Manually fixable by editor suggestions.
  "sonarjs/no-unused-collection": "error",
  "sonarjs/no-use-of-empty-return-value": "error",
  "sonarjs/no-useless-increment": "error",
  "sonarjs/no-useless-react-setstate": "error",
  "sonarjs/no-vue-class-component": "error",
  "sonarjs/no-vue-mixins": "error",
  "sonarjs/no-weak-cipher": "warn",
  "sonarjs/no-weak-keys": "warn",
  "sonarjs/non-existent-operator": "error", // Manually fixable by editor suggestions.
  "sonarjs/object-alt-content": "error",
  "sonarjs/parameterized-tests": "warn",
  "sonarjs/post-message": "error",
  "sonarjs/prefer-cypress-should": "error", // Manually fixable by editor suggestions.
  "sonarjs/prefer-native-axios-alternative": "error", // Manually fixable by editor suggestions.
  "sonarjs/prefer-native-jquery-alternative": "warn",
  "sonarjs/prefer-native-lodash-alternative": "warn",
  "sonarjs/prefer-specific-assertions": "error", // Manually fixable by editor suggestions.
  "sonarjs/production-debug": "error",
  "sonarjs/pseudo-random": "warn",
  "sonarjs/public-static-readonly": "error", // Manually fixable by editor suggestions.
  "sonarjs/publicly-writable-directories": "warn",
  "sonarjs/reduce-initial-value": "error",
  "sonarjs/redundant-type-aliases": "warn",
  "sonarjs/regex-complexity": ["warn", { threshold: 20 }],
  "sonarjs/review-blockchain-mnemonic": "warn",
  "sonarjs/session-regeneration": "warn",
  "sonarjs/sql-queries": "warn",
  "sonarjs/stable-tests": "error",
  "sonarjs/stateful-regex": "error",
  "sonarjs/strict-transport-security": "warn",
  "sonarjs/synchronous-exception-assertions": "error", // Manually fixable by editor suggestions.
  "sonarjs/synchronous-suite-callback": "error", // Manually fixable by editor suggestions.
  "sonarjs/table-header": "error",
  "sonarjs/table-header-reference": "error",
  "sonarjs/test-check-exception": "error",
  "sonarjs/testing-library-prefer-query-by-disappearance": "error", // Automatically fixable by the --fix command.
  "sonarjs/testing-library-query-assertion": "error", // Automatically fixable by the --fix command.
  "sonarjs/unverified-certificate": "error",
  "sonarjs/unverified-hostname": "error",
  "sonarjs/updated-loop-counter": "error",
  "sonarjs/use-type-alias": "warn",
  "sonarjs/vitest-mock-at-module-scope": "error",
  "sonarjs/weak-ssl": "warn",
  "sonarjs/x-powered-by": "warn",
  "sonarjs/xml-parser-xxe": "error",

  // --- Turned off rules (98/230) ------------------------------------------------------------------------------------------------------------------.
  "sonarjs/argument-type": "off", // Handled by the TypeScript compiler and `@typescript-eslint/no-unsafe-argument`.
  "sonarjs/array-callback-without-return": "off", // Handled by `array-callback-return`, including untyped JavaScript.
  "sonarjs/avoid-mutating-nested-properties-of-shallow-clones": "off", // Handled by `functional/immutable-data`, which covers mutations beyond Lodash clones. Manually fixable by editor suggestions.
  "sonarjs/bitwise-operators": "off", // Handled by `no-bitwise` and `unicorn/no-accidental-bitwise-operator`.
  "sonarjs/block-scoped-var": "off", // Handled by `block-scoped-var`.
  "sonarjs/call-argument-line": "off", // Handled by Prettier.
  "sonarjs/class-name": "off", // Handled by `@typescript-eslint/naming-convention`.
  "sonarjs/code-eval": "off", // Handled by `no-eval` and `no-new-func`.
  "sonarjs/comma-or-logical-or-case": "off", // Handled by `no-sequences`, `no-constant-binary-expression`, while `sonarjs/no-nested-switch` keeps dispatch logic readable.
  "sonarjs/concise-regex": "off", // Handled by `regexp/prefer-d`, `regexp/prefer-w`, and `regexp/prefer-quantifier`.
  "sonarjs/constructor-for-side-effects": "off", // Handled by `no-new`.
  "sonarjs/content-length": "off", // Handled by `express-security/require-express-body-parser-limits`.
  "sonarjs/cookie-no-httponly": "off", // Handled by `express-security/no-insecure-cookie-options`.
  "sonarjs/cors": "off", // Handled by `express-security/no-permissive-cors`.
  "sonarjs/csrf": "off", // Handled by `express-security/require-csrf-protection`.
  "sonarjs/deprecation": "off", // Handled by `@typescript-eslint/no-deprecated`.
  "sonarjs/different-types-comparison": "off", // Handled by `@typescript-eslint/no-unnecessary-condition`. Manually fixable by editor suggestions.
  "sonarjs/disabled-auto-escaping": "off", // Handled by `security/detect-disable-mustache-escape`; retain the existing untyped template-escape check.
  "sonarjs/duplicates-in-character-class": "off", // Handled by `regexp/no-dupe-characters-character-class`.
  "sonarjs/empty-string-repetition": "off", // Handled by `regexp/no-useless-quantifier` and `regexp/no-optional-assertion`.
  "sonarjs/existing-groups": "off", // Handled by `regexp/no-useless-dollar-replacements`.
  "sonarjs/fixme-tag": "off", // Handled by `unicorn/expiring-todo-comments`; actionable comments are allowed.
  "sonarjs/for-loop-increment-sign": "off", // Handled by `for-direction`.
  "sonarjs/function-inside-loop": "off", // Handled by `no-loop-func` and `unicorn/consistent-function-scoping`.
  "sonarjs/function-return-type": "off", // Intentional union return types are valid and checked by TypeScript.
  "sonarjs/future-reserved-words": "off", // The parser rejects reserved identifiers; future naming restrictions would constrain valid modern code.
  "sonarjs/generator-without-yield": "off", // Handled by `require-yield`.
  "sonarjs/in-operator-type-error": "off", // Handled by the TypeScript compiler.
  "sonarjs/index-of-compare-to-positive-number": "off", // Handled by `unicorn/prefer-includes`.
  "sonarjs/insecure-cookie": "off", // Handled by `express-security/no-insecure-cookie-options`.
  "sonarjs/label-position": "off", // Handled by `no-labels`.
  "sonarjs/max-switch-cases": "off", // A flat dispatch table or exhaustive switch can remain readable with many cases.
  "sonarjs/new-operator-misuse": "off", // Handled by `unicorn/new-for-builtins`, `no-new-native-nonconstructor`, and the TypeScript compiler.
  "sonarjs/no-alphabetical-sort": "off", // Handled by `unicorn/require-array-sort-compare` and `@typescript-eslint/require-array-sort-compare`. Manually fixable by editor suggestions.
  "sonarjs/no-array-delete": "off", // Handled by `@typescript-eslint/no-array-delete` in the same type-aware scope.
  "sonarjs/no-associative-arrays": "off", // Handled by `unicorn/no-collection-bracket-access` and the TypeScript compiler.
  "sonarjs/no-case-label-in-switch": "off", // Handled by `no-labels`.
  "sonarjs/no-clear-text-protocols": "off", // Handled by `unicorn/prefer-https`; other transport protocols depend on deployment context.
  "sonarjs/no-collection-size-mischeck": "off", // Handled by `unicorn/no-impossible-length-comparison` and `unicorn/explicit-length-check`. Manually fixable by editor suggestions.
  "sonarjs/no-control-regex": "off", // Handled by `regexp/no-control-character`.
  "sonarjs/no-dead-store": "off", // Handled by `no-useless-assignment`.
  "sonarjs/no-delete-var": "off", // Handled by `no-delete-var`.
  "sonarjs/no-duplicate-in-composite": "off", // Handled by `@typescript-eslint/no-duplicate-type-constituents`. Manually fixable by editor suggestions.
  "sonarjs/no-empty-after-reluctant": "off", // Handled by `regexp/no-lazy-ends`.
  "sonarjs/no-empty-alternatives": "off", // Handled by `regexp/no-empty-alternative`.
  "sonarjs/no-empty-character-class": "off", // Handled by `regexp/no-empty-character-class`.
  "sonarjs/no-empty-group": "off", // Handled by `regexp/no-empty-group`.
  "sonarjs/no-extra-arguments": "off", // Handled by `unicorn/no-invalid-argument-count` and the TypeScript compiler.
  "sonarjs/no-fallthrough": "off", // Handled by `no-fallthrough`.
  "sonarjs/no-global-this": "off", // Handled by `unicorn/no-this-outside-of-class`. Manually fixable by editor suggestions.
  "sonarjs/no-globals-shadowing": "off", // Handled by `no-shadow-restricted-names`.
  "sonarjs/no-gratuitous-expressions": "off", // Handled by `no-constant-condition`, `no-constant-binary-expression`, and `@typescript-eslint/no-unnecessary-condition`.
  "sonarjs/no-hook-setter-in-body": "off", // Handled by `react-hooks/set-state-in-render`.
  "sonarjs/no-identical-conditions": "off", // Handled by `no-dupe-else-if` and `no-duplicate-case`.
  "sonarjs/no-identical-expressions": "off", // Handled by `no-self-compare` and `unicorn/no-duplicate-logical-operands`.
  "sonarjs/no-ignored-exceptions": "off", // Handled by `no-empty`; an explanatory comment documents intentional handling.
  "sonarjs/no-ignored-return": "off", // Handled by `unicorn/no-unused-builtin-method-return`; retain its untyped and modern collection coverage.
  "sonarjs/no-implicit-global": "off", // Handled by `no-undef` and `no-implicit-globals`.
  "sonarjs/no-in-misuse": "off", // The in operator can intentionally check sparse arrays; use explicit collection APIs for value membership. Manually fixable by editor suggestions.
  "sonarjs/no-invalid-regexp": "off", // Handled by `regexp/no-invalid-regexp`.
  "sonarjs/no-inverted-boolean-check": "off", // Handled by `unicorn/no-negated-comparison` and `unicorn/no-negation-in-equality-check`. Manually fixable by editor suggestions.
  "sonarjs/no-labels": "off", // Handled by `no-labels`.
  "sonarjs/no-misleading-array-reverse": "off", // Handled by `unicorn/no-array-reverse` and `unicorn/no-array-sort`. Manually fixable by editor suggestions.
  "sonarjs/no-misleading-character-class": "off", // Handled by `regexp/no-misleading-unicode-character`. Manually fixable by editor suggestions.
  "sonarjs/no-nested-assignment": "off", // Handled by `no-multi-assign`, `no-return-assign`, and `no-cond-assign`; retain the existing expression policy.
  "sonarjs/no-nested-conditional": "off", // Handled by `no-nested-ternary`, which agrees with Prettier.
  "sonarjs/no-nested-functions": "off", // Handled by `max-nested-callbacks`.
  "sonarjs/no-nested-template-literals": "off", // Nested templates can preserve readable expressions; Prettier handles their layout.
  "sonarjs/no-parameter-reassignment": "off", // Handled by `no-param-reassign`, which also catches reassignments after the first use.
  "sonarjs/no-primitive-wrappers": "off", // Handled by `no-new-wrappers` and `@typescript-eslint/no-wrapper-object-types`. Manually fixable by editor suggestions.
  "sonarjs/no-redundant-assignments": "off", // Handled by `no-self-assign`.
  "sonarjs/no-redundant-boolean": "off", // Handled by `unicorn/no-unnecessary-boolean-comparison`, `no-constant-binary-expression`, and `no-extra-boolean-cast`. Manually fixable by editor suggestions.
  "sonarjs/no-redundant-jump": "off", // Handled by `no-useless-return` and `unicorn/no-useless-continue`; explicit switch breaks remain consistent. Manually fixable by editor suggestions.
  "sonarjs/no-redundant-optional": "off", // Explicit undefined permits intentional assignment with exactOptionalPropertyTypes. Manually fixable by editor suggestions.
  "sonarjs/no-regex-spaces": "off", // Handled by `regexp/no-useless-quantifier` and `regexp/prefer-quantifier`. Manually fixable by editor suggestions.
  "sonarjs/no-same-line-conditional": "off", // Handled by Prettier. Manually fixable by editor suggestions.
  "sonarjs/no-undefined-argument": "off", // Handled by `unicorn/no-useless-undefined`. Manually fixable by editor suggestions.
  "sonarjs/no-unenclosed-multiline-block": "off", // Handled by `curly`.
  "sonarjs/no-unused-vars": "off", // Handled by `unused-imports/no-unused-vars`.
  "sonarjs/no-useless-catch": "off", // Handled by `no-useless-catch`.
  "sonarjs/no-useless-intersection": "off", // Handled by `@typescript-eslint/no-redundant-type-constituents`.
  "sonarjs/null-dereference": "off", // Handled by strict TypeScript null checking; it cannot provide this analysis in untyped files.
  "sonarjs/prefer-default-last": "off", // Handled by `default-case-last`.
  "sonarjs/prefer-promise-shorthand": "off", // Handled by `unicorn/prefer-promise-static-methods` and `promise/avoid-new`. Manually fixable by editor suggestions.
  "sonarjs/prefer-read-only-props": "off", // Handled by `functional/prefer-immutable-types` for function parameters. Manually fixable by editor suggestions.
  "sonarjs/prefer-regexp-exec": "off", // Prefer `regexp/prefer-regexp-exec` for manual review of non-global match rewrites. Manually fixable by editor suggestions.
  "sonarjs/prefer-single-boolean-return": "off", // Handled by `unicorn/prefer-boolean-return`. Manually fixable by editor suggestions.
  "sonarjs/prefer-type-guard": "off", // Inferred type predicates can be clearer than assertions; TypeScript infers them when safe. Manually fixable by editor suggestions.
  "sonarjs/prefer-while": "off", // Handled by `unicorn/no-for-loop` and `unicorn/prefer-while-loop-condition`. Automatically fixable by the --fix command.
  "sonarjs/single-char-in-character-classes": "off", // Handled by `regexp/no-useless-character-class`.
  "sonarjs/single-character-alternation": "off", // Handled by `regexp/prefer-character-class`.
  "sonarjs/slow-regex": "off", // Handled by `regexp/no-super-linear-backtracking` and `regexp/no-super-linear-move`.
  "sonarjs/super-linear-regex": "off", // Handled by `regexp/no-super-linear-backtracking` and `regexp/no-super-linear-move`.
  "sonarjs/todo-tag": "off", // Handled by `unicorn/expiring-todo-comments`; actionable comments are allowed.
  "sonarjs/unused-import": "off", // Handled by `unused-imports/no-unused-imports`, which also removes imports automatically. Manually fixable by editor suggestions.
  "sonarjs/unused-named-groups": "off", // Handled by `regexp/no-unused-capturing-group`.
  "sonarjs/updated-const-var": "off", // Handled by `no-const-assign` and the TypeScript compiler.
  "sonarjs/void-use": "off", // Handled by `no-void` and `@typescript-eslint/no-invalid-void-type`.
} as const;

const otherRules: Rules = {
  // --- Rules with default options (11/65) ---------------------------------------------------------------------------------------------------------.
  // Keep this AWS CDK check active even when the root manifest omits CDK.
  "sonarjs/aws-iam-all-resources-accessible": "error",
  "sonarjs/class-prototype": "error",
  "sonarjs/composite-assertions": "error",
  "sonarjs/expression-complexity": ["warn", { max: 3 }],
  "sonarjs/no-commented-code": "warn", // Manually fixable by editor suggestions.
  "sonarjs/no-mixed-completion-style": "error",
  "sonarjs/no-nested-incdec": "error",
  "sonarjs/no-nested-switch": "error",
  "sonarjs/no-networkidle-wait": "error",
  "sonarjs/no-sonar-comments": "error",
  // Complemented by `require-unicode-regexp` for general flag enforcement on regex literals and constructors.
  "sonarjs/unicode-aware-regex": "error",

  // --- Turned off rules (54/65) -------------------------------------------------------------------------------------------------------------------.
  "sonarjs/arguments-usage": "off", // Handled by `prefer-rest-params`.
  "sonarjs/array-constructor": "off", // Handled by `@typescript-eslint/no-array-constructor` and `unicorn/no-new-array`. Manually fixable by editor suggestions.
  "sonarjs/arrow-function-convention": "off", // Handled by `arrow-body-style` and Prettier.
  "sonarjs/bool-param-default": "off", // Handled by `@typescript-eslint/default-param-last` and TypeScript; defaults should follow API semantics.
  "sonarjs/comment-regex": "off", // Comment restrictions depend on the project; no universal pattern is required.
  "sonarjs/conditional-indentation": "off", // Deprecated upstream; keep the rule disabled.
  "sonarjs/confidential-information-logging": "off", // Deprecated upstream; keep the rule disabled.
  "sonarjs/cyclomatic-complexity": "off", // Handled by `complexity`; cognitive complexity measures the separate readability cost.
  "sonarjs/declarations-in-global-scope": "off", // Handled by `import-x/unambiguous` and `no-implicit-globals`.
  "sonarjs/destructuring-assignment-syntax": "off", // Handled by `@typescript-eslint/prefer-destructuring` and `prefer-destructuring`.
  "sonarjs/elseif-without-else": "off", // An exhaustive else is unnecessary when no action is required.
  "sonarjs/file-header": "off", // Copyright and license headers depend on the project.
  "sonarjs/file-name-differ-from-class": "off", // Handled by `unicorn/filename-case` and `import-x/no-anonymous-default-export` without coupling each module to a class.
  "sonarjs/for-in": "off", // Handled by `guard-for-in`.
  "sonarjs/frame-ancestors": "off", // Deprecated upstream; keep the rule disabled.
  "sonarjs/function-name": "off", // Handled by `@typescript-eslint/naming-convention`.
  "sonarjs/hidden-files": "off", // Deprecated upstream; keep the rule disabled.
  "sonarjs/max-lines": "off", // Handled by `max-lines`.
  "sonarjs/max-lines-per-function": "off", // Handled by `max-lines-per-function`.
  "sonarjs/max-union-size": "off", // Discriminated unions should model the domain without an arbitrary constituent limit.
  "sonarjs/nested-control-flow": "off", // Handled by `max-depth`.
  "sonarjs/no-built-in-override": "off", // Handled by `no-global-assign`, `no-extend-native`, and `unicorn/no-global-object-property-assignment`.
  "sonarjs/no-collapsible-if": "off", // Handled by `unicorn/prefer-combined-guards`.
  "sonarjs/no-duplicate-string": "off", // Repeated literals can be clearer than abstractions introduced only to satisfy a count.
  "sonarjs/no-for-in-iterable": "off", // Handled by `@typescript-eslint/no-for-in-array`.
  "sonarjs/no-function-declaration-in-block": "off", // Handled by `no-inner-declarations`.
  "sonarjs/no-implicit-dependencies": "off", // Handled by `import-x/no-extraneous-dependencies`.
  "sonarjs/no-inconsistent-returns": "off", // Handled by the TypeScript compiler (`ts(7030)`) with `noImplicitReturns`.
  "sonarjs/no-incorrect-string-concat": "off", // Handled by `@typescript-eslint/restrict-plus-operands`.
  "sonarjs/no-intrusive-permissions": "off", // Deprecated upstream; keep the rule disabled.
  "sonarjs/no-ip-forward": "off", // Deprecated upstream; keep the rule disabled.
  "sonarjs/no-mixed-content": "off", // Deprecated upstream; keep the rule disabled.
  "sonarjs/no-redundant-parentheses": "off", // Deprecated upstream; keep the rule disabled. Manually fixable by editor suggestions.
  "sonarjs/no-reference-error": "off", // Handled by `no-undef` and the TypeScript compiler.
  "sonarjs/no-require-or-define": "off", // Handled by `@typescript-eslint/no-require-imports` and `import-x/no-amd`.
  "sonarjs/no-return-type-any": "off", // Handled by `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unsafe-return`.
  "sonarjs/no-tab": "off", // Deprecated upstream; keep the rule disabled.
  "sonarjs/no-undefined-assignment": "off", // Handled by `no-undefined` and `unicorn/no-useless-undefined`.
  "sonarjs/no-unsafe-unzip": "off", // Deprecated upstream; keep the rule disabled.
  "sonarjs/no-unused-function-argument": "off", // Handled by `unused-imports/no-unused-vars`. Manually fixable by editor suggestions.
  "sonarjs/no-variable-usage-before-declaration": "off", // Handled by `@typescript-eslint/no-use-before-define` and `no-use-before-define`.
  "sonarjs/no-wildcard-import": "off", // Namespace imports are useful for APIs such as TypeScript; import style is handled by `unicorn/import-style`.
  "sonarjs/non-number-in-arithmetic-expression": "off", // Handled by the TypeScript compiler and `@typescript-eslint/restrict-plus-operands`.
  "sonarjs/operation-returning-nan": "off", // Handled by `@typescript-eslint/restrict-plus-operands` and the TypeScript compiler.
  "sonarjs/os-command": "off", // Deprecated upstream; keep the rule disabled.
  "sonarjs/prefer-immediate-return": "off", // Named intermediate values can improve readability and debugging. Automatically fixable by the --fix command.
  "sonarjs/prefer-object-literal": "off", // Handled by `no-object-constructor`.
  "sonarjs/shorthand-property-grouping": "off", // Handled by `perfectionist/sort-objects`.
  "sonarjs/strings-comparison": "off", // String ordering is valid when lexicographic comparison is intended.
  "sonarjs/too-many-break-or-continue-in-loop": "off", // Early loop exits can reduce nesting and improve readability.
  "sonarjs/useless-string-operation": "off", // Deprecated upstream; keep the rule disabled.
  "sonarjs/values-not-convertible-to-numbers": "off", // Handled by the TypeScript compiler and `@typescript-eslint/no-unnecessary-condition`.
  "sonarjs/variable-name": "off", // Handled by `@typescript-eslint/naming-convention`.
  "sonarjs/web-sql-database": "off", // Deprecated upstream; keep the rule disabled.
} as const;

const sonarjsRules: Rules = {
  ...recommendedRules, // 230/295 rules, 5 automatically fixable, 36 editor suggestions fixable.
  ...otherRules, // 65/295 rules, 1 automatically fixable, 4 editor suggestions fixable.
} as const;

export { sonarjsRules };
