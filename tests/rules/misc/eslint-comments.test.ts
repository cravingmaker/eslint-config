/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError } from '../../utilities.js';

describe('eslint-comments rules', () => {
	it('@eslint-community/eslint-comments/no-use: reports disallowed directive kinds', async () => {
		await expectLintError(
			`missingValue; // eslint-disable-line no-undef -- inline disable comments are disallowed
export {};
`,
			'@eslint-community/eslint-comments/no-use',
			{ filePath: 'test.js' },
		);
	});

	it('@eslint-community/eslint-comments/require-description: reports directives without descriptions', async () => {
		await expectLintError(
			`// eslint-disable-next-line no-undef
missingValue;
export {};
`,
			'@eslint-community/eslint-comments/require-description',
			{ filePath: 'test.js' },
		);
	});

	it('@eslint-community/eslint-comments/no-duplicate-disable: reports duplicate disabled rules', async () => {
		await expectLintError(
			`/* eslint-disable no-undef -- first temporary disable */
/* eslint-disable no-undef -- duplicate temporary disable */
missingValue;
/* eslint-enable no-undef -- restore no-undef */
export {};
`,
			'@eslint-community/eslint-comments/no-duplicate-disable',
			{ filePath: 'test.js' },
		);
	});

	it('@eslint-community/eslint-comments/disable-enable-pair: reports non-whole-file disables without matching enables', async () => {
		await expectLintError(
			`export const value = 1;
/* eslint-disable no-undef -- temporary local disable */
missingValue;
`,
			'@eslint-community/eslint-comments/disable-enable-pair',
			{ filePath: 'test.js' },
		);
	});
});
