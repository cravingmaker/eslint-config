/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError } from '../../utilities.js';

describe('js suggestion rules', () => {
	it('accessor-pairs: reports setters without getters on class members', async () => {
		await expectLintError(
			`class Store {\n\tset value(value) {\n\t\tthis.current = value;\n\t}\n}\nconsole.log(Store);\n`,
			'accessor-pairs',
			{ filePath: 'test.js' },
		);
	});

	it('camelcase: reports non-camelcase variable declarations', async () => {
		await expectLintError(`const snake_case = 1;\nconsole.log(snake_case);\n`, 'camelcase', { filePath: 'test.js' });
	});

	it('dot-notation: reports unnecessary bracket property access', async () => {
		await expectLintError(`const item = { name: 'test' };\nconsole.log(item['name']);\n`, 'dot-notation', {
			filePath: 'test.js',
		});
	});

	it('func-name-matching: reports named function expressions that do not match their variable', async () => {
		await expectLintError(
			`const loadUser = function fetchUser() {\n\treturn 'user';\n};\nconsole.log(loadUser());\n`,
			'func-name-matching',
			{ filePath: 'test.js' },
		);
	});

	it('grouped-accessor-pairs: reports accessors separated by another class member', async () => {
		await expectLintError(
			`const store = {\n\tget value() {\n\t\treturn this.current;\n\t},\n\treset() {\n\t\tthis.current = 0;\n\t},\n\tset value(value) {\n\t\tthis.current = value;\n\t},\n};\nconsole.log(store);\n`,
			'grouped-accessor-pairs',
			{ filePath: 'test.js' },
		);
	});

	it('no-empty: allows empty catch blocks but reports other empty blocks', async () => {
		await expectLintError(`const active = true;\nif (active) {\n}\n`, 'no-empty', { filePath: 'test.js' });
	});

	it('prefer-destructuring: reports object property variable declarations', async () => {
		await expectLintError(
			`const item = { name: 'test' };\nconst name = item.name;\nconsole.log(name);\n`,
			'prefer-destructuring',
			{ filePath: 'test.js' },
		);
	});

	it('prefer-regex-literals: reports redundant RegExp constructors', async () => {
		await expectLintError(`const pattern = new RegExp('abc');\nconsole.log(pattern);\n`, 'prefer-regex-literals', {
			filePath: 'test.js',
		});
	});
});
