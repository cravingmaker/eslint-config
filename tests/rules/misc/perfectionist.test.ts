/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError, expectNoLintError } from '../../utilities.js';

const jsOptions = { filePath: 'test.js' } as const;
const jsxOptions = { filePath: 'test.jsx' } as const;
const tsOptions = { filePath: 'tests/utilities.ts', tsTypeChecked: true } as const;

describe('perfectionist rules', () => {
	it('perfectionist/sort-array-includes: sorts array literals before includes calls', async () => {
		await expectLintError(
			`const found = ['beta', 'alpha'].includes('alpha');\nconsole.log(found);\n`,
			'perfectionist/sort-array-includes',
			jsOptions,
		);
	});

	it('perfectionist/sort-arrays: sorts const-asserted array literals only', async () => {
		await expectLintError(
			`const names = ['beta', 'alpha'] as const;\nconsole.log(names);\n`,
			'perfectionist/sort-arrays',
			tsOptions,
		);
	});

	it('perfectionist/sort-classes: sorts class members by configured groups', async () => {
		await expectLintError(
			`class Store {\n\tload() {\n\t\treturn 'ready';\n\t}\n\n\tstatic id = 'store';\n}\nconsole.log(Store);\n`,
			'perfectionist/sort-classes',
			jsOptions,
		);
	});

	it('perfectionist/sort-decorators: sorts decorators alphabetically', async () => {
		await expectLintError(
			`function beta(value: unknown) {\n\treturn value;\n}\nfunction alpha(value: unknown) {\n\treturn value;\n}\n\n@beta\n@alpha\nclass Store {}\nconsole.log(Store);\n`,
			'perfectionist/sort-decorators',
			tsOptions,
		);
	});

	it('perfectionist/sort-enums: sorts enum members', async () => {
		await expectLintError(
			`enum Status {\n\tReady = 'ready',\n\tDraft = 'draft',\n}\nconsole.log(Status);\n`,
			'perfectionist/sort-enums',
			tsOptions,
		);
	});

	it('perfectionist/sort-export-attributes: sorts export attributes', async () => {
		await expectLintError(
			`export { default } from './data.json' with { type: 'json', integrity: 'sha256-test' };\n`,
			'perfectionist/sort-export-attributes',
			jsOptions,
		);
	});

	it('perfectionist/sort-exports: sorts export declarations', async () => {
		await expectLintError(
			`export * from './beta.js';\nexport * from './alpha.js';\n`,
			'perfectionist/sort-exports',
			jsOptions,
		);
	});

	it('perfectionist/sort-heritage-clauses: sorts implemented interfaces', async () => {
		await expectLintError(
			`interface Alpha {}\ninterface Beta {}\nclass Store implements Beta, Alpha {}\nconsole.log(Store);\n`,
			'perfectionist/sort-heritage-clauses',
			tsOptions,
		);
	});

	it('perfectionist/sort-import-attributes: sorts import attributes', async () => {
		await expectLintError(
			`import data from './data.json' with { type: 'json', integrity: 'sha256-test' };\nconsole.log(data);\n`,
			'perfectionist/sort-import-attributes',
			jsOptions,
		);
	});

	it('perfectionist/sort-imports: sorts imports by configured groups', async () => {
		await expectLintError(
			`import { ESLint } from 'eslint';\nimport type { Linter } from 'eslint';\nconsole.log(ESLint);\n`,
			'perfectionist/sort-imports',
			tsOptions,
		);
	});

	it('perfectionist/sort-interfaces: sorts required properties before optional properties', async () => {
		await expectLintError(
			`interface User {\n\tname?: string;\n\tid: string;\n}\nconst user: User = { id: '1' };\nconsole.log(user);\n`,
			'perfectionist/sort-interfaces',
			tsOptions,
		);
	});

	it('perfectionist/sort-intersection-types: sorts intersection members by configured type groups', async () => {
		await expectLintError(
			`type Entity = { id: string } & string;\nconst entity = 'id' as Entity;\nconsole.log(entity);\n`,
			'perfectionist/sort-intersection-types',
			tsOptions,
		);
	});

	it('perfectionist/sort-jsx-props: sorts JSX props by configured groups', async () => {
		await expectLintError(
			`const element = <button onClick={() => undefined} disabled />;\nconsole.log(element);\n`,
			'perfectionist/sort-jsx-props',
			jsxOptions,
		);
	});

	it('perfectionist/sort-maps: sorts map entries', async () => {
		await expectLintError(
			`const values = new Map([\n\t['beta', 2],\n\t['alpha', 1],\n]);\nconsole.log(values);\n`,
			'perfectionist/sort-maps',
			jsOptions,
		);
	});

	it('perfectionist/sort-modules: sorts module declarations by configured groups', async () => {
		await expectLintError(
			`class Store {}\ninterface User {\n\tid: string;\n}\n`,
			'perfectionist/sort-modules',
			tsOptions,
		);
	});

	it('perfectionist/sort-named-exports: sorts named export specifiers', async () => {
		await expectLintError(
			`const alpha = 1;\nconst beta = 2;\nexport { beta, alpha };\n`,
			'perfectionist/sort-named-exports',
			jsOptions,
		);
	});

	it('perfectionist/sort-named-imports: sorts named import specifiers', async () => {
		await expectLintError(
			`import { writeFile, readFile } from 'node:fs/promises';\nconsole.log(writeFile, readFile);\n`,
			'perfectionist/sort-named-imports',
			jsOptions,
		);
	});

	it('perfectionist/sort-object-types: sorts type literal members by configured groups', async () => {
		await expectLintError(
			`type User = {\n\tname?: string;\n\tid: string;\n};\nconst user: User = { id: '1' };\nconsole.log(user);\n`,
			'perfectionist/sort-object-types',
			tsOptions,
		);
	});

	it('perfectionist/sort-objects: sorts object properties', async () => {
		await expectLintError(
			`const user = {\n\tname: 'Ada',\n\tid: '1',\n};\nconsole.log(user);\n`,
			'perfectionist/sort-objects',
			jsOptions,
		);
	});

	it('perfectionist/sort-sets: sorts set entries', async () => {
		await expectLintError(
			`const values = new Set(['beta', 'alpha']);\nconsole.log(values);\n`,
			'perfectionist/sort-sets',
			jsOptions,
		);
	});

	it('perfectionist/sort-switch-case: sorts switch cases', async () => {
		await expectLintError(
			`const value = 'alpha';\nswitch (value) {\n\tcase 'beta':\n\t\tconsole.log('beta');\n\t\tbreak;\n\tcase 'alpha':\n\t\tconsole.log('alpha');\n\t\tbreak;\n\tdefault:\n\t\tconsole.log('other');\n}\n`,
			'perfectionist/sort-switch-case',
			jsOptions,
		);
	});

	it('perfectionist/sort-union-types: sorts union members by configured type groups', async () => {
		await expectLintError(
			`type Value = { id: string } | string;\nconst value = 'id' as Value;\nconsole.log(value);\n`,
			'perfectionist/sort-union-types',
			tsOptions,
		);
	});

	it('perfectionist/sort-variable-declarations: stays disabled in favor of one-var', async () => {
		await expectNoLintError(
			`const beta = 2, alpha = 1;\nconsole.log(beta, alpha);\n`,
			'perfectionist/sort-variable-declarations',
			jsOptions,
		);
	});
});
