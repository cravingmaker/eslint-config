import type { Linter } from "eslint";
import type { Context, ImportsOptions, Rules } from "../../../types.js";

import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import pluginImportX, { createNodeResolver } from "eslint-plugin-import-x";

import { defaultContext } from "../../../context.js";
import { typescriptFiles, withSvelteComponents } from "../../../globs.js";
import { importsRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";
import { sourcePluginConfigs } from "../../../utilities/source-plugin.js";

// `import-x/extensions` when a relative import of a TypeScript file names its source extension.
const sourceExtensionRules: Rules = {
  "import-x/extensions": [
    "error",
    "ignorePackages",
    {
      js: "always",
      jsx: "always",
      mjs: "always",
      mts: "always",
      ts: "always",
      tsx: "always",
    },
  ],
};

/**
 * Builds the flat config for eslint-plugin-import-x. TypeScript files and Svelte components within the feature's files resolve imports through the TypeScript resolver first, with the project's tsconfig. With `typescriptExtensions: "source"`, a relative import of a TypeScript file names its source extension, such as `./value.ts`.
 */
const imports = (
  options: ImportsOptions = {},
  context: Context = defaultContext,
): Linter.Config[] => {
  const { files, ignores = [], typescriptExtensions = "output" } = options;
  const { svelteComponents, tsconfigRootDir } = context;

  return [
    ...sourcePluginConfigs(
      {
        name: "imports",
        plugins: { "import-x": pluginImportX },
        rules:
          typescriptExtensions === "source"
            ? { ...importsRules, ...sourceExtensionRules }
            : importsRules,
      },
      options,
      context,
    ),
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
            project: tsconfigRootDir,
          }),
          createNodeResolver(),
        ],
      },
    },
  ];
};

export { imports };
