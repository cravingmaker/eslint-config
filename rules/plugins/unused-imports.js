import { noUnusedVarsOptions } from '../common.js';

const unusedImportsRules = {
	'unused-imports/no-unused-imports': 'error',

	// Rules with overridden options
	'no-unused-vars': 'off',
	'unused-imports/no-unused-vars': [
		'error',
		{
			...noUnusedVarsOptions,
		},
	],
};

export { unusedImportsRules };
