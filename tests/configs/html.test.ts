import prettierConfig from "@cravingmaker/prettier-config";
import { ESLint } from "eslint";
import { format } from "prettier";
import { describe, expect, it } from "vitest";

import { describeFile } from "./describe-file.js";
import { createConfig } from "../../dist/index.mjs";
import { html } from "../../src/configs/plugins/html/index.js";
import { expectLintError, expectNoLintError } from "../utilities.js";

const htmlOptions = { filePath: "index.html" } as const;
const closingRule = "@html-eslint/require-closing-tags";
const publicConfig = await createConfig();
const reporter = new ESLint({
  overrideConfig: publicConfig,
  overrideConfigFile: true,
});
const fixer = new ESLint({
  fix: true,
  overrideConfig: publicConfig,
  overrideConfigFile: true,
});

describe("html feature", () => {
  it("parses and lints HTML files with a plugin registered for them only", async () => {
    // A layout rule that Prettier covers, turned back on.
    const configs = html({ overrides: { "@html-eslint/indent": "warn" } });
    const eslint = new ESLint({
      overrideConfig: configs,
      overrideConfigFile: true,
    });

    expect(
      configs.map((config) => {
        return config.name;
      }),
    ).toEqual(["@cravingmaker/eslint-config/html/rules"]);
    expect(
      await Promise.all([
        describeFile(eslint, "index.html", "@html-eslint/indent"),
        describeFile(eslint, "src/example.js", "@html-eslint/indent"),
      ]),
    ).toEqual([
      { language: "@/js", plugins: ["@", "@html-eslint"], severity: 1 },
      { language: "@/js", plugins: ["@"], severity: undefined },
    ]);
  });
});

describe("html rules", () => {
  it("preserves custom-element end tags through repeated fixes and formatting", async () => {
    const source = "<my-element></my-element>\n<p>After</p>\n";
    const [reported] = await reporter.lintText(source, htmlOptions);
    expect(reported.fatalErrorCount).toBe(0);
    expect(
      reported.messages.filter(({ ruleId }) => {
        return ruleId === closingRule;
      }),
    ).toEqual([]);
    const [first] = await fixer.lintText(source, htmlOptions);
    const formatted = await format(first.output ?? source, {
      ...prettierConfig,
      parser: "html",
    });
    const [second] = await fixer.lintText(formatted, htmlOptions);
    const finalText = await format(second.output ?? formatted, {
      ...prettierConfig,
      parser: "html",
    });
    expect([first.fatalErrorCount, second.fatalErrorCount]).toEqual([0, 0]);
    expect(finalText).toBe(formatted);
    expect(finalText).toContain("<my-element></my-element>\n<p>After</p>");
    expect(second.output).toBeUndefined();
  });

  it.each([
    ["<my-element />\n<p>After</p>\n", "unexpected"],
    ["<my-element><p>Inside</p>\n", "missing"],
  ])("requires manual boundary review for %s", async (source, messageId) => {
    const [result] = await reporter.lintText(source, htmlOptions);
    expect(result.fatalErrorCount).toBe(0);
    const messages = result.messages.filter(({ ruleId }) => {
      return ruleId === closingRule;
    });
    expect(messages).toEqual([
      expect.objectContaining({ messageId, severity: 1 }),
    ]);
    expect(messages[0]?.fix).toBeUndefined();
    expect(messages[0]?.suggestions).toBeUndefined();
    const [fixed] = await fixer.lintText(source, htmlOptions);
    expect(fixed.output ?? source).toContain(source.trim());
  });

  it("retains void-element self-closing fixes", async () => {
    const [result] = await reporter.lintText("<br>\n", htmlOptions);
    const message = result.messages.find(({ ruleId }) => {
      return ruleId === closingRule;
    });
    expect(message).toMatchObject({
      messageId: "missingSelf",
      ruleId: closingRule,
      severity: 1,
    });
    expect(message?.fix).toBeDefined();
    const [fixed] = await fixer.lintText("<br>\n", htmlOptions);
    expect(fixed.fatalErrorCount).toBe(0);
    expect(fixed.output).toContain("<br />");
  });

  it("@html-eslint/no-extra-spacing-tags: leaves spacing between attributes to Prettier", async () => {
    await expectNoLintError(
      `<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<title>Home</title>\n</head>\n<body>\n\t<div id="app"  class="root">Hello</div>\n</body>\n</html>\n`,
      "@html-eslint/no-extra-spacing-tags",
      htmlOptions,
    );
  });

  it("@html-eslint/require-attrs: reports missing required image attributes", async () => {
    await expectLintError(
      `<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<title>Home</title>\n</head>\n<body>\n\t<img src="hero.png" />\n</body>\n</html>\n`,
      "@html-eslint/require-attrs",
      htmlOptions,
    );
  });

  it("@html-eslint/no-restricted-attr-values: reports script URLs in navigation attributes", async () => {
    await expectLintError(
      `<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<title>Home</title>\n</head>\n<body>\n\t<a href="javascript:alert('x')">Open</a>\n</body>\n</html>\n`,
      "@html-eslint/no-restricted-attr-values",
      htmlOptions,
    );
  });
});
