import {
	classMethodsUseThisOptions,
	consistentReturnOptions,
	dotNotationOptions,
	maxParamsOptions,
	noEmptyFunctionOptions,
	noShadowOptions,
	noUnusedExpressionsOptions,
	noUnusedVarsOptions,
	noUseBeforeDefineOptions,
	preferDestructuring1stOptions,
	preferDestructuring2ndOptions,
	preferPromiseRejectErrorsOptions,
} from '../common.js';

const tsEslintDeprecatedConflictedEslintRecommendedRules = {
	// "no-new-symbol" was deprecated in ESLint 9.0.0 and will be removed in
	// ESLint v11.0.0. See:
	// https://eslint.org/docs/latest/rules/no-new-symbol
	// We need to keep the rule disabled until TSESLint drops support for
	// ESlint 8. See:
	// https://github.com/typescript-eslint/typescript-eslint/pull/8895
	'no-new-symbol': 'off', // ts(7009)
};

const tsEslintConflictedEslintRecommendedRules = {
	'constructor-super': 'off', // ts(2335) & ts(2377)
	'getter-return': 'off', // ts(2378)
	'no-class-assign': 'off', // ts(2629)
	'no-const-assign': 'off', // ts(2588)
	'no-dupe-args': 'off', // ts(2300)
	'no-dupe-class-members': 'off', // ts(2393) & ts(2300)
	'no-dupe-keys': 'off', // ts(1117)
	'no-func-assign': 'off', // ts(2630)
	'no-import-assign': 'off', // ts(2632) & ts(2540)
	'no-new-native-nonconstructor': 'off', // ts(7009)
	'no-obj-calls': 'off', // ts(2349)
	'no-redeclare': 'off', // ts(2451)
	'no-setter-return': 'off', // ts(2408)
	'no-this-before-super': 'off', // ts(2376) & ts(17009)
	'no-undef': 'off', // ts(2304) & ts(2552)
	'no-unreachable': 'off', // ts(7027)
	'no-unsafe-negation': 'off', // ts(2365) & ts(2322) & ts(2358)
	'no-with': 'off', // ts(1101) & ts(2410)

	...tsEslintDeprecatedConflictedEslintRecommendedRules,
};

const tsEslintRecommendedRules = {
	'@typescript-eslint/no-duplicate-enum-values': 'error',
	'@typescript-eslint/no-explicit-any': [
		'error',
		{
			fixToUnknown: false,
			ignoreRestArgs: false,
		},
	],
	'@typescript-eslint/no-extra-non-null-assertion': 'error',
	'@typescript-eslint/no-misused-new': 'error',
	'@typescript-eslint/no-namespace': [
		'error',
		{
			allowDeclarations: false,
			allowDefinitionFiles: true,
		},
	],
	'@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
	'@typescript-eslint/no-require-imports': [
		'error',
		{
			allow: [],
			allowAsImport: false,
		},
	],
	'@typescript-eslint/no-this-alias': [
		'error',
		{
			allowDestructuring: true,
			allowedNames: [],
		},
	],
	'@typescript-eslint/no-unnecessary-type-constraint': 'error',
	'@typescript-eslint/no-unsafe-declaration-merging': 'error',
	'@typescript-eslint/no-unsafe-function-type': 'error',
	'@typescript-eslint/no-wrapper-object-types': 'error',
	'@typescript-eslint/prefer-as-const': 'error',
	'@typescript-eslint/prefer-namespace-keyword': 'error',

	'no-array-constructor': 'off',
	'@typescript-eslint/no-array-constructor': 'error',

	// Rules with overridden options
	'@typescript-eslint/ban-ts-comment': [
		'error',
		{
			'ts-check': false,
			'ts-expect-error': 'allow-with-description',
			'ts-ignore': true,
			'ts-nocheck': true,
			minimumDescriptionLength: 10,
		},
	],
	'@typescript-eslint/no-empty-object-type': [
		'error',
		{
			allowInterfaces: 'with-single-extends',
			allowObjectTypes: 'never',
			allowWithName: '',
		},
	],
	'@typescript-eslint/triple-slash-reference': [
		'error',
		{
			lib: 'never',
			path: 'never',
			types: 'never',
		},
	],

	'no-unused-expressions': 'off',
	'@typescript-eslint/no-unused-expressions': ['error', { ...noUnusedExpressionsOptions }],

	'no-unused-vars': 'off',
	'@typescript-eslint/no-unused-vars': ['error', { ...noUnusedVarsOptions }],
};

