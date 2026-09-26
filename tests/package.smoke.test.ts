/* eslint-disable functional/no-expression-statements, functional/no-return-void, n/no-sync, security/detect-non-literal-fs-filename -- Packed-package smoke test intentionally performs filesystem and process side effects. */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

const projectDirectory = path.resolve(__dirname, '..');

const runtimeDependencies = [
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
] as const;

const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'eslint-config-package-'));

const linkDependency = async (nodeModulesDirectory: string, dependency: string) => {
	const source = path.join(projectDirectory, 'node_modules', dependency);
	const destination = path.join(nodeModulesDirectory, dependency);

	await fs.mkdir(path.dirname(destination), { recursive: true });
	await fs.symlink(source, destination, 'junction');
};

const createConsumer = async (baseDirectory: string) => {
	const consumerDirectory = path.join(baseDirectory, 'consumer');
	const nodeModulesDirectory = path.join(consumerDirectory, 'node_modules');
	const packageDirectory = path.join(nodeModulesDirectory, '@cravingmaker', 'eslint-config');

	await fs.mkdir(packageDirectory, { recursive: true });

	execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', baseDirectory], {
		cwd: projectDirectory,
		encoding: 'utf8',
	});

	const packedFiles = await fs.readdir(baseDirectory);
	const tarballs = packedFiles.filter((file) => file.endsWith('.tgz'));
	expect(tarballs).toHaveLength(1);

	const tarball = path.join(baseDirectory, tarballs[0]);

	execFileSync('tar', ['-xzf', tarball, '--strip-components=1', '-C', packageDirectory], {
		cwd: baseDirectory,
	});

	await Promise.all(
		['eslint', ...runtimeDependencies].map(async (dependency) => {
			await linkDependency(nodeModulesDirectory, dependency);
		}),
	);

	await fs.writeFile(
		path.join(consumerDirectory, 'package.json'),
		JSON.stringify({
			name: 'eslint-config-smoke-consumer',
			private: true,
			type: 'module',
		}),
		'utf8',
	);

	return consumerDirectory;
};

describe('published package', () => {
	afterAll(async () => {
		await fs.rm(temporaryDirectory, { force: true, recursive: true });
	});

	it('imports and creates a config from the packed tarball', async () => {
		const consumerDirectory = await createConsumer(temporaryDirectory);

		const output = execFileSync(
			process.execPath,
			[
				'--input-type=module',
				'--eval',
				String.raw`
					import { createConfig } from '@cravingmaker/eslint-config';

					if (typeof createConfig !== 'function') {
						throw new Error('createConfig export is missing');
					}

					const config = await createConfig({ tsTypeChecked: false });

					if (!Array.isArray(config) || config.length === 0) {
						throw new Error('createConfig did not return a non-empty flat config');
					}

					process.stdout.write('ok');
				`,
			],
			{
				cwd: consumerDirectory,
				encoding: 'utf8',
			},
		);

		expect(output).toBe('ok');
	});
});
