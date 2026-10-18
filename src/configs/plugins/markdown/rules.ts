import type { Rules } from "../../../types.js";

const recommendedRules: Rules = {
  // --- Rules with default options (17/17) ---------------------------------------------------------------------------------------------------------.
  "markdown/fenced-code-language": ["error", { required: [] }],
  "markdown/heading-increment": [
    "error",
    {
      frontmatterTitle: String.raw`^(?!\s*['"]title[:=]['"])\s*\{?\s*['"]?title['"]?\s*[:=]`,
    },
  ],
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
  "markdown/no-invalid-label-refs": "error",
  "markdown/no-missing-atx-heading-space": [
    "error",
    { checkClosedHeadings: false },
  ], // Automatically fixable by the --fix command.
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
  "markdown/no-reference-like-urls": "error", // Automatically fixable by the --fix command.
  "markdown/no-reversed-media-syntax": "error", // Automatically fixable by the --fix command.
  "markdown/no-space-in-emphasis": ["error", { checkStrikethrough: false }], // Automatically fixable by the --fix command.
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
} as const;

const otherRules: Rules = {
  // --- Rules with default options (2/4) -----------------------------------------------------------------------------------------------------------.
  "markdown/no-bare-urls": "error", // Automatically fixable by the --fix command.
  "markdown/no-html": ["error", { allowed: [], allowedIgnoreCase: false }],

  // --- Turned off rules (2/4) ---------------------------------------------------------------------------------------------------------------------.
  "markdown/fenced-code-meta": "off", // Code-fence metadata is optional and depends on the Markdown renderer.
  "markdown/no-duplicate-headings": "off", // Repeated headings are useful in separate sections of a document.
} as const;

const markdownRules: Rules = {
  ...recommendedRules, // 17/21 rules, 4 automatically fixable, 0 editor suggestions fixable.
  ...otherRules, // 4/21 rules, 1 automatically fixable, 0 editor suggestions fixable.
} as const;

export { markdownRules };
