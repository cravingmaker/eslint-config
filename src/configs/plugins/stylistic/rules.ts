import type { Rules } from "../../../types.js";

import { transparentWrappers } from "../../../rules/function-values.js";

// A direct initializer may pass through any number of transparent TypeScript wrappers.
// Exclude functions nested inside calls, objects, or other value-producing expressions.
const functionExpression =
  ":matches(ArrowFunctionExpression, FunctionExpression)";
const transparentWrapper = `:matches(${[...transparentWrappers].join(", ")})`;
const functionVariable = `VariableDeclaration:has(> VariableDeclarator[id.type="Identifier"]:has(> ${functionExpression}.init, > ${transparentWrapper}.init:has(${functionExpression}:not(${transparentWrapper} :not(${transparentWrapper}) ${functionExpression}))))`;

// Rule list: https://eslint.style/rules.
// Stable token spacing and structural checks stay on even when eslint-config-prettier disables them.
const recommendedRules: Rules = {
  // --- Rules with default options (25/65) ---------------------------------------------------------------------------------------------------------.
  "@stylistic/array-bracket-spacing": [
    "error",
    "never",
    {
      arraysInArrays: false,
      objectsInArrays: false,
      singleValue: false,
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/arrow-spacing": [
    "error",
    {
      after: true,
      before: true,
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/block-spacing": ["error", "always"], // Automatically fixable by the --fix command.
  "@stylistic/comma-spacing": [
    "error",
    {
      after: true,
      before: false,
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/comma-style": [
    "error",
    "last",
    {
      exceptions: {},
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/computed-property-spacing": [
    "error",
    "never",
    {
      enforceForClassMembers: true,
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/eol-last": ["error", "always"], // Automatically fixable by the --fix command.
  "@stylistic/jsx-equals-spacing": ["error", "never"], // Automatically fixable by the --fix command.
  "@stylistic/key-spacing": [
    "error",
    {
      afterColon: true,
      align: undefined,
      beforeColon: false,
      ignoredNodes: [],
      mode: "strict",
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/keyword-spacing": [
    "error",
    {
      after: true,
      before: true,
      overrides: {},
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/lines-between-class-members": [
    "error",
    "always",
    {
      exceptAfterOverload: true,
      exceptAfterSingleLine: false,
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/max-statements-per-line": [
    "error",
    {
      ignoredNodes: [],
      max: 1,
    },
  ],
  "@stylistic/no-floating-decimal": "error", // Automatically fixable by the --fix command.
  "@stylistic/no-whitespace-before-property": "error", // Automatically fixable by the --fix command.
  "@stylistic/rest-spread-spacing": ["error", "never"], // Automatically fixable by the --fix command.
  "@stylistic/semi-spacing": [
    "error",
    {
      after: true,
      before: false,
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/space-before-blocks": ["error", "always"], // Automatically fixable by the --fix command.
  "@stylistic/space-in-parens": [
    "error",
    "never",
    {
      exceptions: [],
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/space-infix-ops": [
    "error",
    {
      ignoreTypes: false,
      int32Hint: false,
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/space-unary-ops": [
    "error",
    {
      nonwords: false,
      overrides: {},
      words: true,
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/template-curly-spacing": ["error", "never"], // Automatically fixable by the --fix command.
  "@stylistic/template-tag-spacing": ["error", "never"], // Automatically fixable by the --fix command.
  "@stylistic/type-generic-spacing": "error", // Automatically fixable by the --fix command.
  "@stylistic/type-named-tuple-spacing": "error", // Automatically fixable by the --fix command.
  "@stylistic/yield-star-spacing": ["error", "after"], // Automatically fixable by the --fix command.

  // --- Rules with overridden options (12/65) ------------------------------------------------------------------------------------------------------.
  "@stylistic/dot-location": ["error", "property"], // Automatically fixable by the --fix command.
  "@stylistic/generator-star-spacing": [
    "error",
    {
      after: true,
      anonymous: "after",
      before: false,
      method: "before",
      named: "after",
      shorthand: "before",
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/jsx-curly-brace-presence": [
    "error",
    {
      children: "never",
      propElementValues: "always",
      props: "never",
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/jsx-curly-spacing": [
    "error",
    {
      allowMultiline: true,
      attributes: true,
      children: true,
      spacing: {
        objectLiterals: "never",
      },
      when: "never",
    },
    {
      allowMultiline: true,
      spacing: {
        objectLiterals: "never",
      },
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/jsx-tag-spacing": [
    "error",
    {
      afterOpening: "never",
      beforeClosing: "never",
      beforeSelfClosing: "always",
      closingSlash: "never",
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/no-mixed-operators": [
    "error",
    {
      allowSamePrecedence: true,
      groups: [
        ["&", "|", "^", "<<", ">>", ">>>"],
        ["&&", "||"],
      ],
    },
  ],
  "@stylistic/no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
  "@stylistic/no-multi-spaces": [
    "error",
    {
      exceptions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Stylistic uses AST node names for exceptions.
        ImportAttribute: true,
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Stylistic uses AST node names for exceptions.
        Property: true,
      },
      ignoreEOLComments: true,
      includeTabs: true,
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/no-trailing-spaces": [
    "error",
    {
      ignoreComments: true,
      skipBlankLines: false,
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/space-before-function-paren": [
    "error",
    {
      anonymous: "always",
      asyncArrow: "always",
      catch: "always",
      named: "never",
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/spaced-comment": [
    "error",
    "always",
    {
      block: {
        balanced: true,
        exceptions: ["-", "="],
        markers: [
          "!",
          "#__PURE__",
          "@__PURE__",
          "#__NO_SIDE_EFFECTS__",
          "@__NO_SIDE_EFFECTS__",
        ],
      },
      exceptions: [],
      line: {
        exceptions: ["-", "="],
        markers: ["/"],
      },
      markers: [],
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/type-annotation-spacing": [
    "error",
    {
      after: true,
      before: false,
      overrides: { arrow: "ignore" }, // Handled by `@stylistic/arrow-spacing`; the arrow spacing options here are deprecated.
    },
  ], // Automatically fixable by the --fix command.

  // --- Turned off rules (28/65) -------------------------------------------------------------------------------------------------------------------.
  "@stylistic/arrow-parens": "off", // Handled by `prettier`; consumers choose `arrowParens`. Automatically fixable by the --fix command.
  "@stylistic/brace-style": "off", // Handled by `prettier`; preserve compact empty blocks and consistent brace placement. Automatically fixable by the --fix command.
  "@stylistic/comma-dangle": "off", // Handled by `prettier`; consumers choose `trailingComma`. Automatically fixable by the --fix command.
  "@stylistic/indent": "off", // Handled by `prettier`; consumers choose indentation width and tabs. Automatically fixable by the --fix command.
  "@stylistic/indent-binary-ops": "off", // Handled by `prettier`; binary expression indentation follows the surrounding layout. Automatically fixable by the --fix command.
  "@stylistic/jsx-closing-bracket-location": "off", // Handled by `prettier`; consumers choose `bracketSameLine`. Automatically fixable by the --fix command.
  "@stylistic/jsx-closing-tag-location": "off", // Handled by `prettier`; closing tags follow its JSX wrapping. Automatically fixable by the --fix command.
  "@stylistic/jsx-curly-newline": "off", // Handled by `prettier`; expression wrapping depends on print width. Automatically fixable by the --fix command.
  "@stylistic/jsx-first-prop-new-line": "off", // Handled by `prettier`; consumers choose `singleAttributePerLine`. Automatically fixable by the --fix command.
  "@stylistic/jsx-function-call-newline": "off", // Handled by `prettier`; JSX argument wrapping depends on print width. Automatically fixable by the --fix command.
  "@stylistic/jsx-indent-props": "off", // Handled by `prettier`; consumers choose indentation width and tabs. Automatically fixable by the --fix command.
  "@stylistic/jsx-max-props-per-line": "off", // Handled by `prettier`; consumers choose `singleAttributePerLine`. Automatically fixable by the --fix command.
  "@stylistic/jsx-one-expression-per-line": "off", // Handled by `prettier`; preserve readable inline JSX text and expressions. Automatically fixable by the --fix command.
  "@stylistic/jsx-quotes": "off", // Handled by `prettier`; consumers choose `jsxSingleQuote`. Automatically fixable by the --fix command.
  "@stylistic/jsx-wrap-multilines": "off", // Handled by `prettier`; parentheses depend on the expression context and wrapping. Automatically fixable by the --fix command.
  "@stylistic/member-delimiter-style": "off", // Handled by `prettier`; TypeScript member delimiters follow its semicolon policy. Automatically fixable by the --fix command.
  "@stylistic/multiline-ternary": "off", // Handled by `prettier`; conditional expression wrapping depends on print width. Automatically fixable by the --fix command.
  "@stylistic/new-parens": "off", // Handled by `prettier`; constructor calls already receive parentheses. Automatically fixable by the --fix command.
  "@stylistic/no-extra-parens": "off", // Handled by `prettier`; preserve parentheses that clarify precedence without competing fixes. Automatically fixable by the --fix command.
  "@stylistic/no-multiple-empty-lines": "off", // Handled by `prettier`; extra blank lines already collapse during formatting. Automatically fixable by the --fix command.
  "@stylistic/no-tabs": "off", // Prefer to allow literal tabs in data and comments; indentation is handled by `prettier`.
  "@stylistic/object-curly-spacing": "off", // Handled by `prettier`; consumers choose `bracketSpacing`. Automatically fixable by the --fix command.
  "@stylistic/operator-linebreak": "off", // Handled by `prettier`; consumers choose operator placement where supported. Automatically fixable by the --fix command.
  "@stylistic/padded-blocks": "off", // Handled by `prettier`; blocks do not need redundant leading or trailing blank lines. Automatically fixable by the --fix command.
  "@stylistic/quote-props": "off", // Handled by `prettier`; consumers choose `quoteProps`. Automatically fixable by the --fix command.
  "@stylistic/quotes": "off", // Handled by `prettier`; consumers choose `singleQuote` and literal escaping. Automatically fixable by the --fix command.
  "@stylistic/semi": "off", // Handled by `prettier`; consumers choose `semi`. Automatically fixable by the --fix command.
  "@stylistic/wrap-iife": "off", // Handled by `prettier`; wrapping depends on whether the function expression is ambiguous. Automatically fixable by the --fix command.
} as const;

const otherRules: Rules = {
  // --- Rules with default options (5/32) ----------------------------------------------------------------------------------------------------------.
  "@stylistic/function-call-spacing": ["error", "never"], // Automatically fixable by the --fix command.
  "@stylistic/jsx-pascal-case": [
    "error",
    {
      allowAllCaps: false,
      allowLeadingUnderscore: false,
      allowNamespace: false,
      ignore: [],
    },
  ],
  "@stylistic/jsx-self-closing-comp": [
    "error",
    {
      component: true,
      html: true,
    },
  ], // Automatically fixable by the --fix command.
  "@stylistic/no-extra-semi": "error", // Automatically fixable by the --fix command.
  "@stylistic/switch-colon-spacing": [
    "error",
    {
      after: true,
      before: false,
    },
  ], // Automatically fixable by the --fix command.

  // --- Rules with overridden options (1/32) -------------------------------------------------------------------------------------------------------.
  "@stylistic/padding-line-between-statements": [
    "error",
    {
      blankLine: "always",
      next: "*",
      prev: [
        { selector: functionVariable },
        { selector: `ExportNamedDeclaration:has(> ${functionVariable})` },
      ],
    },
  ], // Automatically fixable by the --fix command.

  // --- Turned off rules (26/32) -------------------------------------------------------------------------------------------------------------------.
  "@stylistic/array-bracket-newline": "off", // Handled by `prettier`; line wrapping depends on print width and array contents. Automatically fixable by the --fix command.
  "@stylistic/array-element-newline": "off", // Handled by `prettier`; preserve compact arrays where their elements fit. Automatically fixable by the --fix command.
  "@stylistic/curly-newline": "off", // Handled by `prettier`; preserve compact empty blocks and print-width-based wrapping. Automatically fixable by the --fix command.
  "@stylistic/exp-jsx-props-style": "off", // Prefer stable rules over an experimental JSX layout policy. Automatically fixable by the --fix command.
  "@stylistic/exp-list-style": "off", // Prefer stable rules over an experimental bracket layout policy. Automatically fixable by the --fix command.
  "@stylistic/function-call-argument-newline": "off", // Handled by `prettier`; argument wrapping depends on print width. Automatically fixable by the --fix command.
  "@stylistic/function-paren-newline": "off", // Handled by `prettier`; parameter wrapping depends on print width. Automatically fixable by the --fix command.
  "@stylistic/implicit-arrow-linebreak": "off", // Handled by `arrow-body-style`, which requires block bodies. Automatically fixable by the --fix command.
  "@stylistic/jsx-child-element-spacing": "off", // Prefer explicit JSX whitespace where rendered text requires it; spaces affect output.
  "@stylistic/jsx-indent": "off", // Deprecated; handled by `prettier` rather than the replacement `@stylistic/indent`. Automatically fixable by the --fix command.
  "@stylistic/jsx-newline": "off", // Handled by `prettier`; preserve author grouping without arbitrary JSX blank lines. Automatically fixable by the --fix command.
  "@stylistic/jsx-props-no-multi-spaces": "off", // Deprecated; handled by `@stylistic/no-multi-spaces`. Automatically fixable by the --fix command.
  "@stylistic/jsx-sort-props": "off", // Deprecated; handled by `perfectionist/sort-jsx-props`. Automatically fixable by the --fix command.
  "@stylistic/line-comment-position": "off", // Prefer to allow concise inline comments when they clarify adjacent code.
  "@stylistic/linebreak-style": "off", // Handled by `prettier`; consumers choose `endOfLine`. Automatically fixable by the --fix command.
  "@stylistic/lines-around-comment": "off", // Prefer related comments beside their code without mandatory surrounding blank lines. Automatically fixable by the --fix command.
  "@stylistic/max-len": "off", // Handled by `prettier`; print width is a wrapping target, and literals or URLs may exceed it.
  "@stylistic/multiline-comment-style": "off", // Preserve ordinary grouped line and block comments; documentation stars are handled by `@cravingmaker/starred-documentation`. Automatically fixable by the --fix command.
  "@stylistic/newline-per-chained-call": "off", // Handled by `prettier`; chain wrapping depends on call structure and print width. Automatically fixable by the --fix command.
  "@stylistic/no-confusing-arrow": "off", // Handled by `arrow-body-style`, which requires block bodies. Automatically fixable by the --fix command.
  "@stylistic/nonblock-statement-body-position": "off", // Handled by `curly`, which requires block bodies. Automatically fixable by the --fix command.
  "@stylistic/object-curly-newline": "off", // Handled by `prettier`; object and type wrapping depends on print width and source grouping. Automatically fixable by the --fix command.
  "@stylistic/object-property-newline": "off", // Handled by `prettier`; preserve compact objects where their properties fit. Automatically fixable by the --fix command.
  "@stylistic/one-var-declaration-per-line": "off", // Handled by `one-var`, which requires separate declarations. Automatically fixable by the --fix command.
  "@stylistic/semi-style": "off", // Handled by `prettier`; preserve leading semicolons that protect ASI-sensitive statements. Automatically fixable by the --fix command.
  "@stylistic/wrap-regex": "off", // Prefer natural regex syntax without redundant parentheses. Automatically fixable by the --fix command.
} as const;

const stylisticRules: Rules = {
  ...recommendedRules, // 65/98 rules, 61 automatically fixable, 0 editor suggestions fixable.
  ...otherRules, // 32/98 rules, 28 automatically fixable, 0 editor suggestions fixable.
  "@cravingmaker/svelte-function-variable-padding": "error", // Internal policy: 1/98 rules, 1 automatically fixable, 0 editor suggestions fixable.
} as const;

export { stylisticRules };
