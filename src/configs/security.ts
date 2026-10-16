import type { Linter } from "eslint";
import type { Context, FeatureOptions, Rules } from "../types.js";

import pluginSecurity from "eslint-plugin-security";

import { defaultContext } from "../context.js";
import { sourceFiles, withSvelteComponents } from "../globs.js";
import { narrowFiles } from "../utilities/file-scope.js";

// Policy for eslint-plugin-security. Keep the reviewed warning severities explicit.
const securityRules: Rules = {
  "security/detect-bidi-characters": "warn",
  "security/detect-buffer-noassert": "warn",
  "security/detect-child-process": "warn",
  "security/detect-disable-mustache-escape": "warn",
  "security/detect-eval-with-expression": "warn",
  "security/detect-new-buffer": "warn",
  "security/detect-no-csrf-before-method-override": "warn",
  "security/detect-non-literal-fs-filename": "warn",
  "security/detect-non-literal-regexp": "warn",
  "security/detect-non-literal-require": "warn",
  "security/detect-object-injection": "warn",
  "security/detect-possible-timing-attacks": "warn",
  "security/detect-pseudoRandomBytes": "warn",
  "security/detect-unsafe-regex": "warn",
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
