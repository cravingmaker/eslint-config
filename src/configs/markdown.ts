import type { Linter } from "eslint";
import type { FeatureOptions, Rules } from "../types.js";

import pluginMarkdown from "@eslint/markdown";

import { markdownFiles } from "../globs.js";
import { enableAllRules } from "../utilities/all-rules.js";
import { narrowFiles } from "../utilities/type-aware.js";

// Policy for @eslint/markdown.
const markdownRules: Rules = {
  ...enableAllRules("markdown", pluginMarkdown.rules),

  "markdown/fenced-code-meta": "off",
  "markdown/no-duplicate-headings": "off",
} as const;

// Builds the flat config for Markdown files, with GitHub Flavored Markdown, YAML front matter,
// and math.
function markdown({
  files,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] {
  return [
    {
      name: "@cravingmaker/eslint-config/markdown/setup",
      plugins: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- @eslint/markdown Plugin type is not assignable to Linter.Plugin without assertion
        markdown: pluginMarkdown as unknown as NonNullable<
          Linter.Config["plugins"]
        >[string],
      },
    },
    {
      files: narrowFiles(markdownFiles, files),
      ignores: [...ignores],
      language: "markdown/gfm",
      languageOptions: {
        frontmatter: "yaml",
        math: true,
      },
      name: "@cravingmaker/eslint-config/markdown/rules",
      rules: { ...markdownRules, ...overrides },
    },
  ];
}

export { markdown };
