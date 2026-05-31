import type { Linter } from 'eslint';

import pluginReactHooks from 'eslint-plugin-react-hooks';

// eslint-disable-next-line functional/functional-parameters -- Zero-parameter factory function; no meaningful parameter applies here
function getRules() {
	const rules = pluginReactHooks.rules as Record<string, unknown>;

	return Object.fromEntries(Object.keys(rules).map((key) => [`react-hooks/${key}`, 'error'])) as Linter.RulesRecord;
}

const reactHooksEslintRules: Linter.RulesRecord = {
	...getRules(),

	// Meta-internal rules: only meaningful inside Meta's infrastructure; always off for general projects
	'react-hooks/fbt': 'off', // Requires Meta's FBT (Facebook Internationalization) library
	'react-hooks/rule-suppression': 'off', // Meta-internal rule-suppression mechanism
	'react-hooks/todo': 'off', // Meta-internal TODO tracking rule
} as const;

export { reactHooksEslintRules };
