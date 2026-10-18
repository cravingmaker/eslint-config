import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

const ruleId = "security/detect-invisible-characters";
const characters = [
  { codePoint: 0x31_64, escaped: String.raw`\u3164`, name: "U+3164" },
  { codePoint: 0xff_a0, escaped: String.raw`\uFFA0`, name: "U+FFA0" },
];
const eslint = new ESLint({
  overrideConfig: await createConfig(),
  overrideConfigFile: true,
});

describe.each(["test.js", "test.ts"])("security rules in %s", (filePath) => {
  const lintInvisibleCharacters = async (code: string) => {
    expect(await eslint.isPathIgnored(filePath)).toBe(false);
    const [result] = await eslint.lintText(code, { filePath });
    expect(result.fatalErrorCount).toBe(0);
    return result.messages.filter((message) => {
      return message.ruleId === ruleId;
    });
  };

  it.each(characters)(
    "warns about literal $name in source and comments",
    async ({ codePoint }) => {
      const character = String.fromCodePoint(codePoint);
      const messages = await lintInvisibleCharacters(
        `export const value = "${character}";\n// ${character}\n`,
      );

      expect(messages).toEqual([
        expect.objectContaining({ line: 1, ruleId, severity: 1 }),
        expect.objectContaining({ line: 2, ruleId, severity: 1 }),
      ]);
    },
  );

  it.each(characters)(
    "allows visible $name escape sequences in source and comments",
    async ({ escaped }) => {
      const messages = await lintInvisibleCharacters(
        `export const value = "${escaped}";\n// ${escaped}\n`,
      );

      expect(messages).toEqual([]);
    },
  );
});
