/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError, expectNoLintError } from '../../utilities.js';

const jsOptions = { filePath: 'test.js' } as const;

describe('regexp rules', () => {
	it('regexp/hexadecimal-escape: disallows hexadecimal escapes in favor of alternatives', async () => {
		await expectLintError(`const pattern = /\\x41/u;\nconsole.log(pattern);\n`, 'regexp/hexadecimal-escape', jsOptions);
	});

	it('regexp/prefer-character-class: reports two-option single-character alternatives', async () => {
		await expectLintError(
			`const pattern = /a|b/u;\nconsole.log(pattern);\n`,
			'regexp/prefer-character-class',
			jsOptions,
		);
	});

	it('regexp/unicode-property: enforces the configured long key/property form', async () => {
		await expectLintError(
			`const pattern = /\\p{sc=Grek}/u;\nconsole.log(pattern);\n`,
			'regexp/unicode-property',
			jsOptions,
		);
	});

	it('regexp/prefer-regexp-test: reports RegExp#exec used as a boolean check', async () => {
		await expectLintError(
			`const matches = /ready/u.exec('ready') !== null;\nconsole.log(matches);\n`,
			'regexp/prefer-regexp-test',
			jsOptions,
		);
	});

	it('regexp/no-empty-character-class: reports empty character classes', async () => {
		await expectLintError(
			`const pattern = /[]/u;\nconsole.log(pattern);\n`,
			'regexp/no-empty-character-class',
			jsOptions,
		);
	});

	it('regexp/sort-flags: reports unsorted regexp flags', async () => {
		await expectLintError(`const pattern = /ready/miu;\nconsole.log(pattern);\n`, 'regexp/sort-flags', jsOptions);
	});

	it('regexp/prefer-escape-replacement-dollar-char: stays disabled for WYSIWYG replacements', async () => {
		await expectNoLintError(
			`const value = 'total'.replace(/total/u, '$1');\nconsole.log(value);\n`,
			'regexp/prefer-escape-replacement-dollar-char',
			jsOptions,
		);
	});

	it('regexp/require-unicode-regexp: stays disabled for non-unicode regexes', async () => {
		await expectNoLintError(
			`const pattern = /ready/;\nconsole.log(pattern);\n`,
			'regexp/require-unicode-regexp',
			jsOptions,
		);
	});

	it('regexp/require-unicode-sets-regexp: stays disabled for unicode regexes without the v flag', async () => {
		await expectNoLintError(
			`const pattern = /ready/u;\nconsole.log(pattern);\n`,
			'regexp/require-unicode-sets-regexp',
			jsOptions,
		);
	});
});
