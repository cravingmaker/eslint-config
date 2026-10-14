import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import pluginSecurity from "eslint-plugin-security";

import { defaultContext } from "../context.js";
import { sourceFiles, withSvelteComponents } from "../globs.js";
import { narrowFiles } from "../utilities/type-aware.js";

// Policy for eslint-plugin-security: its recommended config.
const securityRules: Rules = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The plugin does not provide types for its configs
  ...(pluginSecurity.configs.recommended.rules as Linter.RulesRecord),
} as const;

// Builds the flat config for eslint-plugin-security.
function security(
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/security/setup",
      plugins: { security: pluginSecurity },
    },
    {
      files: narrowFiles(
        withSvelteComponents(sourceFiles, svelteComponents),
        files,
      ),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/security/rules",
      rules: { ...securityRules, ...overrides },
    },
  ];
}

export { security, securityRules };
