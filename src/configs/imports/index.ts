import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../types.js";

import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import pluginImportX, { createNodeResolver } from "eslint-plugin-import-x";

import { defaultContext } from "../../context.js";
import {
  sourceFiles,
  typescriptFiles,
  withSvelteComponents,
} from "../../globs.js";
import { importsRules } from "./rules.js";
import { narrowFiles } from "../../utilities/file-scope.js";

// Builds the flat config for eslint-plugin-import-x. TypeScript files and Svelte components
// within the feature's files resolve imports through the TypeScript resolver first, with the
// project's tsconfig.
function imports(
  options: FeatureOptions = {},
  { svelteComponents, tsconfigRootDir }: Context = defaultContext,
): Linter.Config[] {
  const { files, ignores = [], overrides = {} } = options;
  const resolverProject = tsconfigRootDir ? { project: tsconfigRootDir } : {};

  return [
    {
      name: "@cravingmaker/eslint-config/imports/setup",
      plugins: { "import-x": pluginImportX },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/imports/rules",
      rules: { ...importsRules, ...overrides },
    },
    {
      files: narrowFiles(
        withSvelteComponents(typescriptFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/imports/resolver",
      settings: {
        "import-x/resolver-next": [
          createTypeScriptImportResolver({
            alwaysTryTypes: true,
            ...resolverProject,
          }),
          createNodeResolver(),
        ],
      },
    },
  ];
}

export { imports };
