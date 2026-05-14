/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintErrorInFile, expectNoLintErrorInFile } from '../../utilities.js';

const mdOptions = { filePath: 'test.md' } as const;

describe('markdown rules', () => {
	it('markdown/fenced-code-language: reports fenced code blocks without a language', async () => {
		await expectLintErrorInFile('```\nconst x = 1;\n```\n', 'markdown/fenced-code-language', mdOptions);
	});

	it('markdown/heading-increment: reports headings that skip a level', async () => {
		await expectLintErrorInFile('# Title\n\n### Skipped\n', 'markdown/heading-increment', mdOptions);
	});

	it('markdown/no-duplicate-definitions: reports duplicate link definitions', async () => {
		await expectLintErrorInFile(
			'[foo]: https://a.com\n[foo]: https://b.com\n',
			'markdown/no-duplicate-definitions',
			mdOptions,
		);
	});

	it('markdown/no-multiple-h1: reports multiple H1 headings', async () => {
		await expectLintErrorInFile('# First\n\n# Second\n', 'markdown/no-multiple-h1', mdOptions);
	});

	it('markdown/no-reversed-media-syntax: reports reversed image syntax', async () => {
		await expectLintErrorInFile('(url)[text]\n', 'markdown/no-reversed-media-syntax', mdOptions);
	});

	it('markdown/fenced-code-meta: stays disabled', async () => {
		await expectNoLintErrorInFile('```js\nconst x = 1;\n```\n', 'markdown/fenced-code-meta', mdOptions);
	});

	it('markdown/no-duplicate-headings: stays disabled', async () => {
		await expectNoLintErrorInFile('# Title\n\n## Section\n\n## Section\n', 'markdown/no-duplicate-headings', mdOptions);
	});
});
