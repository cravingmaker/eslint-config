/* eslint-disable @typescript-eslint/no-unsafe-type-assertion, functional/no-expression-statements, functional/no-return-void, security/detect-non-literal-fs-filename -- Package contract tests intentionally read repository manifests and assert their published shape. */

import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

type StringRecord = Readonly<Record<string, string>>;
type PackageManifest = {
	readonly dependencies: StringRecord;
	readonly devDependencies: StringRecord;
	readonly devEngines: {
		readonly runtime: {
			readonly name: string;
			readonly onFail: string;
			readonly version: string;
		};
	};
	readonly engines: StringRecord;
	readonly exports: Readonly<
		Record<
			string,
			{
				readonly default?: string;
				readonly import?: string;
				readonly types?: string;
			}
		>
	>;
	readonly files: readonly string[];
	readonly main: string;
	readonly peerDependencies: StringRecord;
	readonly peerDependenciesMeta: Readonly<Record<string, { readonly optional?: boolean }>>;
	readonly private: boolean;
	readonly publishConfig: StringRecord;
	readonly sideEffects: boolean;
	readonly type: string;
	readonly types: string;
};
type PackageLock = {
	readonly packages: Readonly<
		Record<
			string,
			{
				readonly dependencies?: StringRecord;
				readonly devDependencies?: StringRecord;
				readonly engines?: StringRecord;
				readonly peerDependencies?: StringRecord;
				readonly peerDependenciesMeta?: Readonly<Record<string, { readonly optional?: boolean }>>;
			}
		>
	>;
};

const expectedOptionalPeerDependencies = [
	'@html-eslint/eslint-plugin-react',
	'@html-eslint/eslint-plugin-svelte',
	'eslint-plugin-express-security',
	'eslint-plugin-react-hooks',
	'eslint-plugin-react-refresh',
	'react',
	'svelte',
	'svelte-eslint-parser',
] as const;

const expectedPeerDependencies = {
	'@html-eslint/eslint-plugin-react': '>=0.60.0 <1',
	'@html-eslint/eslint-plugin-svelte': '>=0.60.0 <1',
	eslint: '>=10.4.0 <11',
	'eslint-plugin-express-security': '>=1.2.0 <4',
	'eslint-plugin-react-hooks': '>=7.0.0 <8',
	'eslint-plugin-react-refresh': '>=0.5.0 <1',
	react: '>=19.0.0 <20',
	svelte: '>=5.0.0 <6',
	'svelte-eslint-parser': '>=1.6.0 <2',
} as const;

const readJson = async <T>(url: URL): Promise<T> => JSON.parse(await readFile(url, 'utf8')) as T;

const packageManifest = await readJson<PackageManifest>(new URL('../package.json', import.meta.url));
const packageLock = await readJson<PackageLock>(new URL('../package-lock.json', import.meta.url));
const packageLockRoot = packageLock.packages[''];

describe('package contract', () => {
	it('publishes an ESM-only dist package with explicit support floors', () => {
		expect(packageManifest.private).toBe(false);
		expect(packageManifest.sideEffects).toBe(false);
		expect(packageManifest.type).toBe('module');
		expect(packageManifest.files).toEqual(['dist']);
		expect(packageManifest.main).toBe('./dist/index.mjs');
		expect(packageManifest.types).toBe('./dist/index.d.mts');

		expect(packageManifest.exports['.']?.types).toBe('./dist/index.d.mts');
		expect(packageManifest.exports['.']?.import).toBe('./dist/index.mjs');
		expect(packageManifest.exports['.']?.default).toBe('./dist/index.mjs');

		expect(packageManifest.engines).toEqual({ node: '>=24.15.0' });
		expect(packageManifest.devEngines).toEqual({
			runtime: {
				name: 'node',
				onFail: 'warn',
				version: '>=24.15.0',
			},
		});

		expect(packageManifest.publishConfig.access).toBe('public');
		expect(packageManifest.publishConfig.registry).toBe('https://registry.npmjs.org/');
	});

	it('keeps runtime, development, and peer dependency roles aligned', () => {
		const dependencyNames = Object.keys(packageManifest.dependencies);
		const peerDependencyNames = Object.keys(packageManifest.peerDependencies);

		expect(packageManifest.peerDependencies).toEqual(expectedPeerDependencies);
		expect(Object.keys(packageManifest.peerDependenciesMeta)).toEqual(expectedOptionalPeerDependencies);
		expect(
			expectedOptionalPeerDependencies.filter(
				(dependency) => packageManifest.peerDependenciesMeta[dependency]?.optional !== true,
			),
		).toEqual([]);

		expect(dependencyNames.filter((dependency) => Object.hasOwn(packageManifest.devDependencies, dependency))).toEqual([]);
		expect(dependencyNames.filter((dependency) => Object.hasOwn(packageManifest.peerDependencies, dependency))).toEqual([]);
		expect(
			peerDependencyNames.filter((dependency) => !Object.hasOwn(packageManifest.devDependencies, dependency)),
		).toEqual([]);
	});

	it('keeps the lockfile root contract synchronized with package.json', () => {
		expect(packageLockRoot).toBeDefined();
		expect(packageLockRoot?.dependencies).toEqual(packageManifest.dependencies);
		expect(packageLockRoot?.devDependencies).toEqual(packageManifest.devDependencies);
		expect(packageLockRoot?.engines).toEqual(packageManifest.engines);
		expect(packageLockRoot?.peerDependencies).toEqual(packageManifest.peerDependencies);
		expect(packageLockRoot?.peerDependenciesMeta).toEqual(packageManifest.peerDependenciesMeta);
	});
});
