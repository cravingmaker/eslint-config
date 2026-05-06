/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError, expectNoLintError } from '../../utilities.js';

const jsOptions = { filePath: 'test.js' } as const;

describe('promise rules', () => {
	it('promise/always-return: requires then callbacks to return or throw', async () => {
		await expectLintError(
			`Promise.resolve('ready')\n\t.then((value) => {\n\t\tconsole.log(value);\n\t})\n\t.catch((error) => {\n\t\tthrow error;\n\t});\n`,
			'promise/always-return',
			jsOptions,
		);
	});

	it('promise/avoid-new: reports direct Promise constructor usage', async () => {
		await expectLintError(
			`const task = new Promise((resolve) => {\n\tresolve('ready');\n});\nconsole.log(task);\n`,
			'promise/avoid-new',
			jsOptions,
		);
	});

	it('promise/catch-or-return: requires unreturned promise chains to catch', async () => {
		await expectLintError(
			`Promise.resolve('ready').then((value) => value.toUpperCase());\n`,
			'promise/catch-or-return',
			jsOptions,
		);
	});

	it('promise/no-callback-in-promise: reports callbacks inside promise handlers', async () => {
		await expectLintError(
			`function load(callback) {\n\treturn Promise.resolve('ready').then((value) => {\n\t\tcallback(null, value);\n\t});\n}\nconsole.log(load);\n`,
			'promise/no-callback-in-promise',
			jsOptions,
		);
	});

	it('promise/no-multiple-resolved: reports promise executors that settle more than once', async () => {
		await expectLintError(
			`const task = new Promise((resolve) => {\n\tresolve('first');\n\tresolve('second');\n});\nconsole.log(task);\n`,
			'promise/no-multiple-resolved',
			jsOptions,
		);
	});

	it('promise/no-native: stays disabled in favor of the built-in Promise', async () => {
		await expectNoLintError(
			`const task = Promise.resolve('ready');\nconsole.log(task);\n`,
			'promise/no-native',
			jsOptions,
		);
	});

	it('promise/no-nesting: reports nested promise chains', async () => {
		await expectLintError(
			`Promise.resolve('ready')\n\t.then(() => {\n\t\treturn Promise.resolve('nested').then((value) => value);\n\t})\n\t.catch((error) => {\n\t\tthrow error;\n\t});\n`,
			'promise/no-nesting',
			jsOptions,
		);
	});

	it('promise/no-new-statics: reports new Promise static calls', async () => {
		await expectLintError(
			`const task = new Promise.resolve('ready');\nconsole.log(task);\n`,
			'promise/no-new-statics',
			jsOptions,
		);
	});

	it('promise/no-promise-in-callback: reports promise usage inside callbacks', async () => {
		await expectLintError(
			`function load(callback) {\n\tcallback(null);\n}\nload((error) => {\n\tif (error) {\n\t\tthrow error;\n\t}\n\tPromise.resolve('ready');\n});\n`,
			'promise/no-promise-in-callback',
			jsOptions,
		);
	});

	it('promise/no-return-in-finally: reports return statements inside finally handlers', async () => {
		await expectLintError(
			`Promise.resolve('ready')\n\t.finally(() => {\n\t\treturn 'done';\n\t})\n\t.catch((error) => {\n\t\tthrow error;\n\t});\n`,
			'promise/no-return-in-finally',
			jsOptions,
		);
	});

	it('promise/no-return-wrap: reports unnecessary Promise.resolve wrappers in chains', async () => {
		await expectLintError(
			`Promise.resolve('ready')\n\t.then((value) => Promise.resolve(value))\n\t.catch((error) => {\n\t\tthrow error;\n\t});\n`,
			'promise/no-return-wrap',
			jsOptions,
		);
	});

	it('promise/param-names: requires conventional Promise executor parameter names', async () => {
		await expectLintError(
			`const task = new Promise((done) => {\n\tdone('ready');\n});\nconsole.log(task);\n`,
			'promise/param-names',
			jsOptions,
		);
	});

	it('promise/prefer-await-to-callbacks: reports callback-style APIs', async () => {
		await expectLintError(
			`function load(callback) {\n\tcallback(null, 'ready');\n}\nconsole.log(load);\n`,
			'promise/prefer-await-to-callbacks',
			jsOptions,
		);
	});

	it('promise/prefer-await-to-then: reports promise chains inside functions', async () => {
		await expectLintError(
			`function load() {\n\treturn Promise.resolve('ready').then((value) => value);\n}\nconsole.log(load);\n`,
			'promise/prefer-await-to-then',
			jsOptions,
		);
	});

	it('promise/prefer-catch: reports rejection handlers passed to then', async () => {
		await expectLintError(
			`Promise.resolve('ready').then(\n\t(value) => value,\n\t(error) => {\n\t\tthrow error;\n\t},\n);\n`,
			'promise/prefer-catch',
			jsOptions,
		);
	});

	it('promise/spec-only: reports non-standard Promise static methods', async () => {
		await expectLintError(`const task = Promise.done('ready');\nconsole.log(task);\n`, 'promise/spec-only', jsOptions);
	});

	it('promise/valid-params: reports invalid Promise method arity', async () => {
		await expectLintError(
			`const task = Promise.resolve('ready', 'extra');\nconsole.log(task);\n`,
			'promise/valid-params',
			jsOptions,
		);
	});
});
