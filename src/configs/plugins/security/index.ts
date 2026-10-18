import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../../../types.js";

import pluginSecurity from "eslint-plugin-security";

import { defaultContext } from "../../../context.js";
import { sourceFiles, withSvelteComponents } from "../../../globs.js";
import { securityRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";

// Builds the flat config for eslint-plugin-security.
const security = (
  { files, ignores = [], overrides = {} }: FeatureOptions = {},
  { svelteComponents }: Context = defaultContext,
): Linter.Config[] => {
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
};

export { security };
