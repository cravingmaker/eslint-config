/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import type { Linter } from 'eslint';

import process from 'node:process';

import { builtinRules } from 'eslint/use-at-your-own-risk';
import { describe, expect, it } from 'vitest';

import { createConfig } from '../dist/index.mjs';

type RuleDefinition = {
	readonly meta?: {
		readonly deprecated?: unknown;
	};
};
type RulePlugin = {
	readonly rules?: Readonly<Record<string, RuleDefinition | undefined>>;
};

function getJavaScriptRules(config: readonly Linter.Config[]): NonNullable<Linter.Config['rules']> {
	return config.find((entry) => entry.files?.includes('**/*.{js,mjs,jsx,mjsx}') === true)?.rules ?? {};
}
function getTypeScriptConfig(config: readonly Linter.Config[]): Linter.Config | undefined {
	return config.find((entry) => Object.hasOwn(entry.plugins ?? {}, '@typescript-eslint'));
}
function isDeprecated(rule: RuleDefinition | undefined): boolean {
	return rule?.meta?.deprecated !== undefined && rule.meta.deprecated !== false;
}

describe('rule coverage', () => {
	it('classifies every current non-deprecated ESLint core rule', async () => {
		const config = await createConfig({ tsconfigRootDir: process.cwd(), tsTypeChecked: true });
		const rules = getJavaScriptRules(config);
		// eslint-disable-next-line @typescript-eslint/no-deprecated -- Coverage audit intentionally inspects ESLint's current builtin rule registry
		const unclassified = Iterator.from(builtinRules)
			.filter(([ruleName, rule]) => !isDeprecated(rule) && !Object.hasOwn(rules, ruleName))
			.map(([ruleName]) => ruleName)
			.toArray()
			.toSorted((left, right) => left.localeCompare(right));

		expect(unclassified).toEqual([]);
	});

	it('classifies every current non-deprecated typescript-eslint rule', async () => {
		const config = await createConfig({ tsconfigRootDir: process.cwd(), tsTypeChecked: true });
		const tsConfig = getTypeScriptConfig(config);
		expect(tsConfig).toBeDefined();

		const plugin = tsConfig?.plugins?.['@typescript-eslint'] as RulePlugin | undefined;
		const rules = tsConfig?.rules ?? {};
		const unclassified = Object.entries(plugin?.rules ?? {})
			.filter(([ruleName, rule]) => !isDeprecated(rule) && !Object.hasOwn(rules, `@typescript-eslint/${ruleName}`))
			.map(([ruleName]) => ruleName)
			.toSorted((left, right) => left.localeCompare(right));

		expect(unclassified).toEqual([]);
	});
});
