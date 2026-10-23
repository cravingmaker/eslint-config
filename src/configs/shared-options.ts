import type { RuleOptionOf, RuleOptionsOf } from "../types.js";

const classMethodsUseThisOptions = {
  enforceForClassFields: true,
  exceptMethods: [],
  ignoreOverrideMethods: false,
} satisfies RuleOptionOf<"@typescript-eslint/class-methods-use-this"> &
  RuleOptionOf<"class-methods-use-this">;

const dotNotationOptions = {
  allowKeywords: true,
} satisfies RuleOptionOf<"@typescript-eslint/dot-notation"> &
  RuleOptionOf<"dot-notation">;

// eslint-disable-next-line unicorn/name-replacements -- This mirrors the ESLint `max-params` rule name.
const maxParamsOptions = {
  max: 4,
} as const satisfies RuleOptionOf<"@typescript-eslint/max-params"> &
  RuleOptionOf<"max-params">;

const namingConventionOptions = [
  {
    format: ["camelCase", "PascalCase"],
    selector: "import",
  },
  {
    format: ["camelCase", "UPPER_CASE"],
    leadingUnderscore: "allow",
    selector: "variable",
    trailingUnderscore: "allow",
  },
  {
    format: ["camelCase"],
    leadingUnderscore: "allow",
    selector: "default",
    trailingUnderscore: "allow",
  },
  {
    format: ["PascalCase"],
    selector: "typeLike",
  },
] satisfies RuleOptionsOf<"@typescript-eslint/naming-convention">;

const noEmptyFunctionOptions = {
  allow: [],
} satisfies RuleOptionOf<"@typescript-eslint/no-empty-function"> &
  RuleOptionOf<"no-empty-function">;

const noShadowOptions = {
  allow: [],
  builtinGlobals: false,
  hoist: "functions",
  ignoreFunctionTypeParameterNameValueShadow: true,
  ignoreOnInitialization: false,
  ignoreTypeValueShadow: true,
} satisfies RuleOptionOf<"@typescript-eslint/no-shadow"> &
  RuleOptionOf<"no-shadow">;

const noUnusedExpressionsOptions = {
  allowShortCircuit: false,
  allowTaggedTemplates: false,
  allowTernary: false,
  enforceForJSX: true,
  ignoreDirectives: false,
} as const satisfies RuleOptionOf<"@typescript-eslint/no-unused-expressions"> &
  RuleOptionOf<"no-unused-expressions">;

const noUseBeforeDefineOptions = {
  allowNamedExports: false,
  classes: true,
  enums: true,
  functions: true,
  ignoreTypeReferences: true,
  typedefs: true,
  variables: true,
} as const satisfies RuleOptionOf<"@typescript-eslint/no-use-before-define"> &
  RuleOptionOf<"no-use-before-define">;

const preferDestructuring1stOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- ESLint rule options use PascalCase for AST node names.
  AssignmentExpression: {
    array: false,
    object: false,
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- ESLint rule options use PascalCase for AST node names.
  VariableDeclarator: {
    array: false,
    object: true,
  },
} as const satisfies RuleOptionsOf<"@typescript-eslint/prefer-destructuring">[0] &
  RuleOptionsOf<"prefer-destructuring">[0];

const preferDestructuring2ndOptions = {
  enforceForRenamedProperties: false,
} as const satisfies RuleOptionsOf<"@typescript-eslint/prefer-destructuring">[1] &
  RuleOptionsOf<"prefer-destructuring">[1];

const preferPromiseRejectErrorsOptions = {
  allowEmptyReject: false,
} as const satisfies RuleOptionOf<"@typescript-eslint/prefer-promise-reject-errors"> &
  RuleOptionOf<"prefer-promise-reject-errors">;

export {
  classMethodsUseThisOptions,
  dotNotationOptions,
  maxParamsOptions,
  namingConventionOptions,
  noEmptyFunctionOptions,
  noShadowOptions,
  noUnusedExpressionsOptions,
  noUseBeforeDefineOptions,
  preferDestructuring1stOptions,
  preferDestructuring2ndOptions,
  preferPromiseRejectErrorsOptions,
};
