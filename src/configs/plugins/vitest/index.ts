import type { Linter } from "eslint";
import type { FeatureOptions } from "../../../types.js";

import { vitestFiles } from "../../../globs.js";
import { vitestRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";
import { importPeer } from "../../../utilities/import-peer.js";
import { withOverrides } from "../../../utilities/overrides.js";
import { supportedPluginPolicy } from "../../../utilities/plugin-policy.js";

/**
 * Builds the flat config for Vitest test files. A missing @vitest/eslint-plugin fails with a message that names it.
 */
const vitest = async ({
  files,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Promise<Linter.Config[]> => {
  const plugin = await importPeer<{
    readonly default: NonNullable<Linter.Config["plugins"]>[string];
  }>("@vitest/eslint-plugin", "vitest");

  return [
    {
      files: narrowFiles(vitestFiles, files),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/vitest/rules",
      plugins: { vitest: plugin.default },
      rules: withOverrides(
        supportedPluginPolicy("vitest", vitestRules, plugin.default.rules),
        overrides,
      ),
    },
  ];
};

export { vitest };
