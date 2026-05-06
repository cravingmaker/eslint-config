/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError } from '../../utilities.js';

describe('security rules', () => {
	it('security/detect-child-process: reports child process execution', async () => {
		await expectLintError(
			`import childProcess from 'node:child_process';\nconst command = process.argv[2];\nchildProcess.exec(command);\n`,
			'security/detect-child-process',
			{ filePath: 'test.js' },
		);
	});

	it('security/detect-object-injection: reports dynamic object property access', async () => {
		await expectLintError(
			`const key = process.argv[2];\nconst item = { value: 1 };\nconsole.log(item[key]);\n`,
			'security/detect-object-injection',
			{ filePath: 'test.js' },
		);
	});

	it('security/detect-non-literal-regexp: reports RegExp constructors with variables', async () => {
		await expectLintError(
			`const input = process.argv[2];\nconst pattern = new RegExp(input);\nconsole.log(pattern);\n`,
			'security/detect-non-literal-regexp',
			{ filePath: 'test.js' },
		);
	});
});
