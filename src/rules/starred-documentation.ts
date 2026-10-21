import type { Rule } from "eslint";

const starredText = (text: string, column: number): string | undefined => {
  const newline = /\r\n|[\n\r\u{2028}\u{2029}]/u.exec(text)?.[0];
  if (typeof newline === "undefined") {
    return;
  }
  const lines = text.split(/\r\n|[\n\r\u{2028}\u{2029}]/u);
  const unstarred = lines.slice(1).filter((line) => {
    return !/^\s*\*/u.test(line);
  });
  if (unstarred.length === 0) {
    return;
  }
  const indents = unstarred
    .filter((line) => {
      return line.trim().length > 0;
    })
    .map((line) => {
      return /^[\t ]*/u.exec(line)?.[0].length ?? 0;
    });
  const commonIndent = indents.length > 0 ? Math.min(...indents) : 0;
  const indentation = " ".repeat(column);
  return lines
    .map((line, index) => {
      if (index === lines.length - 1 && line.trim() === "*/") {
        return `${indentation} */`;
      }
      if (index === 0 || /^\s*\*/u.test(line)) {
        return line;
      }
      const content = line.trim().length === 0 ? "" : line.slice(commonIndent);
      return `${indentation} *${content.length > 0 ? ` ${content}` : ""}`;
    })
    .join(newline);
};

const starredDocumentation: Rule.RuleModule = {
  create: (context) => {
    const { sourceCode } = context;
    /* eslint-disable functional/no-return-void -- ESLint visitors and diagnostic callbacks return no value. */
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- ESLint requires the ESTree selector name.
      "Program:exit": (_program) => {
        // eslint-disable-next-line unicorn/no-for-each -- ESLint emits independent diagnostics for documentation comments.
        sourceCode.getAllComments().forEach((comment) => {
          if (comment.type !== "Block" || !comment.value.startsWith("*")) {
            return;
          }
          const replacement = starredText(
            sourceCode.getText(comment),
            comment.loc?.start.column ?? 0,
          );
          if (typeof replacement === "undefined") {
            return;
          }
          context.report({
            fix: (fixer) => {
              return fixer.replaceText(comment, replacement);
            },
            messageId: "starred",
            node: comment,
          });
        });
      },
    };
    /* eslint-enable functional/no-return-void -- Restore the value-return guard outside visitor callbacks. */
  },
  meta: {
    docs: {
      description:
        "Require starred documentation comments without converting ordinary comments",
    },
    fixable: "whitespace",
    messages: {
      starred:
        "Prefix documentation lines with an asterisk, preserving paragraph breaks.",
    },
    schema: [],
    type: "layout",
  },
};

export { starredDocumentation };
