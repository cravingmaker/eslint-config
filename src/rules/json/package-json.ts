import type { Linter } from 'eslint';

import { getPluginRules } from '../../utilities/plugin-rules.js';
import eslintPluginPackageJson from 'eslint-plugin-package-json';

const packageJsonEslintRules: Linter.RulesRecord = {
	...getPluginRules('package-json', eslintPluginPackageJson.rules),

	'package-json/require-bugs': ['error', { ignorePrivate: true }],
	'package-json/require-exports': ['error', { ignorePrivate: true }],
	'package-json/require-files': ['error', { ignorePrivate: true }],
	'package-json/require-homepage': ['error', { ignorePrivate: true }],
	'package-json/require-keywords': ['error', { ignorePrivate: true }],
	'package-json/require-license': ['error', { ignorePrivate: true }],
	'package-json/require-repository': ['error', { ignorePrivate: true }],
	'package-json/require-sideEffects': ['error', { ignorePrivate: true }],
	'package-json/require-types': ['error', { ignorePrivate: true }],
	'package-json/restrict-dependency-ranges': [
		'error',
		{
			forDependencyTypes: ['dependencies', 'devDependencies'],
			rangeType: 'pin',
		},
	],

	'package-json/restrict-top-level-properties': 'off', // Project specific

	'package-json/require-bin': 'off', // Prefer optional
	'package-json/require-bundleDependencies': 'off', // Prefer optional
	'package-json/require-contributors': 'off', // Prefer optional
	'package-json/require-cpu': 'off', // Prefer optional
	'package-json/require-dependencies': 'off', // Prefer optional
	'package-json/require-directories': 'off', // Prefer optional
	'package-json/require-funding': 'off', // Prefer optional
	'package-json/require-main': 'off', // Prefer optional
	'package-json/require-man': 'off', // Prefer optional
	'package-json/require-module': 'off', // Prefer optional
	'package-json/require-optionalDependencies': 'off', // Prefer optional
	'package-json/require-os': 'off', // Prefer optional
	'package-json/require-packageManager': 'off', // Prefer optional
	'package-json/require-peerDependencies': 'off', // Prefer optional
	'package-json/require-publishConfig': 'off', // Prefer optional

} as const;

export { packageJsonEslintRules };
