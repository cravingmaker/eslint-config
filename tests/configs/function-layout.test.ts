import type { Options } from "../../src/types.js";

import { ESLint } from "eslint";
import { format, resolveConfig } from "prettier";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

const documentationRule = "@cravingmaker/starred-documentation";
const paddingRule = "@stylistic/padding-line-between-statements";
const sveltePaddingRule = "@cravingmaker/svelte-function-variable-padding";
const eslint = new ESLint({
  fix: (message) => {
    return [
      documentationRule,
      paddingRule,
      "perfectionist/sort-modules",
    ].includes(message.ruleId ?? "");
  },
  overrideConfig: await createConfig({
    react: false,
    svelte: false,
    typescript: { typeChecked: false },
  }),
  overrideConfigFile: true,
});

describe("D3 function-variable padding", () => {
  it.each([
    { declaration: "const first = () => { return 1; };", padded: true },
    {
      declaration: "const first = (() => { return 1; }) as () => number;",
      padded: true,
    },
    {
      declaration: "const data = 1, first = () => { return 1; };",
      padded: true,
    },
    {
      declaration: "const object = { method: () => { return 1; } };",
      padded: false,
    },
    {
      declaration:
        "const object = ({ method: () => { return 1; } }) as object;",
      padded: false,
    },
    { declaration: "const { name } = () => { return 1; };", padded: false },
  ])(
    "uses the Svelte companion only for direct function variables: $declaration",
    async ({ declaration, padded }) => {
      const config = await createConfig({
        svelte: true,
        typescript: { typeChecked: false },
      });
      const reporter = new ESLint({
        overrideConfig: config,
        overrideConfigFile: true,
      });
      const fixer = new ESLint({
        fix: (message) => {
          return message.ruleId === sveltePaddingRule;
        },
        overrideConfig: config,
        overrideConfigFile: true,
      });
      const source = [
        '<script lang="ts">',
        declaration,
        "/**",
        " * Keep the paragraph.",
        " *",
        " * Explain a detail.",
        " */",
        "const value = 2;",
        "</script>",
        "<p>{value}</p>",
        "",
      ].join("\n");
      const [reported] = await reporter.lintText(source, {
        filePath: "src/Example.svelte",
      });
      expect(reported.fatalErrorCount).toBe(0);
      expect(
        reported.messages.filter(({ ruleId }) => {
          return ruleId === paddingRule;
        }),
      ).toEqual([]);
      expect(
        reported.messages.filter(({ ruleId }) => {
          return ruleId === sveltePaddingRule;
        }),
      ).toHaveLength(padded ? 1 : 0);
      const [first] = await fixer.lintText(source, {
        filePath: "src/Example.svelte",
      });
      expect(first.output ?? source).toBe(
        padded ? source.replace(";\n/**", ";\n\n/**") : source,
      );
      const [second] = await fixer.lintText(first.output ?? source, {
        filePath: "src/Example.svelte",
      });
      expect(second.output).toBeUndefined();
    },
  );

  it.each([
    { stylistic: false },
    { stylistic: { files: ["lib/**"] } },
    { stylistic: { ignores: ["src/**"] } },
    {
      stylistic: {
        overrides: { "@cravingmaker/svelte-function-variable-padding": "off" },
      },
    },
  ] satisfies readonly Options[])(
    "honors the Svelte companion scope and override: %j",
    async (options) => {
      const scoped = new ESLint({
        overrideConfig: await createConfig({
          ...options,
          svelte: true,
          typescript: { typeChecked: false },
        }),
        overrideConfigFile: true,
      });
      const [result] = await scoped.lintText(
        "<script>\nconst first = () => { return 1; };\nconst second = 2;\n</script>\n<p>{second}</p>\n",
        { filePath: "src/Example.svelte" },
      );
      expect(result.fatalErrorCount).toBe(0);
      expect(
        result.messages.filter(({ ruleId }) => {
          return ruleId === sveltePaddingRule;
        }),
      ).toEqual([]);
    },
  );
  it("converges on a comparator suggested by Unicorn through block-body fixes and formatting", async () => {
    const config = await createConfig({ typescript: { typeChecked: false } });
    const reporter = new ESLint({
      overrideConfig: config,
      overrideConfigFile: true,
    });
    const fixer = new ESLint({
      fix: true,
      overrideConfig: config,
      overrideConfigFile: true,
    });
    const source = "export const values = [3, 1, 2].toSorted();\n";
    const [reported] = await reporter.lintText(source, {
      filePath: "src/example.js",
    });
    const suggestion = reported.messages
      .find(({ ruleId }) => {
        return ruleId === "unicorn/require-array-sort-compare";
      })
      ?.suggestions?.find(({ fix }) => {
        return fix.text.includes("=>");
      });
    if (typeof suggestion === "undefined") {
      expect.fail(
        "Expected an actual Unicorn comparator suggestion using an arrow.",
      );
    }
    const suggested =
      source.slice(0, suggestion.fix.range[0]) +
      suggestion.fix.text +
      source.slice(suggestion.fix.range[1]);
    const [first] = await fixer.lintText(suggested, {
      filePath: "src/example.js",
    });
    const options = await resolveConfig("tests/policy/example.js");
    const formatted = await format(first.output ?? suggested, {
      ...options,
      filepath: "src/example.js",
    });
    const [second] = await fixer.lintText(formatted, {
      filePath: "src/example.js",
    });
    expect(second.output).toBeUndefined();
    expect(second.messages).toEqual([]);
    expect(formatted).toContain("return ");
    expect(
      await format(formatted, { ...options, filepath: "src/example.js" }),
    ).toBe(formatted);
  });
  it.each([
    { stylistic: false },
    { stylistic: { files: ["lib/**"] } },
    { stylistic: { ignores: ["src/**"] } },
    {
      stylistic: {
        overrides: { "@stylistic/padding-line-between-statements": "off" },
      },
    },
  ] satisfies readonly Options[])(
    "honors feature scope and overrides: %j",
    async (options) => {
      const scoped = new ESLint({
        overrideConfig: await createConfig({
          ...options,
          typescript: { typeChecked: false },
        }),
        overrideConfigFile: true,
      });
      const [result] = await scoped.lintText(
        "const first = () => { return 1; };\nexport const second = first;\n",
        { filePath: "src/example.js" },
      );
      expect(result.fatalErrorCount).toBe(0);
      expect(
        result.messages.filter(({ ruleId }) => {
          return ruleId === paddingRule;
        }),
      ).toEqual([]);
    },
  );
  it.each([
    "const first = () => { return 1; };",
    "let first = async () => { return 1; };",
    "const first = function first() { return this.value; };",
    "export const first = () => { return 1; };",
    "const data = 1, first = () => { return 1; };",
    "const first = (() => { return 1; }) as () => number;",
    "export const first = (((() => { return 1; }) as () => number) satisfies () => number)!;",
  ])("separates the following documentation after %s", async (declaration) => {
    const source = `${declaration}\n/**\n * Describe the value.\n *\n * Keep this paragraph.\n */\nconst value = 2;\n`;
    const [result] = await eslint.lintText(source, {
      filePath: "src/example.ts",
    });
    expect(result.fatalErrorCount).toBe(0);
    expect(result.output).toBe(source.replace(";\n/**", ";\n\n/**"));
    const [second] = await eslint.lintText(result.output ?? source, {
      filePath: "src/example.ts",
    });
    expect(second.output).toBeUndefined();
    expect(
      second.messages.filter(({ ruleId }) => {
        return ruleId === paddingRule;
      }),
    ).toEqual([]);
  });

  it.each([
    "const first = 1;\nconst second = 2;\n",
    "const { name } = () => { return 1; };\nconst second = 2;\n",
    "const object = { method: () => { return 1; } };\nconst second = 2;\n",
    "const object = ({ method: () => { return 1; } }) as object;\nconst second = 2;\n",
    "const object = { method() { const inner = () => { return 1; }; } };\nconst second = 2;\n",
    "const object = ({ method() { const inner = () => { return 1; }; } }) as object;\nconst second = 2;\n",
    "const value = consume(() => { return 1; });\nconst second = 2;\n",
    "const value = (consume(() => { return 1; })) as number;\nconst second = 2;\n",
    "const first = () => { return 1; };\n",
    "const outer = () => { const last = () => { return 1; }; };\n",
  ])(
    "leaves ordinary data and final declarations alone: %s",
    async (source) => {
      const [result] = await eslint.lintText(source, {
        filePath: "src/example.ts",
      });
      expect(result.fatalErrorCount).toBe(0);
      expect(result.output).toBeUndefined();
    },
  );

  it("separates nested function variables before the following statement", async () => {
    const source =
      "const outer = () => {\n  const inner = () => { return 1; };\n  return inner();\n};\n";
    const [result] = await eslint.lintText(source, {
      filePath: "src/example.js",
    });
    expect(result.output).toBe(source.replace(";\n  return", ";\n\n  return"));
  });
});

