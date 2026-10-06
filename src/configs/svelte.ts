import type { Linter } from "eslint";
import type { Context, FeatureOptions } from "../types.js";

import { defaultContext } from "../context.js";
import { svelteFiles } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";
import { importPeer } from "../utilities/import-peer.js";

// Builds the flat config for Svelte components and rune modules. Script blocks are parsed with
// the typescript-eslint parser. A missing @html-eslint/eslint-plugin-svelte or
// svelte-eslint-parser fails with a message that names it.
async function svelte(
  { files = svelteFiles, ignores = [], overrides = {} }: FeatureOptions = {},
  { globals }: Context = defaultContext,
): Promise<Linter.Config[]> {
  const [plugin, parser] = await Promise.all([
    importPeer<{ readonly default: Readonly<Record<string, unknown>> }>(
      "@html-eslint/eslint-plugin-svelte",
      "svelte",
    ),
    importPeer<{ readonly default: Linter.Parser }>(
      "svelte-eslint-parser",
      "svelte",
    ),
  ]);
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
