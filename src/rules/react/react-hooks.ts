import type { Linter } from 'eslint';

const reactHooksEslintRules: Linter.RulesRecord = {
	// Core hooks rules
	'react-hooks/exhaustive-deps': 'error',
	'react-hooks/rules-of-hooks': 'error',

	// React Compiler rules
	'react-hooks/config': 'error',
	'react-hooks/error-boundaries': 'error',
	'react-hooks/gating': 'error',
	'react-hooks/globals': 'error',
	'react-hooks/immutability': 'error',
	'react-hooks/incompatible-library': 'error',
	'react-hooks/preserve-manual-memoization': 'error',
	'react-hooks/purity': 'error',
	'react-hooks/refs': 'error',
	'react-hooks/set-state-in-effect': 'error',
	'react-hooks/set-state-in-render': 'error',
	'react-hooks/static-components': 'error',
	'react-hooks/unsupported-syntax': 'error',
	'react-hooks/use-memo': 'error',
} as const;

export { reactHooksEslintRules };
