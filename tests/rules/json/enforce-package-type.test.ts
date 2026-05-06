/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError } from '../../utilities.js';

describe('enforce package type rules', () => {
	it('enforce-package-type/enforce-package-type: reports non-module package manifests', async () => {
		await expectLintError(
			`{\n\t"name": "fixture-package",\n\t"version": "1.0.0",\n\t"type": "commonjs"\n}\n`,
			'enforce-package-type/enforce-package-type',
			{ filePath: 'package.json' },
		);
	});
});
