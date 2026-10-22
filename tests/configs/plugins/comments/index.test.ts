import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { comments } from "../../../../src/configs/plugins/comments/index.js";

const eslint = new ESLint({
  overrideConfig: [...comments(), { rules: { "no-debugger": "error" } }],
  overrideConfigFile: true,
});

describe("comment directive policy", () => {
  it.each([
    {
      directive: "// eslint-disable-next-line no-debugger",
      ruleId: "@eslint-community/eslint-comments/require-description",
    },
    {
      directive: "/* eslint-disable -- Inspect startup state. */",
      ruleId: "@eslint-community/eslint-comments/no-unlimited-disable",
    },
  ])(
    "reports $ruleId while the directive suppresses its target",
    async ({ directive, ruleId }) => {
      const [result] = await eslint.lintText(`${directive}\ndebugger;\n`, {
        filePath: "src/example.js",
      });

      expect(result.fatalErrorCount).toBe(0);
      expect(
        result.messages.map((message) => {
          return message.ruleId;
        }),
      ).toEqual([ruleId]);
      expect(
        result.suppressedMessages.map((message) => {
          return message.ruleId;
        }),
      ).toEqual(["no-debugger"]);
    },
  );

  it("accepts an explained next-line directive and reports a later violation", async () => {
    const [result] = await eslint.lintText(
      "// eslint-disable-next-line no-debugger -- Inspect startup state.\ndebugger;\ndebugger;\n",
      { filePath: "src/example.js" },
    );

    expect(result.fatalErrorCount).toBe(0);
    expect(
      result.messages.map(({ line, ruleId }) => {
        return { line, ruleId };
      }),
    ).toEqual([{ line: 3, ruleId: "no-debugger" }]);
    expect(
      result.suppressedMessages.map(({ line, ruleId }) => {
        return { line, ruleId };
      }),
    ).toEqual([{ line: 2, ruleId: "no-debugger" }]);
  });
});
