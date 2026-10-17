import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../../dist/index.mjs";
import { expectLintError, expectNoLintError } from "../../utilities.js";

const tsOptions = {
  filePath: "tests/utilities.ts",
  tsTypeChecked: true,
} as const;

describe("typescript-eslint rules", () => {
  it.each([false, true])(
    "@typescript-eslint/no-restricted-types: suggests Uint8Array for Buffer with typed linting %s",
    async (typeChecked) => {
      const eslint = new ESLint({
        overrideConfig: await createConfig({ typescript: { typeChecked } }),
        overrideConfigFile: true,
      });
      const code = `export type Bytes = Buffer;\n`;
      const results = await eslint.lintText(code, {
        filePath: tsOptions.filePath,
      });
      const messages = results.flatMap((result) => {
        return result.messages;
      });
      const restrictedType = messages.find((message) => {
        return message.ruleId === "@typescript-eslint/no-restricted-types";
      });

      expect(
        messages.some((message) => {
          return message.fatal === true;
        }),
      ).toBe(false);
      expect(restrictedType?.message).toContain("Use Uint8Array instead.");
      expect(restrictedType).toMatchObject({
        severity: 2,
        suggestions: [{ fix: { text: "Uint8Array" } }],
      });
      expect(restrictedType?.fix).toBeUndefined();

      const suggestion = restrictedType?.suggestions?.[0]?.fix;
      expect(suggestion).toBeDefined();
      const suggestedCode =
        typeof suggestion === "undefined"
          ? code
          : code.slice(0, suggestion.range[0]) +
            suggestion.text +
            code.slice(suggestion.range[1]);

      expect(suggestedCode).toBe(`export type Bytes = Uint8Array;\n`);
      const suggestedResults = await eslint.lintText(suggestedCode, {
        filePath: tsOptions.filePath,
      });
      expect(
        suggestedResults.flatMap((result) => {
          return result.messages;
        }),
      ).not.toContainEqual(
        expect.objectContaining({
          ruleId: "@typescript-eslint/no-restricted-types",
        }),
      );
    },
  );

  it.each(["buffer", "node:buffer"])(
    "no-restricted-imports: reports type-only imports from %s",
    async (source) => {
      await expectLintError(
        `import type { Buffer } from '${source}';\nexport type Bytes = Buffer;\n`,
        "no-restricted-imports",
        { filePath: "test.ts" },
      );
    },
  );

  it("@typescript-eslint/no-restricted-types: allows Uint8Array annotations", async () => {
    await expectNoLintError(
      `export type Bytes = Uint8Array;\n`,
      "@typescript-eslint/no-restricted-types",
      { filePath: "test.ts" },
    );
  });

  it("@typescript-eslint/ban-ts-comment: requires descriptions for expected errors", async () => {
    await expectLintError(
      `// @ts-expect-error: TODO\nconst value: string = 1;\nconsole.log(value);\n`,
      "@typescript-eslint/ban-ts-comment",
      tsOptions,
    );
  });

  it("@typescript-eslint/consistent-type-definitions: reports interface declarations", async () => {
    await expectLintError(
      `interface User {\n\tname: string;\n}\nconst user: User = { name: 'Ada' };\nconsole.log(user);\n`,
      "@typescript-eslint/consistent-type-definitions",
      tsOptions,
    );
  });

  it("@typescript-eslint/explicit-member-accessibility: reports explicit public members", async () => {
    await expectLintError(
      `class Store {\n\tpublic value = 1;\n}\nconsole.log(Store);\n`,
      "@typescript-eslint/explicit-member-accessibility",
      tsOptions,
    );
  });
});
