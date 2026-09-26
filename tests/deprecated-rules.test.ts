/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import type { Linter } from 'eslint';

import process from 'node:process';

import { describe, expect, it } from 'vitest';

import { createConfig } from '../dist/index.mjs';

function findPluginName(ruleId: string, pluginNames: readonly string[]): string | undefined {
	return pluginNames.find((name) => ruleId.startsWith(`${name}/`));
}

function isDeprecatedConfiguredRule(
	ruleId: string,
	pluginNames: readonly string[],
	plugins: ReadonlyMap<string, Linter.Plugin>,
): boolean {
	const pluginName = findPluginName(ruleId, pluginNames);
	if (pluginName === undefined) return false;

	const plugin = plugins.get(pluginName);
	const ruleName = ruleId.slice(pluginName.length + 1);
	const rule = Object.entries(plugin?.rules ?? {}).find(([name]) => name === ruleName)?.[1];

	return rule?.meta?.deprecated !== undefined && rule.meta.deprecated !== false;
}

describe('deprecated rule handling', () => {
	it('does not configure deprecated plugin rules', async () => {
		const config = await createConfig({
			reactRefreshVariant: 'generic',
			tsconfigRootDir: process.cwd(),
			tsTypeChecked: true,
		});
		const plugins = new Map(config.flatMap((entry) => Object.entries(entry.plugins ?? {})));
		const pluginNames = [...plugins.keys()].toSorted((left, right) => right.length - left.length);
		const deprecatedRuleIds = config.flatMap((entry) =>
			Object.keys(entry.rules ?? {}).filter((ruleId) => isDeprecatedConfiguredRule(ruleId, pluginNames, plugins)),
		);

		expect([...new Set(deprecatedRuleIds)].toSorted()).toEqual([]);
	});
});
