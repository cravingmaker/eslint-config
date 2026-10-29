import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { vitest } from "../../../../src/configs/plugins/vitest/index.js";
import { expectLintError, expectNoLintError } from "../../../support/lint.js";
import { getResolvedConfig as getEffectiveConfig } from "../../../support/resolved-config.js";

const testFile = { filePath: "src/example.test.ts" } as const;
const imports = 'import { expect, it } from "vitest";\n\n';

describe("vitest feature", () => {
  it("lints the test files among the sources, within its files and ignores", async () => {
    const eslint = new ESLint({
      overrideConfig: await vitest({
        files: ["src/**"],
        ignores: ["src/generated/**"],
        overrides: { "vitest/no-disabled-tests": "warn" },
      }),
      overrideConfigFile: true,
    });
    const [test, spec, source, commonJs, outside, ignored] = await Promise.all(
      [
        "src/example.test.ts",
        "src/Component.spec.jsx",
        "src/example.ts",
        "src/example.test.cjs",
        "tests/example.test.ts",
        "src/generated/example.test.ts",
      ].map(async (filePath) => {
        return await getEffectiveConfig(eslint, filePath);
      }),
    );

    expect(test?.rules?.["vitest/no-disabled-tests"]?.[0]).toBe(1);
    expect(spec?.rules?.["vitest/no-focused-tests"]).toEqual([
      2,
      { fixable: false },
    ]);
    expect(source).toBeUndefined();
    // ESLint's default config still matches `.cjs` files, but no rule of the feature applies.
    expect(commonJs?.rules?.["vitest/no-focused-tests"]).toBeUndefined();
    expect(outside).toBeUndefined();
    expect(ignored).toBeUndefined();
  });

  it.each([
    ["vitest/no-disabled-tests", 'it.skip("adds", () => {});\n'],
    ["vitest/no-focused-tests", 'it.only("adds", () => {});\n'],
    [
      "vitest/require-awaited-expect-poll",
      'it("polls", async () => {\n  expect.poll(() => 1).toBe(1);\n});\n',
    ],
    ["vitest/valid-expect", 'it("adds", () => {\n  expect(1);\n});\n'],
    [
      "vitest/valid-expect-in-promise",
      'it("resolves", () => {\n  Promise.resolve(1).then((value) => {\n    expect(value).toBe(1);\n  });\n});\n',
    ],
  ])("reports %s", async (ruleId, code) => {
    await expectLintError(`${imports}${code}`, ruleId, testFile);
  });

  it("accepts a message of any string expression as the second argument of `expect()`, and reports a third", async () => {
    const message = 'const message = "one";\n\n';

    await expectNoLintError(
      `${imports}${message}it("adds", () => {\n  expect(1, message).toBe(1);\n});\n`,
      "vitest/valid-expect",
      testFile,
    );
    await expectLintError(
      `${imports}${message}it("adds", () => {\n  expect(1, message, message).toBe(1);\n});\n`,
      "vitest/valid-expect",
      testFile,
    );
  });

  it("reports a focused test without removing `.only`", async () => {
    const eslint = new ESLint({
      fix: true,
      overrideConfig: await vitest(),
      overrideConfigFile: true,
    });
    const [result] = await eslint.lintText(
      `${imports}it.only("adds", () => {\n  expect(1 + 1).toBe(2);\n});\n`,
      testFile,
    );

    expect(result.output).toBeUndefined();
    expect(
      result.messages.map((message) => {
        return message.ruleId;
      }),
    ).toEqual(["vitest/no-focused-tests"]);
  });
});
