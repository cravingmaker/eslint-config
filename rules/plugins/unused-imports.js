const unusedImportsRules = {
	'unused-imports/no-unused-imports': 'error',

	// Rules with overridden options
	'unused-imports/no-unused-vars': [
		'error',
		{
			args: 'after-used',
			argsIgnorePattern: '^_',
			caughtErrors: 'all',
			caughtErrorsIgnorePattern: '^_',
			destructuredArrayIgnorePattern: '^_',
			ignoreClassWithStaticInitBlock: false,
			ignoreRestSiblings: true,
			ignoreUsingDeclarations: false,
			reportUsedIgnorePattern: false,
			vars: 'all',
			varsIgnorePattern: '^_',
		},
	],

	// Turned off conflicted rules
	'no-unused-vars': 'off',
	'@typescript-eslint/no-unused-vars': 'off',
};

export { unusedImportsRules };
