import type { Linter } from 'eslint';

import {
	classMethodsUseThisOptions,
	consistentReturnOptions,
	dotNotationOptions,
	// eslint-disable-next-line unicorn/prevent-abbreviations -- This mirrors the ESLint `max-params` rule name
	maxParamsOptions,
	noEmptyFunctionOptions,
	noShadowOptions,
	noUnusedExpressionsOptions,
	preferDestructuring1stOptions,
	preferDestructuring2ndOptions,
	preferPromiseRejectErrorsOptions,
} from '../../options/common.js';

const recommendedSuggestionRules: Linter.RulesRecord = {
	'no-case-declarations': 'error',
	'no-delete-var': 'error',
	'no-empty-static-block': 'error',
	'no-extra-boolean-cast': ['error', {}],
	'no-global-assign': ['error', { exceptions: [] }],
	'no-nonoctal-decimal-escape': 'error',
	'no-octal': 'error',
	'no-redeclare': ['error', { builtinGlobals: true }],
	'no-shadow-restricted-names': ['error', { reportGlobalThis: true }],
	'no-unused-labels': 'error',
	'no-useless-catch': 'error',
	'no-useless-escape': ['error', { allowRegexCharacters: [] }],
	'no-with': 'error',
	'preserve-caught-error': ['error', { requireCatchParameter: false }],
	'require-yield': 'error',

	// Rules with overridden options
	'no-empty': ['error', { allowEmptyCatch: true }],
} as const;

