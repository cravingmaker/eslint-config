/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError } from '../../utilities.js';

describe('n rules', () => {
	it('n/no-process-env: reports disallowed process.env variables', async () => {
		await expectLintError(`console.log(process.env.PORT);\n`, 'n/no-process-env', { filePath: 'test.js' });
	});

	it('n/no-sync: reports sync APIs below the module root', async () => {
		await expectLintError(
			`import fs from 'node:fs';\nfunction loadFixture(path) {\n\treturn fs.readFileSync(path, 'utf8');\n}\nconsole.log(loadFixture('fixture.txt'));\n`,
			'n/no-sync',
			{ filePath: 'test.js' },
		);
	});

	it('n/no-deprecated-api: reports deprecated Node.js APIs', async () => {
		await expectLintError(
			`import { Buffer } from 'node:buffer';\nconst value = new Buffer(1);\nconsole.log(value);\n`,
			'n/no-deprecated-api',
			{ filePath: 'test.js' },
		);
	});
});
