import type { Linter } from 'eslint';

import eslintPluginN from 'eslint-plugin-n';

// eslint-disable-next-line functional/functional-parameters -- Zero-parameter factory function; no meaningful parameter applies here
function getRules() {
	const rules = (eslintPluginN.rules ?? {}) as Record<string, unknown>;

	return Object.fromEntries(Object.keys(rules).map((key) => [`n/${key}`, 'error'])) as Linter.RulesRecord;
}

const nEslintRules: Linter.RulesRecord = {
	...getRules(),

	'n/prefer-global/buffer': ['error', 'never'],
	'n/prefer-global/crypto': ['error', 'never'],
	'n/prefer-global/process': ['error', 'never'],

	'n/hashbang': [
		'error',
		{
			executableMap: {
				'.js': 'node',
				'.mjs': 'node',
			},
			ignoreUnpublished: true,
		},
	],
	'n/no-deprecated-api': ['error', { ignoreIndirectDependencies: true }],
	'n/no-sync': ['error', { allowAtRootLevel: true }],

	'n/no-process-env': ['warn', { allowedVariables: ['NODE_ENV'] }],

	'n/no-restricted-import': 'off', // Project specific

	'n/file-extension-in-import': 'off', // Covered by `import-x/extensions` rule
	'n/no-extraneous-import': 'off', // Covered by `import-x/no-extraneous-dependencies` rule
	'n/no-missing-import': 'off', // Covered by `import-x/no-unresolved` rule
	'n/no-process-exit': 'off', // Covered by `unicorn/no-process-exit` rule
	'n/prefer-node-protocol': 'off', // Covered by `unicorn/prefer-node-protocol` rule

	'n/exports-style': 'off', // Irrelevant for ESM-only project
	'n/global-require': 'off', // Irrelevant for ESM-only project
	'n/no-exports-assign': 'off', // Irrelevant for ESM-only project
	'n/no-extraneous-require': 'off', // Irrelevant for ESM-only project
	'n/no-missing-require': 'off', // Irrelevant for ESM-only project
	'n/no-mixed-requires': 'off', // Irrelevant for ESM-only project
	'n/no-new-require': 'off', // Irrelevant for ESM-only project
	'n/no-restricted-require': 'off', // Irrelevant for ESM-only project
	'n/no-top-level-await': 'off', // Irrelevant for ESM-only project
	'n/no-unpublished-require': 'off', // Irrelevant for ESM-only project

	'n/no-hide-core-modules': 'off', // Deprecated since v4.2.0
	'n/shebang': 'off', // Deprecated since v17.0.0
};

export { nEslintRules };