const suggestionRules: Linter.RulesRecord = {
	...recommendedSuggestionRules,

	'accessor-pairs': [
		'error',
		{
			enforceForClassMembers: true,
			enforceForTSTypes: false,
			getWithoutSet: false,
			setWithoutGet: true,
		},
	],
	'arrow-body-style': ['error', 'as-needed'],
	'block-scoped-var': 'error',
	camelcase: [
		'error',
		{
			allow: [],
			ignoreDestructuring: false,
			ignoreGlobals: false,
			ignoreImports: false,
			properties: 'always',
		},
	],
	'class-methods-use-this': ['error', { ...classMethodsUseThisOptions }],
	complexity: [
		'error',
		{
			max: 20,
			variant: 'classic',
		},
	],
	'default-case': ['error', {}],
	'default-case-last': 'error',
	'default-param-last': 'error',
	'dot-notation': ['error', { ...dotNotationOptions }],
	eqeqeq: ['error', 'always'],
	'max-depth': ['error', { max: 4 }],
	'no-alert': 'error',
	'no-array-constructor': 'error',
	'no-bitwise': [
		'error',
		{
			allow: [],
			int32Hint: false,
		},
	],
	'no-caller': 'error',
	'no-empty-function': ['error', { ...noEmptyFunctionOptions }],
	'no-eq-null': 'error',
	'no-eval': ['error', { allowIndirect: false }],
	'no-extend-native': ['error', { exceptions: [] }],
	'no-extra-bind': 'error',
	'no-extra-label': 'error',
	'no-implicit-coercion': [
		'error',
		{
			allow: [],
			boolean: true,
			disallowTemplateShorthand: false,
			number: true,
			string: true,
		},
	],
	'no-implicit-globals': ['error', { lexicalBindings: false }],
	'no-implied-eval': 'error',
	'no-iterator': 'error',
	'no-label-var': 'error',
	'no-labels': [
		'error',
		{
			allowLoop: false,
			allowSwitch: false,
		},
	],
	'no-lone-blocks': 'error',
	'no-lonely-if': 'error',
	'no-loop-func': 'error',
	'no-multi-assign': ['error', { ignoreNonDeclaration: false }],
	'no-multi-str': 'error',
	'no-new': 'error',
	'no-new-func': 'error',
	'no-new-wrappers': 'error',
	'no-object-constructor': 'error',
	'no-octal-escape': 'error',
	'no-proto': 'error',
	'no-script-url': 'error',
	'no-throw-literal': 'error',
	'no-undef-init': 'error',
	'no-unneeded-ternary': ['error', { defaultAssignment: true }],
	'no-useless-call': 'error',
	'no-useless-computed-key': ['error', { enforceForClassMembers: true }],
	'no-useless-concat': 'error',
	'no-useless-constructor': 'error',
	'no-useless-rename': [
		'error',
		{
			ignoreDestructuring: false,
			ignoreExport: false,
			ignoreImport: false,
		},
	],
	'no-useless-return': 'error',
	'operator-assignment': ['error', 'always'],
	'prefer-arrow-callback': [
		'error',
		{
			allowNamedFunctions: false,
			allowUnboundThis: true,
		},
	],
	'prefer-exponentiation-operator': 'error',
	'prefer-numeric-literals': 'error',
	'prefer-object-has-own': 'error',
	'prefer-object-spread': 'error',
	'prefer-promise-reject-errors': ['error', { ...preferPromiseRejectErrorsOptions }],
	'prefer-rest-params': 'error',
	'prefer-spread': 'error',
	'prefer-template': 'error',
	radix: 'error',
	'require-await': 'error',
	yoda: [
		'error',
		'never',
		{
			exceptRange: false,
			onlyEquality: false,
		},
	],

	// Rules with overridden options
	'func-name-matching': [
		'error',
		'always',
		{
			considerPropertyDescriptor: true,
			includeCommonJSModuleExports: false,
		},
	],
	'func-names': ['error', 'never', { generators: 'never' }],
	'grouped-accessor-pairs': [
		'error',
		'getBeforeSet',
		{
			enforceForTSTypes: false,
		},
	],
	'max-lines': [
		'error',
		{
			max: 1500,
			skipBlankLines: true,
			skipComments: true,
		},
	],
	'max-nested-callbacks': ['error', 4],
	'max-params': ['error', { ...maxParamsOptions }],
	'no-else-return': ['error', { allowElseIf: false }],
	'no-return-assign': ['error', 'always'],
	'no-sequences': ['error', { allowInParentheses: false }],
	'no-shadow': ['error', { ...noShadowOptions }],
	'no-unused-expressions': ['error', { ...noUnusedExpressionsOptions }],
	'no-void': ['error', { allowAsStatement: false }],
	'object-shorthand': [
		'error',
		'always',
		{
			avoidExplicitReturnArrows: true,
			avoidQuotes: false,
			ignoreConstructors: false,
		},
	],
	'one-var': ['error', 'never'],

	'prefer-destructuring': ['error', { ...preferDestructuring1stOptions }, { ...preferDestructuring2ndOptions }],
	'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }], // Compatibility with `eslint-plugin-regexp`

	'capitalized-comments': [
		'off',
		{
			ignoreConsecutiveComments: false,
			ignoreInlineComments: false,
		},
	],
	'consistent-return': ['off', { ...consistentReturnOptions }],
	'consistent-this': ['off', 'that'],
	'guard-for-in': 'off',
	'id-denylist': 'off',
	'id-length': [
		'off',
		{
			exceptionPatterns: [],
			exceptions: [],
			max: Number.POSITIVE_INFINITY,
			min: 2,
			properties: 'always',
		},
	],
	'id-match': [
		'off',
		'^.+$',
		{
			classFields: false,
			ignoreDestructuring: false,
			onlyDeclarations: false,
			properties: false,
		},
	],
	'init-declarations': ['off', 'always'],
	'max-classes-per-file': [
		'off',
		{
			ignoreExpressions: false,
			max: 1,
		},
	],
	'max-lines-per-function': [
		'off',
		{
			// eslint-disable-next-line @typescript-eslint/naming-convention -- ESLint rule options use PascalCase for AST node names
			IIFEs: false,
			max: 50,
			skipBlankLines: true,
			skipComments: true,
		},
	],
	'max-statements': ['off', 10],
	'new-cap': [
		'off',
		{
			capIsNew: true,
			capIsNewExceptions: [],
			newIsCap: true,
			newIsCapExceptions: [],
			properties: true,
		},
	],
	'no-console': ['off', { allow: [] }],
	'no-continue': 'off',
	'no-div-regex': 'off',
	'no-inline-comments': ['off', {}],
	'no-invalid-this': ['off', { capIsConstructor: true }],
	'no-magic-numbers': [
		'off',
		{
			detectObjects: false,
			enforceConst: false,
			ignore: [],
			ignoreArrayIndexes: false,
			ignoreClassFieldInitialValues: false,
			ignoreDefaultValues: false,
		},
	],

	'no-plusplus': ['off', { allowForLoopAfterthoughts: false }],
	'no-restricted-exports': ['off', {}],
	'no-restricted-globals': ['off', {}],
	'no-restricted-imports': ['off', {}],
	'no-restricted-properties': 'off',
	'no-restricted-syntax': 'off',
	'no-ternary': 'off',
	'no-undefined': 'off',
	'no-underscore-dangle': [
		'off',
		{
			allow: [],
			allowAfterSuper: false,
			allowAfterThis: false,
			allowAfterThisConstructor: false,
			allowFunctionParams: true,
			allowInArrayDestructuring: true,
			allowInObjectDestructuring: true,
			enforceInClassFields: false,
			enforceInMethodNames: false,
		},
	],
	'prefer-named-capture-group': 'off',
	'require-unicode-regexp': 'off',
	'sort-imports': [
		'off',
		{
			allowSeparatedGroups: false,
			ignoreCase: false,
			ignoreDeclarationSort: false,
			ignoreMemberSort: false,
			memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
		},
	],
	'sort-keys': [
		'off',
		'asc',
		{
			allowLineSeparatedGroups: false,
			caseSensitive: true,
			ignoreComputedKeys: false,
			minKeys: 2,
			natural: false,
		},
	],
	'sort-vars': ['off', { ignoreCase: false }],
	strict: ['off', 'safe'],
	'vars-on-top': 'off',

	'no-param-reassign': ['error', { props: false }], // Compatibility with `eslint-plugin-functional`
	'no-regex-spaces': 'error', // Compatibility with `eslint-plugin-regexp`
	'no-var': 'error', // Compatibility with `eslint-plugin-functional`
	'prefer-const': [
		'error', // Compatibility with `eslint-plugin-functional`
		{
			destructuring: 'all',
			ignoreReadBeforeAssign: false,
		},
	],

	curly: ['off', 'all'], // Covered by `prettier`
	'no-negated-condition': 'off', // Covered by `unicorn/no-negated-condition`
	'no-nested-ternary': 'off', // Covered by `unicorn/no-nested-ternary`
	'no-warning-comments': 'off', // Covered by `unicorn/expiring-todo-comments`
} as const;

export { suggestionRules };
