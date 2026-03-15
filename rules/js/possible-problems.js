const recommendedPossibleProblemRules = {
	'constructor-super': 'error',
	'for-direction': 'error',
	'getter-return': ['error', { allowImplicit: false }],
	'no-async-promise-executor': 'error',
	'no-class-assign': 'error',
	'no-compare-neg-zero': 'error',
	'no-cond-assign': ['error', 'except-parens'],
	'no-const-assign': 'error',
	'no-constant-binary-expression': 'error',
	'no-constant-condition': ['error', { checkLoops: 'allExceptWhileTrue' }],
	'no-control-regex': 'error',
	'no-debugger': 'error',
	'no-dupe-args': 'error',
	'no-dupe-class-members': 'error',
	'no-dupe-else-if': 'error',
	'no-dupe-keys': 'error',
	'no-duplicate-case': 'error',
	'no-empty-character-class': 'error',
	'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: false }],
	'no-ex-assign': 'error',
	'no-fallthrough': [
		'error',
		{
			allowEmptyCase: false,
			reportUnusedFallthroughComment: false,
		},
	],
	'no-func-assign': 'error',
	'no-import-assign': 'error',
	'no-invalid-regexp': ['error', {}],
	'no-irregular-whitespace': [
		'error',
		{
			skipComments: false,
			skipJSXText: false,
			skipRegExps: false,
			skipStrings: true,
			skipTemplates: false,
		},
	],
	'no-loss-of-precision': 'error',
	'no-misleading-character-class': ['error', { allowEscape: false }],
	'no-new-native-nonconstructor': 'error',
	'no-obj-calls': 'error',
	'no-prototype-builtins': 'error',
	'no-self-assign': ['error', { props: true }],
	'no-setter-return': 'error',
	'no-sparse-arrays': 'error',
	'no-this-before-super': 'error',
	'no-unassigned-vars': 'error',
	'no-unreachable': 'error',
	'no-unsafe-finally': 'error',
	'no-unused-private-class-members': 'error',
	'no-useless-backreference': 'error',
	'use-isnan': [
		'error',
		{
			enforceForIndexOf: false,
			enforceForSwitchCase: true,
		},
	],
	'valid-typeof': ['error', { requireStringLiterals: false }],

	// Rules with overridden options
	'no-undef': ['error', { typeof: true }],
	'no-unsafe-negation': ['error', { enforceForOrderingRelations: true }],
	'no-unsafe-optional-chaining': ['error', { disallowArithmeticOperators: true }],
	'no-unused-vars': [
		'error',
		{
			args: 'after-used',
			argsIgnorePattern: '^_',
			caughtErrors: 'all',
			caughtErrorsIgnorePattern: '^_',
			destructuredArrayIgnorePattern: '^_',
			ignoreClassWithStaticInitBlock: false,
			ignoreRestSiblings: true,
			ignoreUsingDeclarations: false,
			reportUsedIgnorePattern: false,
			vars: 'all',
			varsIgnorePattern: '^_',
		},
	],

	// Handled by Prettier
	'no-unexpected-multiline': 'off',

	// Turned off rules
	'no-useless-assignment': 'off', // Often produces noise in control flow and refactoring patterns
};

const possibleProblemRules = {
	...recommendedPossibleProblemRules,

	'no-await-in-loop': 'error',
	'no-constructor-return': 'error',
	'no-inner-declarations': ['error', 'functions', { blockScopedFunctions: 'allow' }],
	'no-promise-executor-return': ['error', { allowVoid: false }],
	'no-self-compare': 'error',
	'no-template-curly-in-string': 'error',
	'no-unmodified-loop-condition': 'error',
	'no-unreachable-loop': ['error', { ignore: [] }],

	// Rules with overridden options
	'array-callback-return': [
		'error',
		{
			allowImplicit: true,
			allowVoid: false,
			checkForEach: false,
		},
	],

	// Turned off rules
	'no-duplicate-imports': [
		'off',
		{
			allowSeparateTypeImports: false,
			includeExports: false,
		},
	],
	'no-use-before-define': [
		'off',
		{
			allowNamedExports: false,
			classes: true,
			enums: true,
			functions: true,
			ignoreTypeReferences: true,
			typedefs: true,
			variables: true,
		},
	],
	'require-atomic-updates': ['off', { allowProperties: false }],
};

export { recommendedPossibleProblemRules, possibleProblemRules };
