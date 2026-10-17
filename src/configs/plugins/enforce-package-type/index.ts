import type { Linter } from "eslint";
import type { FeatureOptions } from "../../../types.js";

import pluginEnforcePackageType from "eslint-enforce-package-type";
import * as jsoncParser from "jsonc-eslint-parser";

import { packageJsonFiles } from "../../../globs.js";
import { enforcePackageTypeRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";

const enforcePackageType = ({
  files,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] => {
  return [
    {
      files: narrowFiles(packageJsonFiles, files),
      ignores: [...ignores],
      languageOptions: { parser: jsoncParser },
      name: "@cravingmaker/eslint-config/enforce-package-type/rules",
      plugins: { "enforce-package-type": pluginEnforcePackageType },
      rules: { ...enforcePackageTypeRules, ...overrides },
    },
  ];
};

export { enforcePackageType };
