import type { Linter } from 'eslint';

import eslintPluginSecurity from 'eslint-plugin-security';

const securityEslintRules: Linter.RulesRecord = {
	// eslint-disable-next-line  @typescript-eslint/no-unsafe-type-assertion -- The plugin does not provide types for its configs
	...(eslintPluginSecurity.configs.recommended.rules as Linter.RulesRecord),
} as const;

export { securityEslintRules };
