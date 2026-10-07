import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../types.js";

import { defaultContext } from "../../context.js";
import { typescriptFiles } from "../../globs.js";
import { narrowTypeAwareScope } from "../../utilities/type-aware.js";

/**
Builds the blocks that parse TypeScript files with typescript-eslint and register its plugin.
With typed linting on, the parser reads type information through the project service in the
type-aware scope only, so a file outside it, such as a script that no tsconfig includes, is
parsed without it.
*/
async function typescriptParser(
  options: FeatureOptions = {},
  { globals, tsconfigRootDir, typeAware }: Context = defaultContext,
): Promise<Linter.Config[]> {
  const { files = typescriptFiles, ignores = [] } = options;
  const { parser, plugin } = await import("typescript-eslint");

  return [
    {
      files: [...files],
      ignores: [...ignores],
      languageOptions: { globals: { ...globals }, parser, parserOptions: {} },
      name: "@cravingmaker/eslint-config/typescript/parser",
      plugins: { "@typescript-eslint": plugin },
    },
    ...(typeAware === undefined
      ? []
      : [
          {
            ...narrowTypeAwareScope(typeAware, options),
            languageOptions: {
              parserOptions: { projectService: true, tsconfigRootDir },
            },
            name: "@cravingmaker/eslint-config/typescript/parser-type-aware",
          },
        ]),
  ];
}

export { typescriptParser };
