/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, it } from 'vitest';

import { expectLintError } from '../../utilities.js';

const tsOptions = { filePath: 'tests/utilities.ts', tsTypeChecked: true } as const;

describe('functional rules', () => {
	it('functional/no-let: reports reassigned local bindings', async () => {
		await expectLintError(`let count = 0;\ncount += 1;\nconsole.log(count);\n`, 'functional/no-let', tsOptions);
	});

	it('functional/no-expression-statements: reports bare call expressions', async () => {
		await expectLintError(
			`function getValue(): string {\n\treturn 'ready';\n}\ngetValue();\n`,
			'functional/no-expression-statements',
			tsOptions,
		);
	});

	it('functional/readonly-type: requires readonly type literal properties', async () => {
		await expectLintError(
			`type User = Readonly<{ name: string }>;\nconst user: User = { name: 'Ada' };\nconsole.log(user);\n`,
			'functional/readonly-type',
			tsOptions,
		);
	});

	it('functional/prefer-immutable-types: reports mutable function parameters', async () => {
		await expectLintError(
			`function first(values: string[]): string {\n\treturn values[0] ?? '';\n}\nconsole.log(first(['one']));\n`,
			'functional/prefer-immutable-types',
			tsOptions,
		);
	});
});
