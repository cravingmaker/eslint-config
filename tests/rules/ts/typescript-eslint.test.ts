/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError } from '../../utilities.js';

const tsOptions = { filePath: 'tests/utilities.ts', tsTypeChecked: true } as const;

describe('typescript-eslint rules', () => {
	it('@typescript-eslint/ban-ts-comment: requires descriptions for expected errors', async () => {
		await expectLintError(
			`// @ts-expect-error: TODO\nconst value: string = 1;\nconsole.log(value);\n`,
			'@typescript-eslint/ban-ts-comment',
			tsOptions,
		);
	});

	it('@typescript-eslint/no-empty-object-type: reports empty object type aliases', async () => {
		await expectLintError(
			`type Options = {};\nconst options: Options = {};\nconsole.log(options);\n`,
			'@typescript-eslint/no-empty-object-type',
			tsOptions,
		);
	});

	it('@typescript-eslint/triple-slash-reference: reports path references', async () => {
		await expectLintError(
			`/// <reference path="./types.d.ts" />\nconst value = 1;\nconsole.log(value);\n`,
			'@typescript-eslint/triple-slash-reference',
			tsOptions,
		);
	});

	it('@typescript-eslint/array-type: reports non-simple generic array types', async () => {
		await expectLintError(
			`type Values = Array<string>;\nconst values: Values = ['one'];\nconsole.log(values);\n`,
			'@typescript-eslint/array-type',
			tsOptions,
		);
	});

	it('@typescript-eslint/consistent-type-assertions: reports angle-bracket assertions', async () => {
		await expectLintError(
			`const value = <string>'one';\nconsole.log(value);\n`,
			'@typescript-eslint/consistent-type-assertions',
			tsOptions,
		);
	});

	it('@typescript-eslint/consistent-type-definitions: reports interface declarations', async () => {
		await expectLintError(
			`interface User {\n\tname: string;\n}\nconst user: User = { name: 'Ada' };\nconsole.log(user);\n`,
			'@typescript-eslint/consistent-type-definitions',
			tsOptions,
		);
	});

	it('@typescript-eslint/explicit-member-accessibility: reports explicit public members', async () => {
		await expectLintError(
			`class Store {\n\tpublic value = 1;\n}\nconsole.log(Store);\n`,
			'@typescript-eslint/explicit-member-accessibility',
			tsOptions,
		);
	});

	it('@typescript-eslint/no-use-before-define: reports classes used before declarations', async () => {
		await expectLintError(
			`const value = new Store();\nclass Store {}\nconsole.log(value);\n`,
			'@typescript-eslint/no-use-before-define',
			tsOptions,
		);
	});
});
