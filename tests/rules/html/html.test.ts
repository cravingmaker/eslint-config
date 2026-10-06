import { describe, it } from "vitest";

import { expectLintError } from "../../utilities.js";

const htmlOptions = { filePath: "index.html" } as const;

describe("html rules", () => {
  it("@html-eslint/no-extra-spacing-tags: reports extra spacing between attributes", async () => {
    await expectLintError(
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
