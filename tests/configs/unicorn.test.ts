import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";
import { expectLintError, expectNoLintError } from "../utilities.js";

const jsOptions = { filePath: "test.js" } as const;
const rightArrowText = String.fromCodePoint(45, 62);

describe.each(["test.js", "test.ts"])(
  "Unicorn upgrade contracts in %s",
  (filePath) => {
    it("keeps source linting compatible with the disabled frontmatter rule", async () => {
      await expectNoLintError(
        "export const value = 1;\n",
        "unicorn/require-frontmatter-fields",
        { filePath },
      );
    });

    it("still reports continue statements in nested loops", async () => {
      await expectLintError(
        "export function logValues(rows) {\n  for (const row of rows) {\n    for (const value of row) {\n      if (value === 0) { continue; }\n      console.log(value);\n    }\n  }\n}\n",
        "unicorn/no-break-in-nested-loop",
        { filePath },
      );
    });

    it.each([
      {
        code: "const values = [1, 2];\nvalues.map((value) => value * 2);\n",
        receiver: "array",
      },
      {
        code: "const values = new Set([1, 2]);\nvalues.has(1);\n",
        receiver: "Set",
      },
    ])("reports discarded $receiver method results", async ({ code }) => {
      await expectLintError(code, "unicorn/no-unused-builtin-method-return", {
        filePath,
      });
    });

    it("allows a consumed built-in method result", async () => {
      await expectNoLintError(
        "export const hasValue = new Set([1, 2]).has(1);\n",
        "unicorn/no-unused-builtin-method-return",
        { filePath },
      );
    });

    it.each([
      {
        code: 'import { Buffer } from "node:buffer";\nexport const hexadecimal = Buffer.from([1, 2]).toString("hex");\nexport const bytes = Buffer.from("0102", "hex");\n',
        ruleId: "unicorn/prefer-uint8array-hex",
      },
      {
        code: 'const names = ["Ada"];\nconst scores = [10];\nfor (let index = 0; index < Math.min(names.length, scores.length); index += 1) {\n  console.log(names[index], scores[index]);\n}\n',
        ruleId: "unicorn/prefer-iterator-zip",
      },
    ])(
      "keeps $ruleId off while allowing an explicit override",
      async ({ code, ruleId }) => {
        const eslint = new ESLint({
          overrideConfig: await createConfig(),
          overrideConfigFile: true,
        });
        const [result] = await eslint.lintText(code, { filePath });

        expect(result.fatalErrorCount).toBe(0);
        expect(
          result.messages.filter((message) => {
            return message.ruleId === ruleId;
          }),
        ).toEqual([]);

        const enabledEslint = new ESLint({
          overrideConfig: await createConfig({
            unicorn: { overrides: { [ruleId]: "error" } },
          }),
          overrideConfigFile: true,
        });
        const [enabled] = await enabledEslint.lintText(code, { filePath });

        expect(enabled.fatalErrorCount).toBe(0);
        expect(enabled.messages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ ruleId, severity: 2 }),
          ]),
        );
      },
    );
  },
);

