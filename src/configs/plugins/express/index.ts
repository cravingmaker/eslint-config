import type { Linter } from "eslint";
import type { FeatureOptions } from "../../../types.js";

import { expressFiles } from "../../../globs.js";
import { expressRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";
import { importPeer } from "../../../utilities/import-peer.js";
import { supportedPluginPolicy } from "../../../utilities/plugin-policy.js";

/**
 * Builds the flat config for Express apps. A missing eslint-plugin-express-security fails with a message that names it.
 */
const express = async ({
  files,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Promise<Linter.Config[]> => {
  const plugin = await importPeer<{
    readonly default: NonNullable<Linter.Config["plugins"]>[string];
  }>("eslint-plugin-express-security", "express");

  return [
    {
      files: narrowFiles(expressFiles, files),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/express/rules",
      plugins: { "express-security": plugin.default },
      rules: {
        ...supportedPluginPolicy(
          "express-security",
          expressRules,
          plugin.default.rules,
        ),
        ...overrides,
      },
    },
  ];
};

export { express };
