/* eslint-disable functional/no-expression-statements, functional/no-return-void, n/no-sync, security/detect-non-literal-fs-filename -- Packed-package smoke tests intentionally perform filesystem and process side effects. */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

type ConsumerOptions = {
	readonly dependencies: readonly string[];
	readonly manifestDevDependencies?: Readonly<Record<string, string>>;
	readonly name: string;
	readonly tarball: string;
};

const projectDirectory = path.resolve(__dirname, '..');

const runtimeDependencies: readonly string[] = [
	'@eslint-community/eslint-plugin-eslint-comments',
	'eslint-enforce-package-type',
	'eslint-import-resolver-typescript',
	'eslint-plugin-functional',
	'eslint-plugin-import-x',
	'eslint-plugin-n',
	'eslint-plugin-package-json',
	'eslint-plugin-perfectionist',
	'eslint-plugin-promise',
	'eslint-plugin-regexp',
	'eslint-plugin-security',
	'eslint-plugin-unicorn',
	'eslint-plugin-unused-imports',
	'@eslint/json',
	'@eslint/markdown',
	'globals',
	'@html-eslint/eslint-plugin',
	'@html-eslint/parser',
	'jsonc-eslint-parser',
	'typescript-eslint',
];

const optionalPeerDependencies: readonly string[] = [
	'@html-eslint/eslint-plugin-react',
	'@html-eslint/eslint-plugin-svelte',
	'eslint-plugin-express-security',
	'eslint-plugin-react-hooks',
	'eslint-plugin-react-refresh',
	'react',
	'svelte',
	'svelte-eslint-parser',
];

const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'eslint-config-package-'));

const linkDependency = async (nodeModulesDirectory: string, dependency: string) => {
	const source = path.join(projectDirectory, 'node_modules', dependency);
	const destination = path.join(nodeModulesDirectory, dependency);

	await fs.mkdir(path.dirname(destination), { recursive: true });
	await fs.symlink(source, destination, 'junction');
};

const createPackedPackage = async (baseDirectory: string) => {
	execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', baseDirectory], {
		cwd: projectDirectory,
		encoding: 'utf8',
	});

	const packedFiles = await fs.readdir(baseDirectory);
	const tarballs = packedFiles.filter((file) => file.endsWith('.tgz'));
	expect(tarballs).toHaveLength(1);

	const [tarballFilename] = tarballs;
	if (tarballFilename === undefined) throw new Error('Packed tarball was not created');

	return path.join(baseDirectory, tarballFilename);
};

const createConsumer = async ({ dependencies, manifestDevDependencies = {}, name, tarball }: ConsumerOptions) => {
	const consumerDirectory = path.join(temporaryDirectory, name);
	const nodeModulesDirectory = path.join(consumerDirectory, 'node_modules');
	const packageDirectory = path.join(nodeModulesDirectory, '@cravingmaker', 'eslint-config');

	await fs.mkdir(packageDirectory, { recursive: true });

	execFileSync('tar', ['-xzf', tarball, '--strip-components=1', '-C', packageDirectory], {
		cwd: temporaryDirectory,
	});

	await Promise.all(
		dependencies.map(async (dependency) => {
			await linkDependency(nodeModulesDirectory, dependency);
		}),
	);

	await fs.writeFile(
		path.join(consumerDirectory, 'package.json'),
		JSON.stringify({
			devDependencies: manifestDevDependencies,
			name: `eslint-config-${name}`,
			private: true,
			type: 'module',
		}),
		'utf8',
	);

	return consumerDirectory;
};

const runConsumer = (consumerDirectory: string, script: string) =>
	execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
		cwd: consumerDirectory,
		encoding: 'utf8',
	});

const tarball = await createPackedPackage(temporaryDirectory);

describe('published package', () => {
	afterAll(async () => {
		await fs.rm(temporaryDirectory, { force: true, recursive: true });
	});

	it('works without optional peers and switches TypeScript type checking explicitly', async () => {
		const consumerDirectory = await createConsumer({
			dependencies: ['eslint', ...runtimeDependencies],
			name: 'base-consumer',
			tarball,
		});

		const output = runConsumer(
			consumerDirectory,
			String.raw`
				import { createConfig } from '@cravingmaker/eslint-config';

				const optionalPluginNames = [
					'@html-eslint/react',
					'@html-eslint/svelte',
					'express-security',
					'react-hooks',
					'react-refresh',
				];

				const getPluginNames = (config) =>
					new Set(config.flatMap((entry) => Object.keys(entry.plugins ?? {})));

				const getTypeScriptConfig = (config) =>
					config.find((entry) => Object.hasOwn(entry.plugins ?? {}, '@typescript-eslint'));

				const untyped = await createConfig({ tsTypeChecked: false });
				const typed = await createConfig({ tsTypeChecked: true });

				if (!Array.isArray(untyped) || untyped.length === 0) {
					throw new Error('createConfig did not return a non-empty flat config');
				}

				const detectedOptionalPlugins = optionalPluginNames.filter((name) => getPluginNames(untyped).has(name));
				if (detectedOptionalPlugins.length !== 0) {
					throw new Error(`Optional plugins were loaded unexpectedly: ${detectedOptionalPlugins.join(', ')}`);
				}

				const untypedTsConfig = getTypeScriptConfig(untyped);
				const typedTsConfig = getTypeScriptConfig(typed);

				if (!untypedTsConfig || !typedTsConfig) {
					throw new Error('TypeScript config was not created');
				}

				if (untypedTsConfig.languageOptions?.parserOptions?.projectService !== undefined) {
					throw new Error('Untyped TypeScript config unexpectedly enabled projectService');
				}

				if (typedTsConfig.languageOptions?.parserOptions?.projectService !== true) {
					throw new Error('Typed TypeScript config did not enable projectService');
				}

				if (typedTsConfig.rules?.['@typescript-eslint/no-unsafe-assignment'] !== 'error') {
					throw new Error('Typed TypeScript rules were not enabled');
				}

				process.stdout.write('ok');
			`,
		);

		expect(output).toBe('ok');
	});

	it('loads optional integrations from the consumer and auto-detects Vite', async () => {
		const consumerDirectory = await createConsumer({
			dependencies: ['eslint', ...runtimeDependencies, ...optionalPeerDependencies],
			manifestDevDependencies: { vite: '1.0.0' },
			name: 'full-consumer',
			tarball,
		});

		const output = runConsumer(
			consumerDirectory,
			String.raw`
				import { createConfig } from '@cravingmaker/eslint-config';

				const config = await createConfig({ tsTypeChecked: false });
				const pluginNames = new Set(config.flatMap((entry) => Object.keys(entry.plugins ?? {})));

				for (const plugin of [
					'@html-eslint/react',
					'@html-eslint/svelte',
					'express-security',
					'react-hooks',
					'react-refresh',
				]) {
					if (!pluginNames.has(plugin)) {
						throw new Error(`Optional plugin was not loaded: ${plugin}`);
					}
				}

				const refreshConfig = config.find((entry) => Object.hasOwn(entry.plugins ?? {}, 'react-refresh'));
				const refreshRule = refreshConfig?.rules?.['react-refresh/only-export-components'];

				if (!Array.isArray(refreshRule) || refreshRule[0] !== 'warn') {
					throw new Error('React Refresh rule was not configured');
				}

				if (refreshRule[1]?.allowConstantExport !== true) {
					throw new Error('Vite React Refresh variant was not auto-detected');
				}

				process.stdout.write('ok');
			`,
		);

		expect(output).toBe('ok');
	});
});
