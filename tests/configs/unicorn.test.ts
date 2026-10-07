import { describe, it } from "vitest";

import { expectLintError, expectNoLintError } from "../utilities.js";

const jsOptions = { filePath: "test.js" } as const;
const rightArrowText = String.fromCodePoint(45, 62);

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