describe.each([
  {
    operators: ["&&", "||", "??"],
    ruleId: "logical-assignment-operators",
  },
  {
    operators: ["+", "-", "*", "/", "%", "**"],
    ruleId: "operator-assignment",
  },
])("unicorn/$ruleId", ({ operators, ruleId }) => {
  it.each(["test.js", "test.ts"])(
    "leaves the selected core policy in charge and keeps fixes stable in %s",
    async (filePath) => {
      const overrideConfig = await createConfig();
      const eslint = new ESLint({ overrideConfig, overrideConfigFile: true });
      const code = [
        "export const update = (state, fallback) => {",
        ...operators.map((operator) => {
          return `  state.value ${operator}= fallback;`;
        }),
        "  return state;",
        "};\n",
      ].join("\n");
      const [original] = await eslint.lintText(code, { filePath });
      const ruleIds = original.messages.map((message) => {
        return message.ruleId;
      });

      expect(
        ruleIds.filter((id) => {
          return id === ruleId;
        }),
      ).toHaveLength(operators.length);
      expect(
        ruleIds.filter((id) => {
          return id === `unicorn/${ruleId}`;
        }),
      ).toHaveLength(0);

      const fixingEslint = new ESLint({
        fix: true,
        overrideConfig,
        overrideConfigFile: true,
      });
      const expanded = [
        "export const update = (state, fallback) => {",
        ...operators.map((operator) => {
          return `  state.value = state.value ${operator} fallback;`;
        }),
        "  return state;",
        "};\n",
      ].join("\n");
      const [fixed] = await fixingEslint.lintText(expanded, { filePath });

      expect(fixed.messages).toEqual([]);
      expect(fixed.output).toBeUndefined();
    },
  );
});

describe("unicorn rules", () => {
  it("unicorn/filename-case: allows PascalCase filenames", async () => {
    await expectNoLintError(
      `export const value = 1;\n`,
      "unicorn/filename-case",
      { filePath: "ReadyWidget.js" },
    );
  });

  it("unicorn/filename-case: ignores numeric migration prefixes", async () => {
    await expectNoLintError(
      `export const value = 1;\n`,
      "unicorn/filename-case",
      { filePath: "001_init.js" },
    );
  });

  it("unicorn/name-replacements: allows framework abbreviations from the replacement policy", async () => {
    await expectNoLintError(
      `function handler(req, res, ctx) {\n\tconsole.log(req, res, ctx);\n}\nhandler('request', 'response', 'context');\n`,
      "unicorn/name-replacements",
      jsOptions,
    );
  });

  it("unicorn/name-replacements: allows configured allow-list identifiers", async () => {
    await expectNoLintError(
      `const i18n = { locale: 'en' };\nconst i18nKey = 'common.ready';\nconst tsconfigRootDir = process.cwd();\nconsole.log(i18n, i18nKey, tsconfigRootDir);\n`,
      "unicorn/name-replacements",
      jsOptions,
    );
  });

  it("unicorn/string-content: reports configured ASCII replacements", async () => {
    await expectLintError(
      `const message = 'ready ${rightArrowText} done';\nconsole.log(message);\n`,
      "unicorn/string-content",
      jsOptions,
    );
  });

  it("unicorn/consistent-destructuring: stays disabled for mixed property access patterns", async () => {
    await expectNoLintError(
      `export function describeUser(user) {\n\tconst { name } = user;\n\treturn name + user.name;\n}\n`,
      "unicorn/consistent-destructuring",
      jsOptions,
    );
  });

  it("unicorn/no-keyword-prefix: stays disabled for keyword-prefixed names", async () => {
    await expectNoLintError(
      `const newValue = 'ready';\nconsole.log(newValue);\n`,
      "unicorn/no-keyword-prefix",
      jsOptions,
    );
  });

  it("unicorn/no-unused-properties: stays disabled for partially used object shapes", async () => {
    await expectNoLintError(
      `const user = { id: '1', name: 'Ada' };\nconsole.log(user.id);\n`,
      "unicorn/no-unused-properties",
      jsOptions,
    );
  });

  it("unicorn/consistent-json-file-read: stays disabled for JSON files read as buffers", async () => {
    await expectNoLintError(
      `import fs from 'node:fs/promises';\n\nexport const data = JSON.parse(await fs.readFile('data.json'));\n`,
      "unicorn/consistent-json-file-read",
      jsOptions,
    );
  });

  it("unicorn/require-post-message-target-origin: stays disabled for non-window postMessage APIs", async () => {
    await expectNoLintError(
      `const channel = new BroadcastChannel('events');\nchannel.postMessage({ ready: true });\n`,
      "unicorn/require-post-message-target-origin",
      jsOptions,
    );
  });
});
