import type { Linter } from "eslint";
import type { FeatureOptions } from "../../../types.js";

import pluginMarkdown from "@eslint/markdown";

import { markdownFiles } from "../../../globs.js";
import { markdownRules } from "./rules.js";
import { narrowFiles } from "../../../utilities/file-scope.js";

// Builds the flat config for Markdown files, with GitHub Flavored Markdown, YAML front matter,
// and math.
const markdown = ({
  files,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Linter.Config[] => {
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
};

export { markdown };
