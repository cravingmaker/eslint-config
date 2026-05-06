/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError } from '../../utilities.js';

const reactOptions = { filePath: 'component.jsx' } as const;

describe('html react rules', () => {
	it('@html-eslint/react/classname-spacing: reports repeated spacing in className values', async () => {
		await expectLintError(
			`const element = <div className="stack  center" />;\nconsole.log(element);\n`,
			'@html-eslint/react/classname-spacing',
			reactOptions,
		);
	});

	it('@html-eslint/react/no-duplicate-classname: reports duplicate className tokens', async () => {
		await expectLintError(
			`const element = <div className="stack stack" />;\nconsole.log(element);\n`,
			'@html-eslint/react/no-duplicate-classname',
			reactOptions,
		);
	});
});
