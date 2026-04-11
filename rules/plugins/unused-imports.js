import { noUnusedVarsOptions } from '../common.js';

const unusedImportsRules = {
	'unused-imports/no-unused-imports': 'error',

	// Rules with overridden options
	'@typescript-eslint/no-unused-vars': 'off',
	'no-unused-vars': 'off',
	'unused-imports/no-unused-vars': [
		'error',
		{
			...noUnusedVarsOptions,
		},
	],
};

export { unusedImportsRules };
