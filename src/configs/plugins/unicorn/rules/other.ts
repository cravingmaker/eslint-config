import type { Rules } from "../../../../types.js";

const otherRules: Rules = {
  // --- Rules with default options (22/36) ---------------------------------------------------------------------------------------------------------.
  "unicorn/consistent-function-style": [
    "error",
    {
      defaultExport: undefined,

      callbacks: "ignore",
      default: "ignore",
      namedExports: "ignore",
      namedFunctions: "ignore",
      objectProperties: "ignore",
      reassignedVariables: "ignore",
      typedVariables: "ignore",
    },
  ], // Manually fixable by editor suggestions.
  "unicorn/custom-error-definition": "error", // Automatically fixable by the --fix command.
  "unicorn/id-match": [
    "error",
    "^.+$",
    {
      checkNamedSpecifiers: true,
      classFields: false,
      ignoreDestructuring: false,
      onlyDeclarations: false,
      properties: false,
    },
  ],
  "unicorn/iteration-fallback-style": ["error", "guard"], // Automatically fixable by the --fix command.
  "unicorn/no-array-front-mutation": "error",
  "unicorn/no-asterisk-prefix-in-documentation-comments": "error", // Automatically fixable by the --fix command.
  "unicorn/no-barrel-files": "error",
  "unicorn/no-invalid-file-input-accept": "error", // Automatically fixable by the --fix command.
  "unicorn/no-manually-wrapped-comments": "error", // Automatically fixable by the --fix command.
  "unicorn/no-missing-local-resource": "error", // Automatically fixable by the --fix command.
  "unicorn/no-unreadable-new-expression": "error",
  "unicorn/no-unsafe-dom-html": "error",
  "unicorn/prefer-dispose": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-error-is-error": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-import-meta-properties": "error", // Automatically fixable by the --fix command.
  "unicorn/prefer-iterator-concat": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-json-import": "error", // Manually fixable by editor suggestions.
  "unicorn/prefer-regexp-escape": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-short-arrow-method": ["error", "always"], // Automatically fixable by the --fix command.
  "unicorn/prefer-temporal": [
    "error",
    { checkDateNow: false, checkMethods: false, checkReferences: false },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/prefer-uint8array-base64": "error", // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/string-content": [
    "error",
    {
      selectors: [],

      patterns: {
        /* eslint-disable unicorn/string-content -- Disable to allow defining the search patterns themselves. */
        "\\.\\.\\.": "…", // Ellipsis: prefer the real Unicode character.
        "<-": "←", // Left arrow: prefer Unicode.
        "->": "→", // Right arrow: prefer Unicode.
        /* eslint-enable unicorn/string-content -- Disable to allow defining the search patterns themselves. */
      },
    },
  ], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.

  // --- Turned off rules (14/36) -------------------------------------------------------------------------------------------------------------------.
  "unicorn/comma-spacing": "off", // JSON-only formatting; preserve language ownership and Prettier formatting. Automatically fixable by the --fix command.
  "unicorn/comment-content": "off", // Avoid enforcing terminology and brand-name wording in comments. Automatically fixable by the --fix command.
  "unicorn/consistent-arrow-return-style": "off", // Handled by `arrow-body-style`. Automatically fixable by the --fix command.
  "unicorn/consistent-destructuring": "off", // Prefer freedom with variable accessing patterns. Manually fixable by editor suggestions.
  "unicorn/indent": "off", // JSON/CSS-only formatting; preserve language ownership and Prettier formatting. Automatically fixable by the --fix command.
  "unicorn/key-name-casing": "off", // Data-language policy is outside this feature's source scope.
  "unicorn/no-javascript-url": "off", // Markdown-only rule; preserve the existing Markdown policy.
  "unicorn/no-keyword-prefix": "off", // Prefer freedom with keywords / names.
  "unicorn/no-loss-of-precision": "off", // Its supported languages exclude JavaScript; preserve existing language owners.
  "unicorn/no-unused-properties": "off", // Prefer freedom with properties.
  "unicorn/prefer-uint8array-hex": "off", // Native `toHex`/`fromHex` are unavailable in the checked supported Node 24.22 runtime. Automatically fixable by the --fix command. Manually fixable by editor suggestions.
  "unicorn/require-frontmatter-fields": "off", // Markdown-only rule; this feature lints JavaScript.
  "unicorn/require-post-message-target-origin": "off", // It can't distinguish between window.postMessage() and other calls like Worker#postMessage(), MessagePort#postMessage(), Client#postMessage(), and BroadcastChannel#postMessage(). Manually fixable by editor suggestions.
  "unicorn/try-complexity": "off", // Handled by `complexity` and `max-depth`.
} as const;

export { otherRules }; // 36 rules, 19 automatically fixable, 11 editor suggestions fixable.
