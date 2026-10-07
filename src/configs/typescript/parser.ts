import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../types.js";

import { defaultContext } from "../../context.js";
import { typescriptFiles, withSvelteComponents } from "../../globs.js";
import { narrowTypeAwareScope } from "../../utilities/type-aware.js";

/**
Builds the blocks that parse TypeScript files with typescript-eslint and register its plugin,
also for Svelte components, whose parser the Svelte feature sets. With typed linting on, the
parser reads type information through the project service in the type-aware scope only, so a
file outside it, such as a script that no tsconfig includes, is parsed without it.
*/
async function typescriptParser(
  options: FeatureOptions = {},
  {
    globals,
    svelteComponents,
    tsconfigRootDir,
    typeAware,
  }: Context = defaultContext,
): Promise<Linter.Config[]> {
  const { files, ignores = [] } = options;
  const { parser, plugin } = await import("typescript-eslint");

  return [
    {
      files: [
        ...(files ?? withSvelteComponents(typescriptFiles, svelteComponents)),
      ],
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
