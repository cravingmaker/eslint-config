import type { Linter } from 'eslint';

type PluginRule = {
	readonly meta?: {
		readonly deprecated?: unknown;
	};
};
type PluginRules = Readonly<Record<string, PluginRule | undefined>>;

function getPluginRules(pluginName: string, rules: unknown): Linter.RulesRecord {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Plugin rule maps have inconsistent public typings across packages.
	const pluginRules = rules as PluginRules;

	return Object.fromEntries(
		Object.entries(pluginRules)
			.filter(([, rule]) => rule?.meta?.deprecated === undefined || rule.meta.deprecated === false)
			.map(([ruleName]) => [`${pluginName}/${ruleName}`, 'error']),
	);
}

export { getPluginRules };
