import type { Options } from "../../../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../../../dist/index.mjs";

const ruleId = "security/detect-invisible-characters";
const characters = [
  { codePoint: 0x31_64, escaped: String.raw`\u3164`, name: "U+3164" },
  { codePoint: 0xff_a0, escaped: String.raw`\uFFA0`, name: "U+FFA0" },
];
const eslint = new ESLint({
  overrideConfig: await createConfig({ typescript: { typeChecked: false } }),
  overrideConfigFile: true,
});
const reviewRules: readonly string[] = [
  "security/detect-non-literal-fs-filename",
  "security/detect-object-injection",
] as const;
const reviewReports = async (
  engine: ESLint,
  code: string,
  filePath: string,
) => {
  expect(await engine.isPathIgnored(filePath)).toBe(false);
  const [result] = await engine.lintText(code, { filePath });
  expect(result.fatalErrorCount, JSON.stringify(result.messages)).toBe(0);
  return result.messages.filter(({ ruleId: id }) => {
    return typeof id === "string" && reviewRules.includes(id);
  });
};

describe.each([
  "src/example.js",
  "fixture.test.js",
  "fixture.spec.ts",
  "tests/helper.ts",
])("Security review signals in %s", (filePath) => {
  it("warns about reviewed dynamic fixture paths and computed keys", async () => {
    const messages = await reviewReports(
      eslint,
      'import { mkdtemp, readFile } from "node:fs/promises";\nimport path from "node:path";\nconst directory = await mkdtemp("fixture-");\nconst file = path.join(directory, "data.json");\nawait readFile(file, "utf8");\nconst fixtures = { dev: 1, prod: 2 };\nconst key = "dev";\nexport const value = fixtures[key];\n',
      filePath,
    );
    expect(messages).toEqual([
      expect.objectContaining({ line: 5, ruleId: reviewRules[0], severity: 1 }),
      expect.objectContaining({ line: 8, ruleId: reviewRules[1], severity: 1 }),
    ]);
    expect(
      messages.every((message) => {
        return (
          typeof message.fix === "undefined" &&
          typeof message.suggestions === "undefined"
        );
      }),
    ).toBe(true);
  });

  it("keeps unrelated unreviewed operations visible after justified local exceptions", async () => {
    const messages = await reviewReports(
      eslint,
      'import { mkdtemp, readFile } from "node:fs/promises";\nimport os from "node:os";\nimport path from "node:path";\nconst directory = await mkdtemp(path.join(os.tmpdir(), "fixture-"));\nconst file = path.join(directory, "data.json");\n// eslint-disable-next-line security/detect-non-literal-fs-filename -- The fixed fixture filename is inside a newly created temporary directory.\nawait readFile(file, "utf8");\nawait readFile(process.env.INPUT_FILE, "utf8");\nconst record = { dev: 1, prod: 2 };\nconst key = "dev";\n// eslint-disable-next-line security/detect-object-injection -- The key is selected from the fixed fixture keys.\nexport const fixture = record[key];\nconst externalKey = process.env.INPUT_KEY;\nexport const other = record[externalKey];\n',
      filePath,
    );
    expect(messages).toEqual([
      expect.objectContaining({ line: 8, ruleId: reviewRules[0], severity: 1 }),
      expect.objectContaining({
        line: 14,
        ruleId: reviewRules[1],
        severity: 1,
      }),
    ]);
  });

  it("does not report literal paths or literal property access", async () => {
    expect(
      await reviewReports(
        eslint,
        'import { readFile } from "node:fs/promises";\nawait readFile("fixtures/data.json", "utf8");\nconst record = { dev: 1 };\nexport const value = record.dev;\nexport const literal = record["dev"];\n',
        filePath,
      ),
    ).toEqual([]);
  });
});

describe("Security review feature boundaries", () => {
  it.each([
    { security: false },
    { security: { files: ["src/**"] } },
    { security: { ignores: ["**/*.test.js"] } },
    {
      security: {
        overrides: {
          "security/detect-non-literal-fs-filename": "off",
          "security/detect-object-injection": "off",
        },
      },
    },
  ] satisfies readonly Options[])(
    "preserves disabled, narrowed, ignored, and overridden scopes: %j",
    async (options) => {
      const engine = new ESLint({
        overrideConfig: await createConfig({
          typescript: { typeChecked: false },
          ...options,
        }),
        overrideConfigFile: true,
      });
      expect(
        await reviewReports(
          engine,
          'import { readFile } from "node:fs/promises";\nawait readFile(process.env.INPUT_FILE, "utf8");\nconst key = process.env.INPUT_KEY;\nexport const value = record[key];\n',
          "fixture.test.js",
        ),
      ).toEqual([]);
    },
  );
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
