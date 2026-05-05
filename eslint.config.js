// @ts-check

import { createConfig } from './dist/index.mjs';
import { namingConventionOptions } from './src/options/common.ts';

// eslint-disable-next-line import-x/no-default-export -- ESLint flat config requires a default export
export default createConfig({
	rules: {
		ts: {
			// Rule definition files use ESLint plugin key notation (e.g. '@typescript-eslint/rule-name','plugin/rule')
			// which intentionally cannot conform to camelCase naming convention.
			'@typescript-eslint/naming-convention': [
				'error',
				...namingConventionOptions,
				// eslint-disable-next-line unicorn/no-null -- Format must be null to ignore properties that require quotes
				{ format: null, modifiers: ['requiresQuotes'], selector: 'property' },
			],
		},
	},
});
