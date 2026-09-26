import type { Linter } from 'eslint';

import unusedImportsPlugin from 'eslint-plugin-unused-imports';

import { getPluginRules } from '../../utilities/plugin-rules.js';

// eslint-disable-next-line unicorn/prevent-abbreviations -- This mirrors the ESLint `no-unused-vars` rule name
import { noUnusedVarsOptions } from '../../options/common.js';

const unusedImportsEslintRules: Linter.RulesRecord = {
	...getPluginRules('unused-imports', unusedImportsPlugin.rules ?? {}),

	'unused-imports/no-unused-vars': ['error', { ...noUnusedVarsOptions }],
};

export { unusedImportsEslintRules };
