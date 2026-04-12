const commonOptions = {
	// Defaults
	order: 'asc',
	fallbackSort: { type: 'unsorted' },
	ignoreCase: true,
	locales: 'en-US',

	// Overrides
	type: 'natural',
	specialCharacters: 'trim',
};

const commonTypeGroups = [
	'index-signature',
	['required-property', 'required-method'],
	['optional-property', 'optional-method'],
	'unknown',
];

const commonTypeNewLines = {
	newlinesBetween: 1,
	newlinesInside: 0,
};

const commonTypeConstituentGroups = [
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
];

const importRules = {
	'perfectionist/sort-import-attributes': ['error', { ...commonOptions }],
	'perfectionist/sort-imports': [
		'error',
		{
			...commonOptions,
			groups: [
				['type-builtin', 'type-external', 'type-internal', 'type-parent', 'type-sibling', 'type-index'],
				'type',
				['builtin', 'external'],
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
	'perfectionist/sort-named-imports': ['error', { ...commonOptions }],
};

const exportRules = {
	'perfectionist/sort-export-attributes': ['error', { ...commonOptions }],
	'perfectionist/sort-exports': ['error', { ...commonOptions }],
	'perfectionist/sort-named-exports': [
		'error',
		{
			...commonOptions,
			groups: ['type-export', 'value-export', 'unknown'],
		},
	],
};

const collectionRules = {
	'perfectionist/sort-array-includes': [
		'error',
		{
			...commonOptions,
			partitionByNewLine: true,
		},
	],
	'perfectionist/sort-arrays': [
		'error',
		{
			...commonOptions,
			partitionByNewLine: true,
			useConfigurationIf: {
				matchesAstSelector: 'TSAsExpression > ArrayExpression', // Only fires on `[...] as const` — safe to sort
			},
		},
	],
	'perfectionist/sort-objects': [
		'error',
		{
			...commonOptions,
			partitionByNewLine: true,
			useConfigurationIf: { objectType: 'destructured' }, // Only fires on destructured objects — safe to sort
		},
	],
	'perfectionist/sort-maps': [
		'error',
		{
			...commonOptions,
			partitionByNewLine: true,
		},
	],
	'perfectionist/sort-sets': [
		'error',
		{
			...commonOptions,
			partitionByNewLine: true,
		},
	],
};

const tsRules = {
	'perfectionist/sort-enums': [
		'error',
		{
			...commonOptions,
			partitionByNewLine: true,
		},
	],
	'perfectionist/sort-interfaces': [
		'error',
		{
			...commonOptions,
			...commonTypeNewLines,
			groups: [...commonTypeGroups],
		},
	],
	'perfectionist/sort-object-types': [
		'error',
		{
			...commonOptions,
			...commonTypeNewLines,
			groups: [...commonTypeGroups],
		},
	],
	'perfectionist/sort-intersection-types': [
		'error',
		{
			...commonOptions,
			groups: [...commonTypeConstituentGroups],
		},
	],
	'perfectionist/sort-union-types': [
		'error',
		{
			...commonOptions,
			groups: [...commonTypeConstituentGroups],
		},
	],
};

const reactRules = {
	'perfectionist/sort-jsx-props': [
		'error',
		{
			...commonOptions,
			groups: ['multiline', 'unknown', 'shorthand', 'callback'],
			customGroups: [
				{
					groupName: 'callback',
					elementNamePattern: '^on[A-Z]',
				},
			],
		},
	],
};

const perfectionistEslintRules = {
	...importRules,
	...exportRules,
	...collectionRules,
	...tsRules,
	...reactRules,

	'perfectionist/sort-classes': [
		'error',
		{
			type: 'alphabetical',
			order: 'asc',
			ignoreCase: true,
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
			customGroups: [
				// #private static field
				{ groupName: 'hash-private-static-field', selector: 'property', modifiers: ['private', 'static'] },
				// #private instance field
				{ groupName: 'hash-private-field', selector: 'property', modifiers: ['private'] },
				// #private static auto-accessor
				{ groupName: 'hash-private-static-accessor', selector: 'accessor-property', modifiers: ['private', 'static'] },
				// #private instance auto-accessor
				{ groupName: 'hash-private-accessor', selector: 'accessor-property', modifiers: ['private'] },
				// #private static getter
				{ groupName: 'hash-private-static-get-method', selector: 'get-method', modifiers: ['private', 'static'] },
				// #private instance getter
				{ groupName: 'hash-private-get-method', selector: 'get-method', modifiers: ['private'] },
				// #private static setter
				{ groupName: 'hash-private-static-set-method', selector: 'set-method', modifiers: ['private', 'static'] },
				// #private instance setter
				{ groupName: 'hash-private-set-method', selector: 'set-method', modifiers: ['private'] },
				// #private static method
				{ groupName: 'hash-private-static-method', selector: 'method', modifiers: ['private', 'static'] },
				// #private instance method
				{ groupName: 'hash-private-method', selector: 'method', modifiers: ['private'] },
			],
		},
	],
	'perfectionist/sort-decorators': [
		'error',
		{
			...commonOptions,
		},
	],
	'perfectionist/sort-heritage-clauses': ['error', { ...commonOptions }],
	'perfectionist/sort-modules': [
		'error',
		{
			...commonOptions,
			newlinesBetween: 1,
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
		},
	],
	'perfectionist/sort-switch-case': ['error', { ...commonOptions }],

	// Turned off rules
	'perfectionist/sort-variable-declarations': 'off', // Use ESLint's one-var rule instead
};

export { perfectionistEslintRules };
