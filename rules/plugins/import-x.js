const helpfulWarningRules = {
	'import-x/export': 'error',
	'import-x/no-deprecated': 'error',
	'import-x/no-empty-named-blocks': 'error',
	'import-x/no-extraneous-dependencies': 'error',
	'import-x/no-mutable-exports': 'error',
	'import-x/no-named-as-default-member': 'error',
	'import-x/no-named-as-default': 'error',
	'import-x/no-rename-default': 'error',

	// Turned off rules
	'import-x/no-unused-modules': 'off', // Only compatible with legacy ESLint configs
};

const moduleSystemRules = {
	'import-x/no-amd': 'error',
	'import-x/no-commonjs': [
		'error',
		{
			allowRequire: false,
			allowConditionalRequire: false,
			allowPrimitiveModules: false,
		},
	],
	'import-x/no-import-module-exports': 'error',
	'import-x/unambiguous': 'error',

	// Turned off rules
	'import-x/no-nodejs-modules': 'off',
};

const staticAnalysisRules = {
	'import-x/default': 'error',
	'import-x/named': 'error',
	'import-x/namespace': ['error', { allowComputed: false }],
	'import-x/no-absolute-path': ['error', { esmodule: true }],
	'import-x/no-dynamic-require': 'error',
	'import-x/no-relative-packages': 'error',
	'import-x/no-self-import': 'error',
	'import-x/no-unresolved': [
		'error',
		{
			caseSensitive: true,
		},
	],
	'import-x/no-useless-path-segments': ['error', { noUselessIndex: true }],

	// Turned off rules
	'import-x/no-cycle': [
		'off',
		{
			allowUnsafeDynamicCyclicDependency: false,
			ignoreExternal: false,
			maxDepth: Infinity,
		},
	],
	'import-x/no-internal-modules': 'off',
	'import-x/no-relative-parent-imports': 'off',
	'import-x/no-restricted-paths': 'off',
	'import-x/no-webpack-loader-syntax': 'off',
};

const styleGuideRules = {
	'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
	'import-x/exports-last': 'error',
	'import-x/extensions': ['error', 'ignorePackages', { js: 'always' }],
	'import-x/first': ['error', 'absolute-first'],
	'import-x/group-exports': 'error',
	'import-x/newline-after-import': [
		'error',
		{
			considerComments: true,
			count: 1,
			exactCount: true,
		},
	],
	'import-x/no-anonymous-default-export': [
		'error',
		{
			allowAnonymousClass: false,
			allowAnonymousFunction: false,
			allowArray: false,
			allowArrowFunction: false,
			allowCallExpression: true,
			allowLiteral: false,
			allowNew: false,
			allowObject: false,
		},
	],
	'import-x/no-default-export': 'error',
	'import-x/no-duplicates': 'error',
	'import-x/no-named-default': 'error',
	'import-x/no-namespace': [
		'error',
		{
			ignore: [
				// Node.js Native Modules
				'node:assert',
				'node:assert/strict',
				'node:async_hooks',
				'node:buffer',
				'node:child_process',
				'node:cluster',
				'node:console',
				'node:constants',
				'node:crypto',
				'node:dgram',
				'node:diagnostics_channel',
				'node:dns',
				'node:dns/promises',
				'node:domain',
				'node:events',
				'node:fs',
				'node:fs/promises',
				'node:http',
				'node:http2',
				'node:https',
				'node:inspector',
				'node:inspector/promises',
				'node:module',
				'node:net',
				'node:os',
				'node:path',
				'node:path/posix',
				'node:path/win32',
				'node:perf_hooks',
				'node:process',
				'node:punycode',
				'node:querystring',
				'node:readline',
				'node:readline/promises',
				'node:repl',
				'node:sea',
				'node:sqlite',
				'node:stream',
				'node:stream/consumers',
				'node:stream/promises',
				'node:stream/web',
				'node:string_decoder',
				'node:sys',
				'node:test',
				'node:test/reporters',
				'node:timers',
				'node:timers/promises',
				'node:tls',
				'node:trace_events',
				'node:tty',
				'node:url',
				'node:util',
				'node:util/types',
				'node:v8',
				'node:vm',
				'node:wasi',
				'node:worker_threads',
				'node:zlib',

				// React
				'react',
				'react-dom',
			],
		},
	],
	'import-x/no-unassigned-import': 'error',
	'import-x/order': [
		'error',
		{
			groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
			'newlines-between': 'always',
			alphabetize: {
				order: 'asc',
				caseInsensitive: true,
			},
		},
	],

	// Turned off rules
	'import-x/dynamic-import-chunkname': 'off',
	'import-x/max-dependencies': [
		'off',
		{
			max: 10,
			ignoreTypeImports: false,
		},
	],
	'import-x/no-named-export': 'off',
	'import-x/prefer-default-export': 'off',
	'import-x/prefer-namespace-import': 'off',
};

const importxEslintRules = {
	...helpfulWarningRules,
	...moduleSystemRules,
	...staticAnalysisRules,
	...styleGuideRules,
};

export { importxEslintRules };
