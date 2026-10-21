import type { Rule, SourceCode } from "eslint";

import { isFunctionValue } from "./function-values.js";

const isFunctionVariable = (node: Readonly<Rule.Node>): boolean => {
  if (node.type === "ExportNamedDeclaration") {
    if (node.declaration === null) {
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Parser declarations retain their AST parent links.
    const declaration = node.declaration as Rule.Node;
    return isFunctionVariable(declaration);
  }
  return (
    node.type === "VariableDeclaration" &&
    node.declarations.some(({ id, init }) => {
      return id.type === "Identifier" && isFunctionValue(init);
    })
  );
};

const paddingAnchor = (
  previous: Readonly<Rule.Node>,
  next: Readonly<Rule.Node>,
  sourceCode: Readonly<SourceCode>,
) => {
  const last = sourceCode.getLastToken(previous);
  const first = sourceCode.getFirstToken(next);
  if (last === null || first === null) {
    return;
  }
  const comments = sourceCode.getTokensBetween(previous, next, {
    includeComments: true,
  });
  const boundaries = [last, ...comments, first];
  const hasPadding = boundaries.some((token, index) => {
    const previousLine = boundaries.at(index - 1)?.loc?.end.line;
    return (
      index > 0 &&
      typeof previousLine === "number" &&
      typeof token.loc?.start.line === "number" &&
      token.loc.start.line - previousLine >= 2
    );
  });
  if (hasPadding) {
    return;
  }
  const trailing = comments.findLast((token) => {
    return token.loc?.start.line === last.loc.end.line;
  });
  return trailing ?? last;
};

const svelteFunctionVariablePadding: Rule.RuleModule = {
  create: (context) => {
    const { sourceCode } = context;
    /* eslint-disable functional/no-return-void -- ESLint visitors and diagnostic callbacks return no value. */
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- ESLint requires the Svelte AST selector name.
      "SvelteScriptElement:exit": (node: Readonly<Rule.Node>) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- The optional Svelte parser provides this script-body shape; no optional peer is loaded here.
        const { body } = node as unknown as {
          readonly body: readonly Rule.Node[];
        };
        // eslint-disable-next-line unicorn/no-for-each -- Each adjacent statement pair can emit an independent ESLint diagnostic.
        body.slice(1).forEach((next, index) => {
          const previous = body.at(index);
          if (
            typeof previous === "undefined" ||
            !isFunctionVariable(previous)
          ) {
            return;
          }
          const anchor = paddingAnchor(previous, next, sourceCode);
          if (typeof anchor === "undefined") {
            return;
          }
          const following = sourceCode.getTokenAfter(anchor, {
            includeComments: true,
          });
          const newline = sourceCode.text.includes("\r\n") ? "\r\n" : "\n";
          context.report({
            fix: (fixer) => {
              return fixer.insertTextAfter(
                anchor,
                newline.repeat(
                  following?.loc?.start.line === anchor.loc?.end.line ? 2 : 1,
                ),
              );
            },
            messageId: "padding",
            node: next,
          });
        });
      },
    };
    /* eslint-enable functional/no-return-void -- Restore the value-return guard outside visitor callbacks. */
  },
  meta: {
    docs: {
      description:
        "Separate function variables in Svelte script bodies unsupported by Stylistic",
    },
    fixable: "whitespace",
    messages: {
      padding: "Add a blank line after a function-valued variable declaration.",
    },
    schema: [],
    type: "layout",
  },
};

export { svelteFunctionVariablePadding };
