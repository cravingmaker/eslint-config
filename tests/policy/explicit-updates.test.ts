import type { Options } from "../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

const rules = new Set([
  "logical-assignment-operators",
  "no-plusplus",
  "operator-assignment",
]);
const eslint = new ESLint({
  overrideConfig: await createConfig({ typescript: { typeChecked: false } }),
  overrideConfigFile: true,
});
const reports = async (code: string, filePath: string) => {
  const [result] = await eslint.lintText(code, { filePath });
  expect(result.fatalErrorCount).toBe(0);
  return result.messages.filter(({ ruleId }) => {
    return typeof ruleId === "string" && rules.has(ruleId);
  });
};

describe.each(["example.js", "example.ts"])(
  "explicit updates in %s",
  (filePath) => {
    it.each([
      "count++;",
      "++count;",
      "count--;",
      "--count;",
      "for (; count < 3; count++) {}",
      "for (; count > 0; --count) {}",
    ])("rejects %s without an unsafe automatic rewrite", async (text) => {
      const messages = await reports(`let count = 1; ${text}`, filePath);
      expect(messages).toEqual([
        expect.objectContaining({ ruleId: "no-plusplus", severity: 2 }),
      ]);
      expect(messages[0].fix).toBeUndefined();
    });

    it.each([
      "+=",
      "-=",
      "*=",
      "/=",
      "%=",
      "**=",
      "<<=",
      ">>=",
      ">>>=",
      "&=",
      "|=",
      "^=",
    ])("rejects arithmetic/bitwise compound %s", async (operator) => {
      expect(
        await reports(`let count = 2; count ${operator} 1;`, filePath),
      ).toContainEqual(
        expect.objectContaining({ ruleId: "operator-assignment", severity: 2 }),
      );
    });

    it.each(["&&=", "||=", "??="])(
      "rejects logical compound %s",
      async (operator) => {
        expect(
          await reports(`let value = 1; value ${operator} 2;`, filePath),
        ).toContainEqual(
          expect.objectContaining({
            ruleId: "logical-assignment-operators",
            severity: 2,
          }),
        );
      },
    );

    it.each([
      "let count = 1; count = count + 1; count = count - 1;",
      "let count = 1n; count = count + 1n; count = count - 1n;",
      "for (let count = 0; count < 3; count = count + 1) {}",
      "let value = 1; if (value) { value = 2; }",
      "let value = 1; if (!value) { value = 2; }",
      "let value; if (value === null || value === undefined) { value = 2; }",
    ])("accepts explicit assignment %s", async (text) => {
      expect(await reports(text, filePath)).toEqual([]);
    });
  },
);

it("retains independent bitwise restrictions", async () => {
  const [result] = await eslint.lintText("let count = 2; count = count << 1;", {
    filePath: "example.js",
  });
  expect(result.messages).toContainEqual(
    expect.objectContaining({ ruleId: "no-bitwise" }),
  );
});

it.each([
  { filePath: "scripts/example.js", javascript: { files: ["src/**"] } },
  {
    filePath: "src/generated.js",
    javascript: { ignores: ["**/generated.js"] },
  },
  {
    filePath: "example.js",
    javascript: { overrides: { "no-plusplus": "off" } },
  },
] satisfies ReadonlyArray<{
  readonly filePath: string;
  readonly javascript: Options["javascript"];
}>)(
  "keeps explicit-update enforcement within its JavaScript feature boundary: $filePath $javascript",
  async ({ filePath, javascript }) => {
    const engine = new ESLint({
      overrideConfig: await createConfig({ javascript }),
      overrideConfigFile: true,
    });
    const [result] = await engine.lintText("let count = 1; count++;", {
      filePath,
    });
    expect(result.fatalErrorCount).toBe(0);
    expect(result.messages).not.toContainEqual(
      expect.objectContaining({ ruleId: "no-plusplus" }),
    );
  },
);
