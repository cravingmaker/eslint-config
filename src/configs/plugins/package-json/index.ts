import type { Linter } from "eslint";
import type { FeatureOptions } from "../../../types.js";

import pluginEnforcePackageType from "eslint-enforce-package-type";
import pluginPackageJson from "eslint-plugin-package-json";
import * as jsoncParser from "jsonc-eslint-parser";

import { packageJsonFiles } from "../../../globs.js";
import { packageJsonRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";

// Builds the flat config for package.json files.
const packageJson = ({
  files,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] => {
  return [
    {
      name: "@cravingmaker/eslint-config/package-json/setup",
      plugins: { "package-json": pluginPackageJson },
    },
    {
      files: narrowFiles(packageJsonFiles, files),
      ignores: [...ignores],
      languageOptions: { parser: jsoncParser },
      name: "@cravingmaker/eslint-config/package-json/rules",
      plugins: { "enforce-package-type": pluginEnforcePackageType },
      rules: { ...packageJsonRules, ...overrides },
    },
  ];
};

export { packageJson };
