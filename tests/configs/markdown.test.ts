import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { describeFile } from "./describe-file.js";
import { markdown } from "../../src/configs/markdown.js";
import { expectLintError, expectNoLintError } from "../utilities.js";

const mdOptions = { filePath: "test.md" } as const;

describe("markdown feature", () => {
  it("registers @eslint/markdown everywhere and lints Markdown files as GitHub Flavored Markdown", async () => {
    const eslint = new ESLint({
      overrideConfig: markdown({ overrides: { "markdown/no-html": "warn" } }),
      overrideConfigFile: true,
    });

    expect(
      await Promise.all([
        describeFile(eslint, "README.md", "markdown/no-html"),
        describeFile(eslint, "src/example.js", "markdown/no-html"),
      ]),
    ).toEqual([
      { language: "markdown/gfm", plugins: ["@", "markdown"], severity: 1 },
      { language: "@/js", plugins: ["@", "markdown"], severity: undefined },
    ]);
  });
});

describe("markdown rules", () => {
  it("markdown/fenced-code-language: reports fenced code blocks without a language", async () => {
    await expectLintError(
      "```\nconst x = 1;\n```\n",
      "markdown/fenced-code-language",
      mdOptions,
    );
  });

  it("markdown/heading-increment: reports headings that skip a level", async () => {
    await expectLintError(
      "# Title\n\n### Skipped\n",
      "markdown/heading-increment",
      mdOptions,
    );
  });

  it("markdown/no-duplicate-definitions: reports duplicate link definitions", async () => {
    await expectLintError(
      "[foo]: https://a.com\n[foo]: https://b.com\n",
      "markdown/no-duplicate-definitions",
      mdOptions,
    );
  });

  it("markdown/no-multiple-h1: reports multiple H1 headings", async () => {
    await expectLintError(
      "# First\n\n# Second\n",
      "markdown/no-multiple-h1",
      mdOptions,
    );
  });

  it("markdown/no-reversed-media-syntax: reports reversed image syntax", async () => {
    await expectLintError(
      "(url)[text]\n",
      "markdown/no-reversed-media-syntax",
      mdOptions,
    );
  });

  it("markdown/fenced-code-meta: stays disabled", async () => {
    await expectNoLintError(
      "```js\nconst x = 1;\n```\n",
      "markdown/fenced-code-meta",
      mdOptions,
    );
  });

  it("markdown/no-duplicate-headings: stays disabled", async () => {
    await expectNoLintError(
      "# Title\n\n## Section\n\n## Section\n",
      "markdown/no-duplicate-headings",
      mdOptions,
    );
  });
});
