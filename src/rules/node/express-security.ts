import type { Linter } from 'eslint';

import { configs } from 'eslint-plugin-express-security';

const expressSecurityEslintRules: Linter.RulesRecord = {
	...configs.recommended.rules,
} as const;

export { expressSecurityEslintRules };
