import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../types.js";

import { defaultContext } from "../context.js";
import { svelteFiles } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";
import { importOptionalPeer } from "../utilities/import-peer.js";

// Builds the flat config for Svelte components and rune modules, or none when
// @html-eslint/eslint-plugin-svelte or svelte-eslint-parser is not installed. Script blocks are
// parsed with the typescript-eslint parser.
async function svelte(
  { files = svelteFiles, ignores = [], overrides = {} }: FeatureOptions = {},
  { globals }: Context = defaultContext,
): Promise<Linter.Config[]> {
  const [plugin, parser] = await Promise.all([
    importOptionalPeer<{ readonly default: Readonly<Record<string, unknown>> }>(
      "@html-eslint/eslint-plugin-svelte",
    ),
    importOptionalPeer<{ readonly default: Linter.Parser }>(
      "svelte-eslint-parser",
    ),
  ]);
  if (plugin === undefined || parser === undefined) return [];

  const { parser: typescriptParser } = await import("typescript-eslint");

  return [
    {
      files: [...files],
      ignores: [...ignores],
      languageOptions: {
        globals: { ...globals },
        parser: parser.default,
        parserOptions: { parser: typescriptParser },
      },
      name: "@cravingmaker/eslint-config/svelte/rules",
      plugins: { "@html-eslint/svelte": plugin.default },
      rules: {
        ...enableAllRules("@html-eslint/svelte", plugin.default.rules ?? {}),
        ...overrides,
      },
    },
  ];
}

export { svelte };