const tsEslintRecommendedTypeCheckedOnlyRules = {
	'@typescript-eslint/await-thenable': 'error',
	'@typescript-eslint/no-array-delete': 'error',
	'@typescript-eslint/no-base-to-string': [
		'error',
		{
			checkUnknown: false,
			ignoredTypeNames: ['Error', 'RegExp', 'URL', 'URLSearchParams'],
		},
	],
	'@typescript-eslint/no-duplicate-type-constituents': [
		'error',
		{
			ignoreIntersections: false,
			ignoreUnions: false,
		},
	],
	'@typescript-eslint/no-for-in-array': 'error',
	'@typescript-eslint/no-misused-promises': [
		'error',
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
	'@typescript-eslint/no-redundant-type-constituents': 'error',
	'@typescript-eslint/no-unnecessary-type-assertion': 'error',
	'@typescript-eslint/no-unsafe-argument': 'error',
	'@typescript-eslint/no-unsafe-assignment': 'error',
	'@typescript-eslint/no-unsafe-call': 'error',
	'@typescript-eslint/no-unsafe-enum-comparison': 'error',
	'@typescript-eslint/no-unsafe-member-access': ['error', { allowOptionalChaining: false }],
	'@typescript-eslint/no-unsafe-return': 'error',
	'@typescript-eslint/no-unsafe-unary-minus': 'error',
	'@typescript-eslint/unbound-method': ['error', { ignoreStatic: false }],

	'no-implied-eval': 'off',
	'@typescript-eslint/no-implied-eval': 'error',

	'prefer-promise-reject-errors': 'off',
	'@typescript-eslint/prefer-promise-reject-errors': [
		'error',
		{
			...preferPromiseRejectErrorsOptions,
			allow: [],
			allowThrowingAny: false,
			allowThrowingUnknown: false,
		},
	],

	'require-await': 'off',
	'@typescript-eslint/require-await': 'error',

	// Rules with overridden options
	'@typescript-eslint/no-floating-promises': [
		'error',
		{
			allowForKnownSafeCalls: [],
			allowForKnownSafePromises: [],
			checkThenables: false,
			ignoreIIFE: true,
			ignoreVoid: true,
		},
	],
	'@typescript-eslint/restrict-plus-operands': [
		'error',
		{
			allowAny: false,
			allowBoolean: false,
			allowNullish: false,
			allowNumberAndString: false,
			allowRegExp: false,
			skipCompoundAssignments: false,
		},
	],
	'@typescript-eslint/restrict-template-expressions': [
		'error',
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

	'no-throw-literal': 'off',
	'@typescript-eslint/only-throw-error': [
		'error',
		{
			allow: [],
			allowRethrowing: true,
			allowThrowingAny: false,
			allowThrowingUnknown: false,
		},
	],
};

const tsEslintStylisticRules = {
	'@typescript-eslint/ban-tslint-comment': 'error',
	'@typescript-eslint/class-literal-property-style': ['error', 'fields'],
	'@typescript-eslint/consistent-generic-constructors': ['error', 'constructor'],
	'@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
	'@typescript-eslint/no-confusing-non-null-assertion': 'error',
	'@typescript-eslint/no-inferrable-types': [
		'error',
		{
			ignoreParameters: false,
			ignoreProperties: false,
		},
	],
	'@typescript-eslint/prefer-for-of': 'error',
	'@typescript-eslint/prefer-function-type': 'error',

	'no-empty-function': 'off',
	'@typescript-eslint/no-empty-function': ['error', { ...noEmptyFunctionOptions }],

	// Rules with overridden options
	'@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
	'@typescript-eslint/consistent-type-assertions': [
		'error',
		{
			arrayLiteralTypeAssertions: 'allow-as-parameter',
			assertionStyle: 'as',
			objectLiteralTypeAssertions: 'allow-as-parameter',
		},
	],
	'@typescript-eslint/consistent-type-definitions': ['error', 'type'],

	// Turned off rules
	'@typescript-eslint/adjacent-overload-signatures': 'off', // Use ESLint's perfectionist/sort-object-types and perfectionist/sort-interfaces rule instead
};

const tsEslintStylisticTypeCheckedOnlyRules = {
	'@typescript-eslint/non-nullable-type-assertion-style': 'error',
	'@typescript-eslint/prefer-find': 'error',
	'@typescript-eslint/prefer-includes': 'error',
	'@typescript-eslint/prefer-regexp-exec': 'error',
	'@typescript-eslint/prefer-string-starts-ends-with': ['error', { allowSingleElementEquality: 'never' }],

	'dot-notation': 'off',
	'@typescript-eslint/dot-notation': [
		'error',
		{
			...dotNotationOptions,
			allowIndexSignaturePropertyAccess: false,
			allowPrivateClassPropertyAccess: false,
			allowProtectedClassPropertyAccess: false,
		},
	],

	// Rules with overridden options
	'@typescript-eslint/prefer-nullish-coalescing': [
		'error',
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
	'@typescript-eslint/prefer-optional-chain': [
		'error',
		{
			allowPotentiallyUnsafeFixesThatModifyTheReturnTypeIKnowWhatImDoing: false,
			checkAny: true,
			checkUnknown: true,
			checkString: true,
			checkNumber: true,
			checkBoolean: true,
			checkBigInt: true,
			requireNullish: true,
		},
	],
};

const tsEslintStrictOnlyRules = {
	'@typescript-eslint/no-dynamic-delete': 'error',
	'@typescript-eslint/no-extraneous-class': [
		'error',
		{
			allowConstructorOnly: false,
			allowEmpty: false,
			allowStaticOnly: false,
			allowWithDecorator: true,
		},
	],
	'@typescript-eslint/no-invalid-void-type': [
		'error',
		{
			allowAsThisParameter: false,
			allowInGenericTypeArguments: true,
		},
	],
	'@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
	'@typescript-eslint/no-non-null-assertion': 'error',
	'@typescript-eslint/unified-signatures': [
		'error',
		{
			ignoreDifferentlyNamedParameters: false,
			ignoreOverloadsWithDifferentJSDoc: false,
		},
	],

	'no-useless-constructor': 'off',
	'@typescript-eslint/no-useless-constructor': 'error',

	// Rules with overridden options
	'@typescript-eslint/prefer-literal-enum-member': ['error', { allowBitwiseExpressions: true }],
};

const tsEslintStrictTypeCheckedOnlyRules = {
	'@typescript-eslint/no-confusing-void-expression': [
		'error',
		{
			ignoreArrowShorthand: false,
			ignoreVoidOperator: true,
		},
	],
	'@typescript-eslint/no-meaningless-void-operator': ['error', { checkNever: false }],
	'@typescript-eslint/no-deprecated': ['warn', { allow: [] }], // Warn only, never block compilation
	'@typescript-eslint/no-misused-spread': ['error', { allow: [] }],
	'@typescript-eslint/no-mixed-enums': 'error',
	'@typescript-eslint/no-unnecessary-boolean-literal-compare': [
		'error',
		{
			allowComparingNullableBooleansToFalse: true,
			allowComparingNullableBooleansToTrue: true,
			allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
		},
	],
	'@typescript-eslint/no-unnecessary-condition': [
		'error',
		{
			allowConstantLoopConditions: 'only-allowed-literals',
			allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
			checkTypePredicates: true,
		},
	],
	'@typescript-eslint/no-unnecessary-template-expression': 'error',
	'@typescript-eslint/no-unnecessary-type-arguments': 'error',
	'@typescript-eslint/no-unnecessary-type-conversion': 'error',
	'@typescript-eslint/no-unnecessary-type-parameters': 'error',
	'@typescript-eslint/no-useless-default-assignment': [
		'error',
		{ allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false },
	],
	'@typescript-eslint/prefer-reduce-type-parameter': 'error',
	'@typescript-eslint/prefer-return-this-type': 'error',
	'@typescript-eslint/related-getter-setter-pairs': 'error',
	'@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',

	// Rules with overridden options
	'no-return-await': 'off',
	'@typescript-eslint/return-await': ['error', 'always'],
};

const tsEslintDeprecatedOtherRules = {
	'@typescript-eslint/no-empty-interface': 'off', // Deprecated in favor of  @typescript-eslint/no-empty-object-type rule
	'@typescript-eslint/no-type-alias': 'off', // Deprecated in favor of the @typescript-eslint/consistent-type-definitions rule
	'@typescript-eslint/prefer-ts-expect-error': 'off', // Deprecated in favor of @typescript-eslint/ban-ts-comment rule
	'@typescript-eslint/sort-type-constituents': 'off', // Deprecated in favor of the perfectionist/sort-intersection-types and perfectionist/sort-union-types rule
	'@typescript-eslint/no-var-requires': 'off', // Deprecated in favour of the @typescript-eslint/no-require-imports rule

	'@typescript-eslint/no-loss-of-precision': 'off', // Deprecated because the base eslint/no-loss-of-precision added support for numeric separators

	// Will be removed in a future major version of typescript-eslint
	// Instead of enabling typedef, it is generally recommended to use the --noImplicitAny and
	// --strictPropertyInitialization compiler options to enforce type annotations only when useful
	'@typescript-eslint/typedef': 'off',
};

const tsEslintOtherRules = {
	'@typescript-eslint/consistent-type-imports': [
		'error',
		{
			disallowTypeAnnotations: true,
			fixStyle: 'separate-type-imports',
			prefer: 'type-imports',
		},
	],
	'@typescript-eslint/method-signature-style': ['error', 'property'],
	'@typescript-eslint/no-import-type-side-effects': 'error',
	'@typescript-eslint/no-unnecessary-parameter-property-assignment': 'error',
	'@typescript-eslint/no-unused-private-class-members': 'error',
	'@typescript-eslint/no-useless-empty-export': 'error',
	'@typescript-eslint/prefer-enum-initializers': 'error',

	'class-methods-use-this': 'off',
	'@typescript-eslint/class-methods-use-this': [
		'error',
		{
			...classMethodsUseThisOptions,
			ignoreClassesThatImplementAnInterface: 'public-fields',
			ignoreOverrideMethods: true,
		},
	],

	'default-param-last': 'off',
	'@typescript-eslint/default-param-last': 'error',

	'no-loop-func': 'off',
	'@typescript-eslint/no-loop-func': 'error',

	// Rules with overridden options
	'@typescript-eslint/explicit-member-accessibility': [
		'error',
		{
			accessibility: 'no-public',
			overrides: {
				constructors: 'off',
				parameterProperties: 'off',
			},
		},
	],

	'no-use-before-define': 'off',
	'@typescript-eslint/no-use-before-define': [
		'error',
		{
			...noUseBeforeDefineOptions,
			functions: false,
			typedefs: true,
		},
	],

	'max-params': 'off',
	'@typescript-eslint/max-params': [
		'error',
		{
			...maxParamsOptions,
			countVoidThis: false,
		},
	],

	'no-shadow': 'off',
	'@typescript-eslint/no-shadow': [
		'error',
		{
			...noShadowOptions,
			hoist: 'functions-and-types',
		},
	],

	// Turned off rules
	'@typescript-eslint/member-ordering': [
		'off', // Use perfectionist's sort-classes rule instead
		{
			default: {
				memberTypes: [
					// Static state (shared across instances — most "global", declared first)
					'public-static-field',
					'protected-static-field',
					'private-static-field',
					'#private-static-field',

					// Static initialization blocks
					'static-initialization',

					// Instance state (decorated fields first — they carry metadata worth seeing early)
					'public-decorated-field',
					'protected-decorated-field',
					'private-decorated-field',
					'public-instance-field',
					'protected-instance-field',
					'private-instance-field',
					'#private-instance-field',

					// Abstract fields
					'public-abstract-field',
					'protected-abstract-field',

					// Type-level signatures (structural, not runtime)
					'signature',
					'call-signature',

					// Construction (how instances come to life)
					'public-constructor',
					'protected-constructor',
					'private-constructor',

					// Static accessors & methods
					'public-static-accessor',
					'protected-static-accessor',
					'private-static-accessor',
					'#private-static-accessor',
					'public-static-get',
					'protected-static-get',
					'private-static-get',
					'#private-static-get',
					'public-static-set',
					'protected-static-set',
					'private-static-set',
					'#private-static-set',
					'public-static-method',
					'protected-static-method',
					'private-static-method',
					'#private-static-method',

					// Instance accessors (getters/setters sit near their backing fields)
					'public-decorated-accessor',
					'protected-decorated-accessor',
					'private-decorated-accessor',
					'public-instance-accessor',
					'protected-instance-accessor',
					'private-instance-accessor',
					'#private-instance-accessor',
					'public-abstract-accessor',
					'protected-abstract-accessor',
					'public-decorated-get',
					'protected-decorated-get',
					'private-decorated-get',
					'public-instance-get',
					'protected-instance-get',
					'private-instance-get',
					'#private-instance-get',
					'public-abstract-get',
					'protected-abstract-get',
					'public-decorated-set',
					'protected-decorated-set',
					'private-decorated-set',
					'public-instance-set',
					'protected-instance-set',
					'private-instance-set',
					'#private-instance-set',
					'public-abstract-set',
					'protected-abstract-set',

					// Instance methods (public API surface first, internals last)
					'public-decorated-method',
					'protected-decorated-method',
					'private-decorated-method',
					'public-instance-method',
					'protected-instance-method',
					'private-instance-method',
					'#private-instance-method',
					'public-abstract-method',
					'protected-abstract-method',
				],
				order: 'alphabetically-case-insensitive',
			},
		},
	],

	'@typescript-eslint/explicit-function-return-type': [
		'off',
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
	'@typescript-eslint/explicit-module-boundary-types': [
		'off',
		{
			allowArgumentsExplicitlyTypedAsAny: false,
			allowDirectConstAssertionInArrowFunctions: true,
			allowedNames: [],
			allowHigherOrderFunctions: true,
			allowOverloadFunctions: false,
			allowTypedFunctionExpressions: true,
		},
	],
	'@typescript-eslint/no-restricted-types': 'off',
	'@typescript-eslint/parameter-properties': 'off',

	// 'init-declarations': 'off', //Uncomment this if @typescript-eslint/init-declarations is enabled
	'@typescript-eslint/init-declarations': 'off',

	// 'no-dupe-class-members': 'off', // Uncomment this if @typescript-eslint/no-dupe-class-members is enabled
	'@typescript-eslint/no-dupe-class-members': 'off', // Not recommended to enable this in new TypeScript projects

	// 'no-invalid-this': 'off', // Uncomment this if @typescript-eslint/no-invalid-this is enabled
	'@typescript-eslint/no-invalid-this': 'off', // Not recommended to enable this in new TypeScript projects

	// 'no-magic-numbers': 'off', // Uncomment this if @typescript-eslint/no-magic-numbers is enabled
	'@typescript-eslint/no-magic-numbers': 'off',

	// 'no-redeclare': 'off', // Uncomment this if @typescript-eslint/no-redeclare is enabled
	'@typescript-eslint/no-redeclare': 'off', // Not recommended to enable this in new TypeScript projects

	// 'no-restricted-imports': 'off', // Uncomment this if @typescript-eslint/no-restricted-imports is enabled
	'@typescript-eslint/no-restricted-imports': 'off',

	...tsEslintDeprecatedOtherRules,
};

const tsEslintOtherTypeCheckedOnlyRules = {
	'@typescript-eslint/no-unnecessary-qualifier': 'error',
	'@typescript-eslint/no-unsafe-type-assertion': 'error',
	'@typescript-eslint/prefer-readonly': ['error', { onlyInlineLambdas: false }],
	'@typescript-eslint/promise-function-async': [
		'error',
		{
			allowAny: false,
			allowedPromiseNames: [],
			checkArrowFunctions: true,
			checkFunctionDeclarations: true,
			checkFunctionExpressions: true,
			checkMethodDeclarations: true,
		},
	],
	'@typescript-eslint/require-array-sort-compare': ['error', { ignoreStringArrays: true }],
	'@typescript-eslint/strict-boolean-expressions': [
		'error',
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
	'@typescript-eslint/strict-void-return': 'error',
	'@typescript-eslint/switch-exhaustiveness-check': [
		'error',
		{
			allowDefaultCaseForExhaustiveSwitch: true,
			considerDefaultExhaustiveForUnions: false,
			defaultCaseCommentPattern: '^no default$',
			requireDefaultForNonUnion: true,
		},
	],

	camelcase: 'off',
	'@typescript-eslint/naming-convention': [
		'error',
		{
			selector: 'default',
			format: ['camelCase'],
			leadingUnderscore: 'allow',
			trailingUnderscore: 'allow',
		},
		{
			selector: 'import',
			format: ['camelCase', 'PascalCase'],
		},
		{
			selector: 'variable',
			format: ['camelCase', 'UPPER_CASE'],
			leadingUnderscore: 'allow',
			trailingUnderscore: 'allow',
		},
		{
			selector: 'typeLike',
			format: ['PascalCase'],
		},
	],

	// Rules with overridden options
	'@typescript-eslint/consistent-type-exports': [
		'error',
		{
			fixMixedExportsWithInlineTypeSpecifier: true,
		},
	],

	'prefer-destructuring': 'off',
	'@typescript-eslint/prefer-destructuring': [
		'error',
		{ ...preferDestructuring1stOptions },
		{
			...preferDestructuring2ndOptions,
			enforceForDeclarationWithTypeAnnotation: false,
		},
	],

	// Turned off rules
	'@typescript-eslint/prefer-readonly-parameter-types': 'off',

	'consistent-return': 'off',
	'@typescript-eslint/consistent-return': ['off', { ...consistentReturnOptions }], // It's recommended to use tsconfig's noImplicitReturns option rather than this rule
};

const tsEslintDisableTypeChecked = {
	'@typescript-eslint/await-thenable': 'off',
	'@typescript-eslint/consistent-return': 'off',
	'@typescript-eslint/consistent-type-exports': 'off',
	'@typescript-eslint/dot-notation': 'off',
	'@typescript-eslint/naming-convention': 'off',
	'@typescript-eslint/no-array-delete': 'off',
	'@typescript-eslint/no-base-to-string': 'off',
	'@typescript-eslint/no-confusing-void-expression': 'off',
	'@typescript-eslint/no-deprecated': 'off',
	'@typescript-eslint/no-duplicate-type-constituents': 'off',
	'@typescript-eslint/no-floating-promises': 'off',
	'@typescript-eslint/no-for-in-array': 'off',
	'@typescript-eslint/no-implied-eval': 'off',
	'@typescript-eslint/no-meaningless-void-operator': 'off',
	'@typescript-eslint/no-misused-promises': 'off',
	'@typescript-eslint/no-misused-spread': 'off',
	'@typescript-eslint/no-mixed-enums': 'off',
	'@typescript-eslint/no-redundant-type-constituents': 'off',
	'@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
	'@typescript-eslint/no-unnecessary-condition': 'off',
	'@typescript-eslint/no-unnecessary-qualifier': 'off',
	'@typescript-eslint/no-unnecessary-template-expression': 'off',
	'@typescript-eslint/no-unnecessary-type-arguments': 'off',
	'@typescript-eslint/no-unnecessary-type-assertion': 'off',
	'@typescript-eslint/no-unnecessary-type-conversion': 'off',
	'@typescript-eslint/no-unnecessary-type-parameters': 'off',
	'@typescript-eslint/no-unsafe-argument': 'off',
	'@typescript-eslint/no-unsafe-assignment': 'off',
	'@typescript-eslint/no-unsafe-call': 'off',
	'@typescript-eslint/no-unsafe-enum-comparison': 'off',
	'@typescript-eslint/no-unsafe-member-access': 'off',
	'@typescript-eslint/no-unsafe-return': 'off',
	'@typescript-eslint/no-unsafe-type-assertion': 'off',
	'@typescript-eslint/no-unsafe-unary-minus': 'off',
	'@typescript-eslint/no-useless-default-assignment': 'off',
	'@typescript-eslint/non-nullable-type-assertion-style': 'off',
	'@typescript-eslint/only-throw-error': 'off',
	'@typescript-eslint/prefer-destructuring': 'off',
	'@typescript-eslint/prefer-find': 'off',
	'@typescript-eslint/prefer-includes': 'off',
	'@typescript-eslint/prefer-nullish-coalescing': 'off',
	'@typescript-eslint/prefer-optional-chain': 'off',
	'@typescript-eslint/prefer-promise-reject-errors': 'off',
	'@typescript-eslint/prefer-readonly': 'off',
	'@typescript-eslint/prefer-readonly-parameter-types': 'off',
	'@typescript-eslint/prefer-reduce-type-parameter': 'off',
	'@typescript-eslint/prefer-regexp-exec': 'off',
	'@typescript-eslint/prefer-return-this-type': 'off',
	'@typescript-eslint/prefer-string-starts-ends-with': 'off',
	'@typescript-eslint/promise-function-async': 'off',
	'@typescript-eslint/related-getter-setter-pairs': 'off',
	'@typescript-eslint/require-array-sort-compare': 'off',
	'@typescript-eslint/require-await': 'off',
	'@typescript-eslint/restrict-plus-operands': 'off',
	'@typescript-eslint/restrict-template-expressions': 'off',
	'@typescript-eslint/return-await': 'off',
	'@typescript-eslint/strict-boolean-expressions': 'off',
	'@typescript-eslint/strict-void-return': 'off',
	'@typescript-eslint/switch-exhaustiveness-check': 'off',
	'@typescript-eslint/unbound-method': 'off',
	'@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
};

const tsEslintRules = {
	...tsEslintConflictedEslintRecommendedRules,
	...tsEslintRecommendedRules,
	...tsEslintStrictOnlyRules,
	...tsEslintStylisticRules,
	...tsEslintOtherRules,
	...tsEslintDisableTypeChecked,
};

const tsEslintTypeCheckedRules = {
	...tsEslintConflictedEslintRecommendedRules,
	...tsEslintRecommendedRules,
	...tsEslintRecommendedTypeCheckedOnlyRules,
	...tsEslintStrictOnlyRules,
	...tsEslintStrictTypeCheckedOnlyRules,
	...tsEslintStylisticRules,
	...tsEslintStylisticTypeCheckedOnlyRules,
	...tsEslintOtherRules,
	...tsEslintOtherTypeCheckedOnlyRules,
};

export { tsEslintRules, tsEslintTypeCheckedRules };
