/* eslint-disable import-x/unambiguous -- This is a global ambient declaration file */
declare module 'eslint-plugin-express-security' {
	import type { Linter } from 'eslint';

	export const configs: {
		recommended: { rules: Linter.RulesRecord };
	};
}
