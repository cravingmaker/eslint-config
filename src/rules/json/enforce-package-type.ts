import type { Linter } from 'eslint';

const enforcePackageTypeEslintRules: Linter.RulesRecord = {
	'enforce-package-type/enforce-package-type': ['error', { enforceType: 'module' }],
} as const;

export { enforcePackageTypeEslintRules };
