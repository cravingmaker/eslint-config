import { describe, it } from "vitest";

import { expectLintError, expectNoLintError } from "../utilities.js";

const jsOptions = { filePath: "test.js" } as const;

describe("regexp rules", () => {
  it.each([
    [String.raw`\x1b`, String.raw`\x1B`],
    [String.raw`\u00e9`, String.raw`\u00E9`],
    [String.raw`\u{e9}`, String.raw`\u{E9}`],
  ])(
    "regexp/letter-case: requires uppercase escapes for %s",
    async (lowercase, uppercase) => {
      await expectLintError(
        `export const pattern = /${lowercase}/u;\n`,
        "regexp/letter-case",
        jsOptions,
      );
      await expectNoLintError(
        `export const pattern = /${uppercase}/u;\n`,
        "regexp/letter-case",
        jsOptions,
      );
    },
  );

  it("regexp/hexadecimal-escape: disallows hexadecimal escapes in favor of alternatives", async () => {
    await expectLintError(
      `const pattern = /\\x41/u;\nconsole.log(pattern);\n`,
      "regexp/hexadecimal-escape",
      jsOptions,
    );
  });

  it("regexp/prefer-character-class: reports two-option single-character alternatives", async () => {
    await expectLintError(
      `const pattern = /a|b/u;\nconsole.log(pattern);\n`,
      "regexp/prefer-character-class",
      jsOptions,
    );
  });

  it("regexp/prefer-escape-replacement-dollar-char: stays disabled for WYSIWYG replacements", async () => {
    await expectNoLintError(
      `export const price = '10'.replace(/\\d+/u, '$&$');\n`,
      "regexp/prefer-escape-replacement-dollar-char",
      jsOptions,
    );
  });

  it("regexp/require-unicode-regexp: stays disabled for non-unicode regexes", async () => {
    await expectNoLintError(
      `const pattern = /ready/;\nconsole.log(pattern);\n`,
      "regexp/require-unicode-regexp",
      jsOptions,
    );
  });

  it("regexp/require-unicode-sets-regexp: stays disabled for unicode regexes without the v flag", async () => {
    await expectNoLintError(
      `const pattern = /ready/u;\nconsole.log(pattern);\n`,
      "regexp/require-unicode-sets-regexp",
      jsOptions,
    );
  });
});
