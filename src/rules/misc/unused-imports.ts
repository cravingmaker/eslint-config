import type { Linter } from 'eslint';

import unusedImportsPlugin from 'eslint-plugin-unused-imports';

// eslint-disable-next-line unicorn/prevent-abbreviations -- This mirrors the ESLint `no-unused-vars` rule name
import { noUnusedVarsOptions } from '../../options/common.js';

// eslint-disable-next-line functional/functional-parameters -- Zero-parameter factory function; no meaningful parameter applies here
function getRules() {
	const rules = (unusedImportsPlugin.rules ?? {}) as Record<string, unknown>;

	return Object.fromEntries(Object.keys(rules).map((key) => [`unused-imports/${key}`, 'error'])) as Linter.RulesRecord;
}

const unusedImportsEslintRules: Linter.RulesRecord = {
	...getRules(),

	'unused-imports/no-unused-vars': ['error', { ...noUnusedVarsOptions }],
};

export { unusedImportsEslintRules };
