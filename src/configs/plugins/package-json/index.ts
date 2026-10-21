import type { Linter } from "eslint";
import type { FeatureOptions } from "../../../types.js";

import pluginPackageJson from "eslint-plugin-package-json";
import * as jsoncParser from "jsonc-eslint-parser";

import { packageJsonFiles } from "../../../globs.js";
import { packageJsonRules } from "./rules.js";
import { internalPlugin } from "../../../rules/index.js";
import { narrowFiles } from "../../../utilities/file-scope.js";

const packageJson = ({
  files,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] => {
  return [
    {
      name: "@cravingmaker/eslint-config/package-json/setup",
      plugins: {
        "@cravingmaker": internalPlugin,
        "package-json": pluginPackageJson,
      },
    },
    {
      files: narrowFiles(packageJsonFiles, files),
      ignores: [...ignores],
      languageOptions: { parser: jsoncParser },
      name: "@cravingmaker/eslint-config/package-json/rules",
      rules: { ...packageJsonRules, ...overrides },
    },
  ];
};

export { packageJson };
