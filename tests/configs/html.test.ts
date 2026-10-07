import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { describeFile } from "./describe-file.js";
import { html } from "../../src/configs/html.js";
import { expectLintError, expectNoLintError } from "../utilities.js";

const htmlOptions = { filePath: "index.html" } as const;

describe("html feature", () => {
  it("parses and lints HTML files with a plugin registered for them only", async () => {
    // A layout rule that Prettier covers, turned back on.
    const configs = html({ overrides: { "@html-eslint/indent": "warn" } });
    const eslint = new ESLint({
      overrideConfig: configs,
      overrideConfigFile: true,
    });

    expect(configs.map((config) => config.name)).toEqual([
      "@cravingmaker/eslint-config/html/rules",
    ]);
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
  it("@html-eslint/no-extra-spacing-tags: leaves spacing between attributes to Prettier", async () => {
    await expectNoLintError(
      `<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<title>Home</title>\n</head>\n<body>\n\t<div id="app"  class="root">Hello</div>\n</body>\n</html>\n`,
      "@html-eslint/no-extra-spacing-tags",
      htmlOptions,
    );
  });

  it("@html-eslint/require-doctype: reports missing document type declarations", async () => {
    await expectLintError(
      `<html lang="en">\n<head>\n\t<title>Home</title>\n</head>\n<body>\n\t<p>Hello</p>\n</body>\n</html>\n`,
      "@html-eslint/require-doctype",
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
