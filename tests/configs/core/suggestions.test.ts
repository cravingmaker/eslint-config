import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../../dist/index.mjs";
import { expectLintError, expectNoLintError } from "../../utilities.js";

describe("core suggestion rules", () => {
  it.each(["test.js", "test.ts"])(
    "no-restricted-globals: directs Buffer users to Uint8Array in %s",
    async (filePath) => {
      const eslint = new ESLint({
        overrideConfig: await createConfig({
          environments: ["node"],
          typescript: { typeChecked: false },
        }),
        overrideConfigFile: true,
      });
      const results = await eslint.lintText(
        `export const bytes = Buffer.from('data');\n`,
        { filePath },
      );
      const messages = results.flatMap((result) => {
        return result.messages;
      });

      expect(
        messages.some((message) => {
          return message.fatal === true;
        }),
      ).toBe(false);
      expect(messages).toContainEqual(
        expect.objectContaining({
          message: "Unexpected use of 'Buffer'. Use Uint8Array instead.",
          ruleId: "no-restricted-globals",
          severity: 2,
        }),
      );
      expect(messages).not.toContainEqual(
        expect.objectContaining({ ruleId: "n/prefer-global/buffer" }),
      );
    },
  );

  it.each([
    { filePath: "test.js", source: "buffer" },
    { filePath: "test.js", source: "node:buffer" },
    { filePath: "test.ts", source: "buffer" },
    { filePath: "test.ts", source: "node:buffer" },
  ])(
    "no-restricted-imports: reports $source in $filePath",
    async ({ filePath, source }) => {
      await expectLintError(
        `import { Buffer as Bytes } from '${source}';\nexport const bytes = Bytes.from('data');\n`,
        "no-restricted-imports",
        { filePath },
      );
    },
  );

  it("func-style: requires expressions instead of declarations", async () => {
    await expectLintError(
      `function declared() {\n\treturn 'declared';\n}\nconst expressed = () => 'expressed';\nconsole.log(declared(), expressed());\n`,
      "func-style",
      { filePath: "test.js" },
    );
    await expectNoLintError(
      `export const expressed = () => { return 'expressed'; };\n`,
      "func-style",
      { filePath: "test.js" },
    );
  });

  it("no-nested-ternary: reports a chained ternary as Prettier prints it, in place of unicorn/no-nested-ternary", async () => {
    const code = `const pick = (first, second) => (first ? 1 : second ? 2 : 3);\nconsole.log(pick(true, false));\n`;

    await expectLintError(code, "no-nested-ternary", { filePath: "test.js" });
    await expectNoLintError(code, "unicorn/no-nested-ternary", {
      filePath: "test.js",
    });
  });
});
