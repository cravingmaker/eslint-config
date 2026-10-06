import type { Linter } from "eslint";
import type { FeatureOptions, Rules } from "../types.js";

import { expressFiles } from "../globs.js";
import { importOptionalPeer } from "../utilities/import-peer.js";

// Policy for eslint-plugin-express-security, an optional peer.
const expressRules: Rules = {
  "express-security/no-cors-credentials-wildcard": "error",
  "express-security/no-express-unsafe-regex-route": "error",
  "express-security/no-graphql-introspection-production": "error",
  "express-security/no-insecure-cookie-options": "error",
  "express-security/no-permissive-cors": "error",
  "express-security/require-csrf-protection": "error",
  "express-security/require-express-body-parser-limits": "error",
  "express-security/require-helmet": "error",
  "express-security/require-rate-limiting": "error",

  "express-security/no-exposed-debug-endpoints": "off", // Project specific
} as const;

// Builds the flat config for Express apps, or none when eslint-plugin-express-security is not
// installed.
async function express({
  files = expressFiles,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Promise<Linter.Config[]> {
  const plugin = await importOptionalPeer<{
    readonly default: NonNullable<Linter.Config["plugins"]>[string];
  }>("eslint-plugin-express-security");
  if (plugin === undefined) return [];

  return [
    {
      files: [...files],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/express/rules",
      plugins: { "express-security": plugin.default },
      rules: { ...expressRules, ...overrides },
    },
  ];
}

export { express };
