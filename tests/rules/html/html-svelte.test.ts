/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError } from '../../utilities.js';

const svelteOptions = { filePath: 'component.svelte' } as const;

describe('html svelte rules', () => {
	it('@html-eslint/svelte/class-spacing: reports repeated spacing in class attributes', async () => {
		await expectLintError(
			`<div class="stack  center">Hello</div>\n`,
			'@html-eslint/svelte/class-spacing',
			svelteOptions,
		);
	});

	it('@html-eslint/svelte/no-duplicate-class: reports duplicate class tokens', async () => {
		await expectLintError(
			`<div class="stack stack">Hello</div>\n`,
			'@html-eslint/svelte/no-duplicate-class',
			svelteOptions,
		);
	});
});
