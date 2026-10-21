path: README.md
ignored: false
language: markdown/gfm
processor: none
plugins: @ @cravingmaker @eslint-community/eslint-comments @stylistic functional import-x markdown n package-json perfectionist promise regexp security sonarjs unicorn unused-imports
languageOptions:
  frontmatter: "yaml"
  math: true
linterOptions:
  reportUnusedDisableDirectives: 1
settings: null
rules: 21 (error 14, off 7, warn 0)

markdown/fenced-code-language: error [{"required":[]}]
markdown/fenced-code-meta: off ["always"]
markdown/heading-increment: error [{"frontmatterTitle":"^(?!\\s*['\"]title[:=]['\"])\\s*\\{?\\s*['\"]?title['\"]?\\s*[:=]"}]
markdown/no-bare-urls: off
markdown/no-duplicate-definitions: error [{"allowDefinitions":["//"],"allowFootnoteDefinitions":[],"checkFootnoteDefinitions":true}]
markdown/no-duplicate-headings: off [{"checkSiblingsOnly":false}]
markdown/no-empty-definitions: error [{"allowDefinitions":["//"],"allowFootnoteDefinitions":[],"checkFootnoteDefinitions":true}]
markdown/no-empty-images: error
markdown/no-empty-links: error
markdown/no-html: error [{"allowed":[],"allowedIgnoreCase":false}]
markdown/no-invalid-label-refs: off
markdown/no-missing-atx-heading-space: error [{"checkClosedHeadings":false}]
markdown/no-missing-label-refs: off [{"allowLabels":[]}]
markdown/no-missing-link-fragments: error [{"allowPattern":"","ignoreCase":true}]
markdown/no-multiple-h1: error [{"frontmatterTitle":"^(?!\\s*['\"]title[:=]['\"])\\s*\\{?\\s*['\"]?title['\"]?\\s*[:=]"}]
markdown/no-reference-like-urls: off
markdown/no-reversed-media-syntax: error
markdown/no-space-in-emphasis: off [{"checkStrikethrough":false}]
markdown/no-unused-definitions: error [{"allowDefinitions":["//"],"allowFootnoteDefinitions":[],"checkFootnoteDefinitions":true}]
markdown/require-alt-text: error
markdown/table-column-count: error [{"checkMissingCells":false}]
