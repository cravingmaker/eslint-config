import { describe, it } from "vitest";

import { expectLintError, expectNoLintError } from "../../utilities.js";

const jsOptions = { filePath: "test.js" } as const;
const rightArrowText = String.fromCodePoint(45, 62);

describe("unicorn rules", () => {
  it("unicorn/no-for-each: reports Array#forEach usage from the enabled plugin preset", async () => {
    await expectLintError(
      `const values = [1, 2, 3];\nvalues.forEach((value) => {\n\tconsole.log(value);\n});\n`,
      "unicorn/no-for-each",
      jsOptions,
    );
  });

  it("unicorn/prefer-node-protocol: reports bare Node.js builtin imports from the enabled plugin preset", async () => {
    await expectLintError(
      `import fs from 'fs';\nconsole.log(fs);\n`,
      "unicorn/prefer-node-protocol",
      jsOptions,
    );
  });

  it("unicorn/filename-case: reports filenames outside the configured cases", async () => {
    await expectLintError(
      `export const value = 1;\n`,
      "unicorn/filename-case",
      { filePath: "bad_name.js" },
    );
  });

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

  it("unicorn/name-replacements: reports unapproved abbreviations", async () => {
    await expectLintError(
      `const btn = 'save';\nconsole.log(btn);\n`,
      "unicorn/name-replacements",
      jsOptions,
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
      `const user = { name: 'Ada' };\nconst name = user.name;\nconsole.log(user, name);\n`,
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

  it("unicorn/consistent-json-file-read: stays disabled for explicit JSON file reading", async () => {
    await expectNoLintError(
      `const payload = Buffer.from('{"ready":true}');\nconst value = JSON.parse(payload.toString());\nconsole.log(value);\n`,
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

  it("modern replacement rules remain enabled", async () => {
    await expectLintError(
      `const values = [];\nvalues.push(1);\nvalues.push(2);\nconsole.log(values);\n`,
      "unicorn/prefer-single-call",
      jsOptions,
    );

    await expectLintError(
      `function isArray(value) {\n\treturn value instanceof Array;\n}\nconsole.log(isArray([]));\n`,
      "unicorn/no-instanceof-builtins",
      jsOptions,
    );

    await expectLintError(
      `const values = [1, 2, 3];\nconst tail = values.slice(1, values.length);\nconsole.log(tail);\n`,
      "unicorn/no-unnecessary-slice-end",
      jsOptions,
    );
  });
});
