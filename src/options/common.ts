const classMethodsUseThisOptions = {
	enforceForClassFields: true,
	exceptMethods: [],
	ignoreOverrideMethods: false,
} as const;

const consistentReturnOptions = { treatUndefinedAsUnspecified: false } as const;

const dotNotationOptions = { allowKeywords: true } as const;

// eslint-disable-next-line unicorn/prevent-abbreviations -- This mirrors the ESLint `max-params` rule name
const maxParamsOptions = { max: 4 } as const;

const namingConventionOptions = [
	{
		format: ['camelCase', 'PascalCase'],
		selector: 'import',
	},
	{
		format: ['camelCase', 'UPPER_CASE'],
		leadingUnderscore: 'allow',
		selector: 'variable',
		trailingUnderscore: 'allow',
	},
	{
		format: ['camelCase'],
		leadingUnderscore: 'allow',
		selector: 'default',
		trailingUnderscore: 'allow',
	},
	{
		format: ['PascalCase'],
		selector: 'typeLike',
	},
] as const;

const noEmptyFunctionOptions = { allow: [] } as const;

const noShadowOptions = {
	allow: [],
	builtinGlobals: false,
	hoist: 'functions',
	ignoreFunctionTypeParameterNameValueShadow: true,
	ignoreOnInitialization: false,
	ignoreTypeValueShadow: true,
} as const;

const noUnusedExpressionsOptions = {
	allowShortCircuit: true,
	allowTaggedTemplates: true,
	allowTernary: true,
	enforceForJSX: true,
	ignoreDirectives: false,
} as const;

// eslint-disable-next-line unicorn/prevent-abbreviations -- This mirrors the ESLint `no-unused-vars` rule name
const noUnusedVarsOptions = {
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
} as const;

const noUseBeforeDefineOptions = {
	allowNamedExports: false,
	classes: true,
	enums: true,
	functions: true,
	ignoreTypeReferences: true,
	typedefs: true,
	variables: true,
} as const;

const preferDestructuring1stOptions = {
	// eslint-disable-next-line @typescript-eslint/naming-convention -- ESLint rule options use PascalCase for AST node names
	AssignmentExpression: {
		array: false,
		object: false,
	},
	// eslint-disable-next-line @typescript-eslint/naming-convention -- ESLint rule options use PascalCase for AST node names
	VariableDeclarator: {
		array: false,
		object: true,
	},
} as const;

const preferDestructuring2ndOptions = { enforceForRenamedProperties: false } as const;

const preferPromiseRejectErrorsOptions = { allowEmptyReject: false } as const;

export {
	classMethodsUseThisOptions,
	consistentReturnOptions,
	dotNotationOptions,
	maxParamsOptions,
	namingConventionOptions,
	noEmptyFunctionOptions,
	noShadowOptions,
	noUnusedExpressionsOptions,
	noUnusedVarsOptions,
	noUseBeforeDefineOptions,
	preferDestructuring1stOptions,
	preferDestructuring2ndOptions,
	preferPromiseRejectErrorsOptions,
};
