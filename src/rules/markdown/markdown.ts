import type { Rules } from "../../types.js";

import pluginMarkdown from "@eslint/markdown";

import { getPluginRules } from "../../utilities/plugin-rules.js";

const markdownEslintRules: Rules = {
  ...getPluginRules("markdown", pluginMarkdown.rules),

  "markdown/fenced-code-meta": "off",
  "markdown/no-duplicate-headings": "off",
} as const;

export { markdownEslintRules };
