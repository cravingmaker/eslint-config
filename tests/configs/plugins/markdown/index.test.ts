import type { Linter } from "eslint";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../../../dist/index.mjs";
import { markdown } from "../../../../src/configs/plugins/markdown/index.js";
import { describeFile } from "../../../support/describe-file.js";
import { expectNoLintError } from "../../../support/lint.js";

const mdOptions = { filePath: "test.md" } as const;
const temporarilyDisabled = [
  "markdown/no-bare-urls",
  "markdown/no-invalid-label-refs",
  "markdown/no-missing-label-refs",
  "markdown/no-reference-like-urls",
  "markdown/no-space-in-emphasis",
] as const;
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
  it.each([
    "[https://example.com]\n",
    "[test@example.com]\n",
    "[www.example.com]\n",
    "<www.example.com>\n",
    "[Example](https://example.com)\n",
    "<https://example.com>\n",
    "```text\n[https://example.com]\n```\n",
  ])(
    "lints the GFM autolink regression without throwing: %s",
    async (source) => {
      const [result] = await reporter.lintText(source, mdOptions);
      expect(result.fatalErrorCount).toBe(0);
      expect(result.messages).toEqual([]);
      const [fixed] = await fixer.lintText(source, mdOptions);
      expect(fixed.fatalErrorCount).toBe(0);
      const [second] = await fixer.lintText(fixed.output ?? source, mdOptions);
      expect(second.output).toBeUndefined();
      expect(second.messages).toEqual([]);
    },
  );

  it("retains independent diagnostics alongside bracketed autolinks", async () => {
    const [result] = await reporter.lintText(
      "# Title\n\n### Skipped\n\n[https://example.com]\n\n![](image.png)\n",
      mdOptions,
    );
    expect(result.fatalErrorCount).toBe(0);
    expect(
      result.messages.map(({ ruleId }) => {
        return ruleId;
      }),
    ).toEqual(["markdown/heading-increment", "markdown/require-alt-text"]);
  });

  it("accepts the temporary loss of unique diagnostics without substituting other owners", async () => {
    const [result] = await reporter.lintText(
      "https://example.com\n\n[text][missing]\n\n** bold **\n",
      mdOptions,
    );
    expect(result.fatalErrorCount).toBe(0);
    expect(result.messages).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated configuration as any.
    const config = (await reporter.calculateConfigForFile(
      mdOptions.filePath,
    )) as {
      readonly rules: Readonly<
        Record<string, readonly [Linter.Severity, ...unknown[]]>
      >;
    };
    const rules = new Map(Object.entries(config.rules));
    expect(
      temporarilyDisabled.map((ruleId) => {
        return rules.get(ruleId)?.[0];
      }),
    ).toEqual(
      temporarilyDisabled.map(() => {
        return 0;
      }),
    );
    expect(
      [...rules].filter(([ruleId, entry]) => {
        return ruleId.startsWith("markdown/") && entry[0] !== 0;
      }),
    ).toHaveLength(14);
  });

  it("retains GFM tables, YAML front matter, and math", async () => {
    const [result] = await reporter.lintText(
      "---\ntitle: Example\n---\n\n## Section\n\n| First | Second |\n| --- | --- |\n| ~~value~~ | $x$ |\n\n$$\ny = x + 1\n$$\n",
      mdOptions,
    );
    expect(result.fatalErrorCount).toBe(0);
    expect(result.messages).toEqual([]);
  });

  it("allows an explicit no-bare-urls override on non-triggering input", async () => {
    const eslint = new ESLint({
      overrideConfig: await createConfig({
        markdown: { overrides: { "markdown/no-bare-urls": "warn" } },
      }),
      overrideConfigFile: true,
    });
    const [result] = await eslint.lintText("https://example.com\n", mdOptions);
    expect(result.fatalErrorCount).toBe(0);
    expect(result.messages).toEqual([
      expect.objectContaining({ ruleId: "markdown/no-bare-urls", severity: 1 }),
    ]);
    expect(result.messages[0]?.fix).toBeDefined();
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
