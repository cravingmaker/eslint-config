/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError } from '../../utilities.js';

describe('import-x rules', () => {
	it('import-x/extensions: requires explicit JavaScript file extensions for relative imports', async () => {
		await expectLintError(`import { value } from './fixture';\nconsole.log(value);\n`, 'import-x/extensions', {
			filePath: 'test.js',
		});
	});

	it('import-x/newline-after-import: requires exactly one blank line after imports', async () => {
		await expectLintError(
			`import process from 'node:process';\nconsole.log(process.cwd());\n`,
			'import-x/newline-after-import',
			{ filePath: 'test.js' },
		);
	});

	it('import-x/no-commonjs: reports CommonJS require calls', async () => {
		await expectLintError(
			`const process = require('node:process');\nconsole.log(process.cwd());\n`,
			'import-x/no-commonjs',
			{ filePath: 'test.js' },
		);
	});

	it('import-x/no-namespace: reports namespace imports outside the allowed modules list', async () => {
		await expectLintError(
			`import * as utilities from './utilities.js';\nconsole.log(utilities);\n`,
			'import-x/no-namespace',
			{ filePath: 'test.js' },
		);
	});

	it('import-x/no-duplicates: reports repeated imports from the same module', async () => {
		await expectLintError(
			`import { arch } from 'node:process';\nimport { cwd } from 'node:process';\n\nconsole.log(arch, cwd);\n`,
			'import-x/no-duplicates',
			{ filePath: 'test.js' },
		);
	});
});
