/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import process from 'node:process';

import { describe, expect, it } from 'vitest';

import { createConfig } from '../dist/index.mjs';

type PluginRule = {
	readonly meta?: {
		readonly deprecated?: unknown;
	};
};
type PluginWithRules = {
	readonly rules?: Readonly<Record<string, PluginRule | undefined>>;
};

function isDeprecated(rule: PluginRule | undefined): boolean {
	return rule?.meta?.deprecated !== undefined && rule.meta.deprecated !== false;
}

describe('deprecated rule handling', () => {
	it('does not configure deprecated plugin rules', async () => {
		const config = await createConfig({
			reactRefreshVariant: 'generic',
			tsconfigRootDir: process.cwd(),
			tsTypeChecked: true,
		});
		const plugins = Object.assign(
			{},
			...config.map((entry) => entry.plugins ?? {}),
		) as Readonly<Record<string, PluginWithRules>>;

		const pluginNames = Object.keys(plugins).toSorted((left, right) => right.length - left.length);
		const deprecatedRuleIds = config.flatMap((entry) =>
			Object.keys(entry.rules ?? {}).filter((ruleId) => {
				const pluginName = pluginNames.find((name) => ruleId.startsWith(`${name}/`));
				if (pluginName === undefined) return false;

				const ruleName = ruleId.slice(pluginName.length + 1);
				return isDeprecated(plugins[pluginName]?.rules?.[ruleName]);
			}),
		);

		expect([...new Set(deprecatedRuleIds)].toSorted()).toEqual([]);
	});
});