describe("D3 starred documentation", () => {
  it.each([
    { unicorn: false },
    { unicorn: { files: ["lib/**"] } },
    { unicorn: { ignores: ["src/**"] } },
    {
      unicorn: { overrides: { "@cravingmaker/starred-documentation": "off" } },
    },
  ] satisfies readonly Options[])(
    "honors the Unicorn scope and overrides: %j",
    async (options) => {
      const scoped = new ESLint({
        overrideConfig: await createConfig({
          ...options,
          typescript: { typeChecked: false },
        }),
        overrideConfigFile: true,
      });
      const [result] = await scoped.lintText(
        "/**\nBare documentation.\n*/\nexport const value = 1;\n",
        { filePath: "src/example.js" },
      );
      expect(result.fatalErrorCount).toBe(0);
      expect(
        result.messages.filter(({ ruleId }) => {
          return ruleId === documentationRule;
        }),
      ).toEqual([]);
    },
  );

  it("preserves CRLF paragraph breaks and relative example indentation", async () => {
    const source =
      "/**\r\nDescribe the value.\r\n\r\n@example\r\n  readValue();\r\n*/\r\nexport const value = 1;\r\n";
    const [result] = await eslint.lintText(source, {
      filePath: "src/example.js",
    });
    expect(result.output).toBe(
      "/**\r\n * Describe the value.\r\n *\r\n * @example\r\n *   readValue();\r\n */\r\nexport const value = 1;\r\n",
    );
  });

  it("keeps declaration ordering while allowing documentation paragraphs across groups", async () => {
    const source =
      "class Zebra {}\n/**\n * Document Alpha.\n *\n * Keep the paragraph.\n */\nclass Alpha {}\n/**\n * Document a generator.\n *\n * Keep this paragraph too.\n */\nfunction* values() { yield 1; }\nexport { Alpha, values, Zebra };\n";
    const [first] = await eslint.lintText(source, {
      filePath: "src/example.js",
    });
    const text = first.output ?? source;
    expect(text.indexOf("class Alpha")).toBeLessThan(
      text.indexOf("class Zebra"),
    );
    expect(text).toContain(" * Keep the paragraph.");
    expect(text).toContain(" * Keep this paragraph too.");
    const [second] = await eslint.lintText(text, {
      filePath: "src/example.js",
    });
    expect(second.output).toBeUndefined();
    expect(
      second.messages.filter(({ ruleId }) => {
        return ruleId === "perfectionist/sort-modules";
      }),
    ).toEqual([]);
  });
  it.each(["src/example.js", "src/example.ts"])(
    "requires stars while preserving paragraphs and ordinary comments in %s",
    async (filePath) => {
      const source =
        "// Ordinary line.\n// Another ordinary line.\n/* Ordinary block.\nKeep its layout. */\n/**\nDescribe the function.\n\nExplain a detail.\n*/\nexport const value = () => { return 1; };\n";
      const [result] = await eslint.lintText(source, { filePath });
      expect(result.fatalErrorCount).toBe(0);
      expect(result.output).toBe(
        source.replace(
          "/**\nDescribe the function.\n\nExplain a detail.\n*/",
          "/**\n * Describe the function.\n *\n * Explain a detail.\n */",
        ),
      );
      const options = await resolveConfig("tests/policy/example.js");
      const formatted = await format(result.output ?? source, {
        ...options,
        filepath: filePath,
      });
      const [second] = await eslint.lintText(formatted, { filePath });
      expect(second.output).toBeUndefined();
    },
  );

  it("proves global starred-block style also converts ordinary grouped line comments", async () => {
    const plugin = await import("@stylistic/eslint-plugin");
    const native = new ESLint({
      fix: true,
      overrideConfig: [
        {
          plugins: { "@stylistic": plugin.default },
          rules: {
            "@stylistic/multiline-comment-style": ["error", "starred-block"],
          },
        },
      ],
      overrideConfigFile: true,
    });
    const [result] = await native.lintText(
      "// Ordinary line.\n// Another line.\nconst value = 1;\n",
    );
    expect(result.output).toContain("/*");
  });
});
