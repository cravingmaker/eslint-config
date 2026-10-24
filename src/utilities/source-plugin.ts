import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import { defaultContext } from "../context.js";
import { narrowFiles } from "./file-scope.js";
import { sourceFiles, withSvelteComponents } from "../globs.js";
import { withOverrides } from "./overrides.js";

type SourcePlugin = {
  readonly name: string;
  readonly plugins: NonNullable<Linter.Config["plugins"]>;
  readonly rules: Readonly<Rules>;
};

/**
 * Registers a source plugin globally, then scopes its authored rules and overrides to sources and the components parsed by Svelte. Specialized builders append their own blocks.
 */
const sourcePluginConfigs = (
  { name, plugins, rules }: SourcePlugin,
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] => {
  return [
    {
      name: `@cravingmaker/eslint-config/${name}/setup`,
      plugins,
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: `@cravingmaker/eslint-config/${name}/rules`,
      rules: withOverrides(rules, overrides),
    },
  ];
};

export { sourcePluginConfigs };
