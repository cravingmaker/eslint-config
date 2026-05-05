import type { Linter } from 'eslint';

// eslint-disable-next-line unicorn/prevent-abbreviations -- This mirrors the ESLint `no-unused-vars` rule name
import { noUnusedVarsOptions, noUseBeforeDefineOptions } from '../../options/common.js';

const recommendedPossibleProblemRules: Linter.RulesRecord = {
	'constructor-super': 'error',
	'for-direction': 'error',

	'no-async-promise-executor': 'error',
	'no-class-assign': 'error',
	'no-compare-neg-zero': 'error',
	'no-cond-assign': ['error', 'except-parens'],
	'no-const-assign': 'error',
	'no-constant-binary-expression': 'error',
	'no-constant-condition': ['error', { checkLoops: 'allExceptWhileTrue' }],
	'no-control-regex': 'error', // Compatibility with `eslint-plugin-regexp`
	'no-debugger': 'error',
	'no-dupe-args': 'error',
	'no-dupe-class-members': 'error',
	'no-dupe-else-if': 'error',
	'no-dupe-keys': 'error',
	'no-duplicate-case': 'error',
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
	'no-misleading-character-class': ['error', { allowEscape: false }], // Compatibility with `eslint-plugin-regexp`
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

	'no-useless-assignment': 'off', // Often produces noise in control flow and refactoring patterns

	'getter-return': [
		'error',
		{
			allowImplicit: true, // Compatibility with `unicorn/no-useless-undefined` rule
		},
	],

	'no-empty-character-class': 'off', // Covered by `eslint-plugin-regexp/no-empty-character-class`
	'no-invalid-regexp': 'off', // Covered by `eslint-plugin-regexp/no-invalid-regexp`
	'no-unexpected-multiline': 'off', // Covered by `prettier`
	'no-unused-vars': ['off', { ...noUnusedVarsOptions }], // Covered by `eslint-plugin-unused-imports`
	'no-useless-backreference': 'off', // Covered by `eslint-plugin-regexp/no-useless-backreference`
} as const;

const possibleProblemRules: Linter.RulesRecord = {
	...recommendedPossibleProblemRules,

	'no-await-in-loop': 'error',
	'no-constructor-return': 'error',
	'no-inner-declarations': ['error', 'functions', { blockScopedFunctions: 'allow' }],
	'no-promise-executor-return': ['error', { allowVoid: false }],
	'no-self-compare': 'error',
	'no-template-curly-in-string': 'error',
	'no-unmodified-loop-condition': 'error',
	'no-unreachable-loop': ['error', { ignore: [] }],
	'no-use-before-define': ['error', { ...noUseBeforeDefineOptions }],

	'no-duplicate-imports': [
		'off',
		{
			allowSeparateTypeImports: false,
			includeExports: false,
		},
	],
	'require-atomic-updates': ['off', { allowProperties: false }],

	// Rules with overridden options
	'array-callback-return': [
		'error',
		{
			allowImplicit: true, // Compatibility with `unicorn/no-useless-undefined` rule
			allowVoid: false,
			checkForEach: false,
		},
	],
} as const;

export { possibleProblemRules };
