/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError } from '../../utilities.js';

const expressOptions = { filePath: 'server.js' } as const;

describe('express-security rules', () => {
	it('express-security/require-helmet: reports missing helmet middleware', async () => {
		await expectLintError(
			`import express from 'express';\nconst app = express();\napp.get('/', (req, res) => res.send('ok'));\n`,
			'express-security/require-helmet',
			expressOptions,
		);
	});

	it('express-security/no-insecure-cookie-options: reports cookie without secure flag', async () => {
		await expectLintError(
			`import express from 'express';\nconst app = express();\napp.get('/', (req, res) => res.cookie('session', 'abc', { httpOnly: true }));\n`,
			'express-security/no-insecure-cookie-options',
			expressOptions,
		);
	});
});
