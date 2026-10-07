import { describe, it } from "vitest";

import { expectLintError, expectNoLintError } from "../../utilities.js";

// Fixtures with type annotations use .tsx. The hooks rules also apply to .js, .jsx, and .ts files,
// where custom hooks live.
const tsxOptions = { filePath: "test.tsx" } as const;
const sourceFilePaths = ["test.js", "test.jsx", "test.ts", "test.tsx"] as const;
const moduleFilePaths = ["test.js", "test.ts"] as const;

describe("react-hooks rules", () => {
  describe("react-hooks/rules-of-hooks", () => {
    it.each(sourceFilePaths)(
      "reports a custom hook that calls a hook conditionally in %s",
      async (filePath) => {
        const code = [
          "function useValue(value) { return value; }",
          "export function useToggle(isOn) {",
          "	if (isOn) { useValue(true); }",
          "	return null;",
          "}",
        ].join("\n");
        await expectLintError(code, "react-hooks/rules-of-hooks", {
          filePath,
        });
      },
    );

    it.each(sourceFilePaths)(
      "does not report a custom hook that calls a hook unconditionally in %s",
      async (filePath) => {
        const code = [
          "function useValue(value) { return value; }",
          "export function useToggle(isOn) {",
          "	useValue(isOn);",
          "	return null;",
          "}",
        ].join("\n");
        await expectNoLintError(code, "react-hooks/rules-of-hooks", {
          filePath,
        });
      },
    );

    it("reports a hook called inside a conditional branch", async () => {
      const code = [
        "function useState(v: unknown) { return v; }",
        "export function Component({ show }: { show: boolean }) {",
        "	if (show) { useState(0); }",
        "	return null;",
        "}",
      ].join("\n");
      await expectLintError(code, "react-hooks/rules-of-hooks", tsxOptions);
    });

    it("does not report a hook called unconditionally at the top level", async () => {
      const code = [
        "function useState(v: unknown) { return v; }",
        "export function Component() {",
        "	useState(0);",
        "	return null;",
        "}",
      ].join("\n");
      await expectNoLintError(code, "react-hooks/rules-of-hooks", tsxOptions);
    });
  });

  describe("react-hooks/exhaustive-deps", () => {
    it("reports a missing dependency in a useEffect call", async () => {
      const code = [
        "import { useEffect } from 'react';",
        "export function Component({ count }: { count: number }) {",
        "	useEffect(() => { console.log(count); }, []);",
        "	return null;",
        "}",
      ].join("\n");
      await expectLintError(code, "react-hooks/exhaustive-deps", tsxOptions);
    });

    it("does not report when all dependencies are listed", async () => {
      const code = [
        "import { useEffect } from 'react';",
        "export function Component({ count }: { count: number }) {",
        "	useEffect(() => { console.log(count); }, [count]);",
        "	return null;",
        "}",
      ].join("\n");
      await expectNoLintError(code, "react-hooks/exhaustive-deps", tsxOptions);
    });

    it.each(moduleFilePaths)(
      "reports a missing dependency in a custom hook in %s",
      async (filePath) => {
        const code = [
          "import { useEffect } from 'react';",
          "export function useLogger(message) {",
          "	useEffect(() => { console.log(message); }, []);",
          "}",
        ].join("\n");
        await expectLintError(code, "react-hooks/exhaustive-deps", {
          filePath,
        });
      },
    );
  });

  describe("Meta-internal rules stay disabled", () => {
    const validCode = "export function useCounter() { return 0; }";

    it("react-hooks/fbt: stays off (depends on Meta FBT library)", async () => {
      await expectNoLintError(validCode, "react-hooks/fbt", tsxOptions);
    });

    it("react-hooks/todo: stays off (Meta-internal tracking)", async () => {
      await expectNoLintError(validCode, "react-hooks/todo", tsxOptions);
    });

    it("react-hooks/rule-suppression: stays off (Meta-internal mechanism)", async () => {
      await expectNoLintError(
        validCode,
        "react-hooks/rule-suppression",
        tsxOptions,
      );
    });
  });
});
