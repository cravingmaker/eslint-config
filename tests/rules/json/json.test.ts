/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError } from '../../utilities.js';

describe('json rules', () => {
	it('json/sort-keys: reports unsorted object keys in JSON files', async () => {
		await expectLintError(`{\n\t"zebra": true,\n\t"apple": true\n}\n`, 'json/sort-keys', { filePath: 'config.json' });
	});
});
