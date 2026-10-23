import { describe, expect, it } from "vitest";

import { expectLintError, expectNoLintError } from "./lint.js";

/*
Files that no rule can report: code that does not parse, a path in the global ignores, and a path that no block of the configuration matches. A negative assertion about them would pass without linting anything.
*/
const unlintable = [
  {
    code: "const = 1;\n",
    description: "code that does not parse",
    filePath: "src/example.js",
    reason: "Expected src/example.js to parse.",
  },
  {
    code: "debugger;\n",
    description: "a path in the global ignores",
    filePath: "dist/example.js",
    reason: "Expected ESLint to lint dist/example.js, but it ignores the file.",
  },
  {
    code: "debugger;\n",
    description: "a path that no configuration matches",
    filePath: "src/example.cts",
    reason: "Expected ESLint to lint src/example.cts, but it ignores the file.",
  },
] as const;

describe("lint assertions", () => {
  it("keeps typed linting opt-in with the public option vocabulary", async () => {
    const code = "export const value: number = 1;\n";
    const filePath = "outside-project.ts";
    await expectNoLintError(code, "no-debugger", { filePath });
    await expect(
      expectNoLintError(code, "no-debugger", { filePath, typeChecked: true }),
    ).rejects.toThrow(`Expected ${filePath} to parse.`);
  });

  it("selects Refresh variants while keeping all frameworks enabled", async () => {
    const code =
      "export const VERSION = 1;\nexport const Component = () => <p />;\n";
    const ruleId = "react-refresh/only-export-components";
    await expectLintError(code, ruleId, { filePath: "example.tsx" });
    await expectNoLintError(code, ruleId, {
      filePath: "example.tsx",
      refresh: "vite",
    });
  });

  it("uses the active unused-variable owner in its documented example", async () => {
    await expectLintError("const a = 1;\n", "unused-imports/no-unused-vars", {
      filePath: "test.js",
    });
  });

  it("pass when the rule fires and when it does not", async () => {
    await expect(
      expectLintError("debugger;\n", "no-debugger", {
        filePath: "src/example.js",
      }),
    ).resolves.toBeUndefined();
    await expect(
      expectNoLintError("export const value = 1;\n", "no-debugger", {
        filePath: "src/example.js",
      }),
    ).resolves.toBeUndefined();
  });

  it.each(unlintable)(
    "fail on $description, whatever the assertion",
    async ({ code, filePath, reason }) => {
      await expect(
        expectLintError(code, "no-debugger", { filePath }),
      ).rejects.toThrow(reason);
      await expect(
        expectNoLintError(code, "no-debugger", { filePath }),
      ).rejects.toThrow(reason);
    },
  );
});
