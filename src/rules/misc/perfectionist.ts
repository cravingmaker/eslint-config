import type { Linter } from 'eslint';

const commonOptions = {
	fallbackSort: { type: 'unsorted' },
	ignoreCase: true,
	locales: 'en-US',
	order: 'asc',

	specialCharacters: 'trim',
	type: 'natural',
} as const;

const commonCollectionRuleOptions = {
	...commonOptions,
	partitionByNewLine: true,
} as const;

const commonTsShapeRuleOptions = {
	...commonOptions,
	groups: [
		'index-signature',
		['required-property', 'required-method'],
		['optional-property', 'optional-method'],
		'unknown',
	],
	newlinesBetween: 1,
	newlinesInside: 0,
} as const;

const commonTsCompositionRuleOptions = {
	...commonOptions,
	groups: [
		'keyword',
		'named',
		'literal',
		'operator',
		'import',
		'object',
		'function',
		'tuple',
		['intersection', 'union'],
		'conditional',
		'unknown',
		'nullish',
	],
} as const;

const perfectionistEslintRules: Linter.RulesRecord = {
	'perfectionist/sort-array-includes': ['error', { ...commonCollectionRuleOptions }],

	'perfectionist/sort-arrays': [
		'error',
		{
			...commonCollectionRuleOptions,
			useConfigurationIf: {
				matchesAstSelector: 'TSAsExpression > ArrayExpression', // Only fires on `[...] as const` — safe to sort
			},
		},
	],

	'perfectionist/sort-classes': [
		'error',
		{
			customGroups: [
				// #private static field
				{ groupName: 'hash-private-static-field', modifiers: ['private', 'static'], selector: 'property' },
				// #private instance field
				{ groupName: 'hash-private-field', modifiers: ['private'], selector: 'property' },
				// #private static auto-accessor
				{ groupName: 'hash-private-static-accessor', modifiers: ['private', 'static'], selector: 'accessor-property' },
				// #private instance auto-accessor
				{ groupName: 'hash-private-accessor', modifiers: ['private'], selector: 'accessor-property' },
				// #private static getter
				{ groupName: 'hash-private-static-get-method', modifiers: ['private', 'static'], selector: 'get-method' },
				// #private instance getter
				{ groupName: 'hash-private-get-method', modifiers: ['private'], selector: 'get-method' },
				// #private static setter
				{ groupName: 'hash-private-static-set-method', modifiers: ['private', 'static'], selector: 'set-method' },
				// #private instance setter
				{ groupName: 'hash-private-set-method', modifiers: ['private'], selector: 'set-method' },
				// #private static method
				{ groupName: 'hash-private-static-method', modifiers: ['private', 'static'], selector: 'method' },
				// #private instance method
				{ groupName: 'hash-private-method', modifiers: ['private'], selector: 'method' },
			],
			groups: [
				// Static fields
				'public-static-field',
				'protected-static-field',
				'private-static-field',
				'hash-private-static-field',

				// Static initialization
				'static-block',

				// Instance decorated fields (metadata-bearing, declared first)
				'public-decorated-field',
				'protected-decorated-field',
				'private-decorated-field',

				// Instance regular fields
				'public-field',
				'protected-field',
				'private-field',
				'hash-private-field',

				// Abstract fields
				'public-abstract-field',
				'protected-abstract-field',

				// Structural signatures
				'index-signature',
				'call-signature',

				// Constructors
				'public-constructor',
				'protected-constructor',
				'private-constructor',

				// Static auto-accessors (accessor keyword)
				'public-static-accessor',
				'protected-static-accessor',
				'private-static-accessor',
				'hash-private-static-accessor',

				// Static getters
				'public-static-get-method',
				'protected-static-get-method',
				'private-static-get-method',
				'hash-private-static-get-method',

				// Static setters
				'public-static-set-method',
				'protected-static-set-method',
				'private-static-set-method',
				'hash-private-static-set-method',

				// Static methods
				'public-static-method',
				'protected-static-method',
				'private-static-method',
				'hash-private-static-method',

				// Instance decorated auto-accessors
				'public-decorated-accessor',
				'protected-decorated-accessor',
				'private-decorated-accessor',

				// Instance regular auto-accessors
				'public-accessor',
				'protected-accessor',
				'private-accessor',
				'hash-private-accessor',

				// Abstract auto-accessors
				'public-abstract-accessor',
				'protected-abstract-accessor',

				// Instance decorated getters
				'public-decorated-get-method',
				'protected-decorated-get-method',
				'private-decorated-get-method',

				// Instance regular getters
				'public-get-method',
				'protected-get-method',
				'private-get-method',
				'hash-private-get-method',

				// Abstract getters
				'public-abstract-get-method',
				'protected-abstract-get-method',

				// Instance decorated setters
				'public-decorated-set-method',
				'protected-decorated-set-method',
				'private-decorated-set-method',

				// Instance regular setters
				'public-set-method',
				'protected-set-method',
				'private-set-method',
				'hash-private-set-method',

				// Abstract setters
				'public-abstract-set-method',
				'protected-abstract-set-method',

				// Instance decorated methods
				'public-decorated-method',
				'protected-decorated-method',
				'private-decorated-method',

				// Instance regular methods
				'public-method',
				'protected-method',
				'private-method',
				'hash-private-method',

				// Abstract methods
				'public-abstract-method',
				'protected-abstract-method',

				'unknown',
			],
			ignoreCase: true,
			order: 'asc',
			type: 'alphabetical',
		},
	],

	'perfectionist/sort-decorators': ['error', { ...commonOptions }],

	'perfectionist/sort-enums': [
		'error',
		{
			...commonOptions,
			partitionByNewLine: true,
		},
	],

	'perfectionist/sort-export-attributes': ['error', { ...commonOptions }],

	'perfectionist/sort-exports': ['error', { ...commonOptions }],

	'perfectionist/sort-heritage-clauses': ['error', { ...commonOptions }],

	'perfectionist/sort-import-attributes': ['error', { ...commonOptions }],

	'perfectionist/sort-imports': [
		'error',
		{
			...commonOptions,
			customGroups: [
				{
					anyOf: [{ elementNamePattern: '^node:' }],
					groupName: 'node',
				},
				{
					anyOf: [{ elementNamePattern: '^bun:' }],
					groupName: 'bun',
				},
			],
			groups: [
				['type-builtin', 'type-external', 'type-internal', 'type-parent', 'type-sibling', 'type-index'],
				'type',
				'node',
				'bun',
				'builtin',
				'external',
				'internal',
				['parent', 'sibling', 'index'],
				['side-effect', 'side-effect-style'],
				'style',
				'unknown',
			],
			internalPattern: ['^~/.*', '^@/.*'],
			newlinesBetween: 1,
		},
	],

	'perfectionist/sort-interfaces': ['error', { ...commonTsShapeRuleOptions }],

	'perfectionist/sort-intersection-types': ['error', { ...commonTsCompositionRuleOptions }],

	'perfectionist/sort-jsx-props': [
		'error',
		{
			...commonOptions,
			customGroups: [
				{
					elementNamePattern: '^on[A-Z]',
					groupName: 'callback',
				},
			],
			groups: ['multiline', 'unknown', 'shorthand', 'callback'],
		},
	],

	'perfectionist/sort-maps': ['error', { ...commonCollectionRuleOptions }],

	'perfectionist/sort-modules': [
		'error',
		{
			...commonOptions,
			groups: [
				['interface', 'type', 'declare-interface', 'declare-type'],
				['enum', 'declare-enum'],
				['class', 'declare-class'],
				['function', 'async-function', 'declare-function'],
				'unknown',
				[
					'export-interface',
					'export-type',
					'export-enum',
					'export-declare-enum',
					'export-class',
					'export-default-class',
					'export-default-decorated-class',
					'export-declare-class',
					'export-function',
					'export-default-function',
					'export-async-function',
					'export-default-async-function',
					'export-declare-function',
				],
			],
			newlinesBetween: 1,
		},
	],

	'perfectionist/sort-named-exports': [
		'error',
		{
			...commonOptions,
			groups: ['type-export', 'value-export', 'unknown'],
		},
	],

	'perfectionist/sort-named-imports': ['error', { ...commonOptions }],

	'perfectionist/sort-object-types': ['error', { ...commonTsShapeRuleOptions }],

	'perfectionist/sort-objects': ['error', { ...commonCollectionRuleOptions }],

	'perfectionist/sort-sets': ['error', { ...commonCollectionRuleOptions }],

	'perfectionist/sort-switch-case': ['error', { ...commonOptions }],

	'perfectionist/sort-union-types': ['error', { ...commonTsCompositionRuleOptions }],

	'perfectionist/sort-variable-declarations': 'off', // Prefer `one-var` rule
} as const;

export { perfectionistEslintRules };
