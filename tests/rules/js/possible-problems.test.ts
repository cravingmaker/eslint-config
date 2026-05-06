/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError } from '../../utilities.js';

describe('js possible problem rules', () => {
	it('no-undef: reports typeof checks against undeclared variables', async () => {
		await expectLintError(`if (typeof missingValue === 'undefined') {\n\tconsole.log('missing');\n}\n`, 'no-undef', {
			filePath: 'test.js',
		});
	});

	it('no-unsafe-negation: reports negated left operands in ordering relations', async () => {
		await expectLintError(`const value = 1;\nif (!value < 2) {\n\tconsole.log(value);\n}\n`, 'no-unsafe-negation', {
			filePath: 'test.js',
		});
	});

	it('no-unsafe-optional-chaining: reports arithmetic on optional chains', async () => {
		await expectLintError(
			`const item = {};\nconst total = item?.count + 1;\nconsole.log(total);\n`,
			'no-unsafe-optional-chaining',
			{ filePath: 'test.js' },
		);
	});

	it('no-promise-executor-return: reports returned values from promise executors', async () => {
		await expectLintError(
			`const promise = new Promise((resolve) => {\n\treturn resolve(1);\n});\nconsole.log(promise);\n`,
			'no-promise-executor-return',
			{ filePath: 'test.js' },
		);
	});

	it('no-use-before-define: reports variables used before declaration', async () => {
		await expectLintError(`const result = value;\nconst value = 1;\nconsole.log(result);\n`, 'no-use-before-define', {
			filePath: 'test.js',
		});
	});
});
