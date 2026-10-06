import type { Linter } from "eslint";
import type { FeatureOptions, Rules } from "../types.js";

import pluginSecurity from "eslint-plugin-security";

import { sourceFiles } from "../globs.js";

// Policy for eslint-plugin-security: its recommended config.
const securityRules: Rules = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The plugin does not provide types for its configs
  ...(pluginSecurity.configs.recommended.rules as Linter.RulesRecord),
} as const;

// Builds the flat config for eslint-plugin-security.
function security({
  files = sourceFiles,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/security/setup",
      plugins: { security: pluginSecurity },
    },
    {
      files: [...files],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/security/rules",
      rules: { ...securityRules, ...overrides },
    },
  ];
}

export { security, securityRules };
