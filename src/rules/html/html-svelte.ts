import type { Rules } from "../../types.js";

import eslintPluginHtmlSvelte from "@html-eslint/eslint-plugin-svelte";

import { getPluginRules } from "../../utilities/plugin-rules.js";

const htmlSvelteEslintRules: Rules = {
  ...getPluginRules("@html-eslint/svelte", eslintPluginHtmlSvelte.rules ?? {}),
} as const;

export { htmlSvelteEslintRules };
