/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError, expectNoLintError } from '../../utilities.js';

const jsOptions = { filePath: 'test.js' } as const;

describe('unused-imports rules', () => {
	it('unused-imports/no-unused-imports: reports imports with no references', async () => {
		await expectLintError(
			`import { readFile } from 'node:fs/promises';\n\nconsole.log('ready');\n`,
			'unused-imports/no-unused-imports',
			jsOptions,
		);
	});

	it('unused-imports/no-unused-vars: reports unused variables through the plugin replacement rule', async () => {
		await expectLintError(
			`const unusedValue = 1;\nconsole.log('ready');\n`,
			'unused-imports/no-unused-vars',
			jsOptions,
		);
	});

	it('unused-imports/no-unused-vars: allows intentionally ignored underscore-prefixed variables', async () => {
		await expectNoLintError(
			`const _unusedValue = 1;\nconsole.log('ready');\n`,
			'unused-imports/no-unused-vars',
			jsOptions,
		);
	});
});
