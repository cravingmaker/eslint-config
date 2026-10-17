import type { Linter } from "eslint";
import type { FeatureOptions, Rules } from "../types.js";

import pluginMarkdown from "@eslint/markdown";

import { markdownFiles } from "../globs.js";
import { narrowFiles } from "../utilities/file-scope.js";

// Policy for @eslint/markdown.
const markdownRules: Rules = {
  "markdown/fenced-code-language": ["error", { required: [] }],
  "markdown/heading-increment": [
    "error",
    {
      frontmatterTitle: String.raw`^(?!\s*['"]title[:=]['"])\s*\{?\s*['"]?title['"]?\s*[:=]`,
    },
  ],
  "markdown/no-bare-urls": "error",
  "markdown/no-duplicate-definitions": [
    "error",
    {
      allowDefinitions: ["//"],
      allowFootnoteDefinitions: [],
      checkFootnoteDefinitions: true,
    },
  ],
  "markdown/no-empty-definitions": [
    "error",
    {
      allowDefinitions: ["//"],
      allowFootnoteDefinitions: [],
      checkFootnoteDefinitions: true,
    },
  ],
  "markdown/no-empty-images": "error",
  "markdown/no-empty-links": "error",
  "markdown/no-html": ["error", { allowed: [], allowedIgnoreCase: false }],
  "markdown/no-invalid-label-refs": "error",
  "markdown/no-missing-atx-heading-space": [
    "error",
    { checkClosedHeadings: false },
  ],
  "markdown/no-missing-label-refs": ["error", { allowLabels: [] }],
  "markdown/no-missing-link-fragments": [
    "error",
    { allowPattern: "", ignoreCase: true },
  ],
  "markdown/no-multiple-h1": [
    "error",
    {
      frontmatterTitle: String.raw`^(?!\s*['"]title[:=]['"])\s*\{?\s*['"]?title['"]?\s*[:=]`,
    },
  ],
  "markdown/no-reference-like-urls": "error",
  "markdown/no-reversed-media-syntax": "error",
  "markdown/no-space-in-emphasis": ["error", { checkStrikethrough: false }],
  "markdown/no-unused-definitions": [
    "error",
    {
      allowDefinitions: ["//"],
      allowFootnoteDefinitions: [],
      checkFootnoteDefinitions: true,
    },
  ],
  "markdown/require-alt-text": "error",
  "markdown/table-column-count": ["error", { checkMissingCells: false }],

  "markdown/fenced-code-meta": "off",
  "markdown/no-duplicate-headings": "off",
} as const;

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
