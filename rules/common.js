const classMethodsUseThisOptions = {
	enforceForClassFields: true,
	exceptMethods: [],
	ignoreOverrideMethods: false,
};

const consistentReturnOptions = {
	treatUndefinedAsUnspecified: false,
};
const dotNotationOptions = { allowKeywords: true };

const maxParamsOptions = {
	max: 4,
};

const noEmptyFunctionOptions = { allow: [] };

const noUnusedExpressionsOptions = {
	allowShortCircuit: true,
	allowTaggedTemplates: true,
	allowTernary: true,
	enforceForJSX: true,
	ignoreDirectives: false,
};

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
};

const noUseBeforeDefineOptions = {
	allowNamedExports: false,
	classes: true,
	enums: true,
	functions: true,
	ignoreTypeReferences: true,
	typedefs: true,
	variables: true,
};

const preferDestructuring1stOptions = {
	AssignmentExpression: {
		array: false,
		object: false,
	},
	VariableDeclarator: {
		array: false,
		object: true,
	},
};

const preferDestructuring2ndOptions = { enforceForRenamedProperties: false };

const preferPromiseRejectErrorsOptions = {
	allowEmptyReject: false,
};

export {
	classMethodsUseThisOptions,
	consistentReturnOptions,
	dotNotationOptions,
	maxParamsOptions,
	noEmptyFunctionOptions,
	noUnusedExpressionsOptions,
	noUnusedVarsOptions,
	noUseBeforeDefineOptions,
	preferDestructuring1stOptions,
	preferDestructuring2ndOptions,
	preferPromiseRejectErrorsOptions,
};
