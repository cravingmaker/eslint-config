/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import type { Linter } from "eslint";

import process from "node:process";

import { describe, expect, it } from "vitest";

import { createConfig } from "../dist/index.mjs";

async function getJavaScriptRules(
  isTypeChecked: boolean,
): Promise<NonNullable<Linter.Config["rules"]>> {
  return await getRules("**/*.{js,mjs,cjs,jsx,mjsx}", isTypeChecked);
}
// The rules of every block for `glob`, merged in order as written, before ESLint normalizes them.
async function getRules(
  glob: string,
  isTypeChecked: boolean,
): Promise<NonNullable<Linter.Config["rules"]>> {
  const config = await createConfig({
    tsconfigRootDir: process.cwd(),
    tsTypeChecked: isTypeChecked,
  });
  return Object.fromEntries(
    config
      .filter((entry) => entry.files?.includes(glob) === true)
      .flatMap((entry) => Object.entries(entry.rules ?? {})),
  );
}
async function getTypeScriptRules(
  isTypeChecked: boolean,
): Promise<NonNullable<Linter.Config["rules"]>> {
  return await getRules("**/*.{ts,mts,cts,tsx,mtsx}", isTypeChecked);
}

describe("overlapping rule policy", () => {
  it("uses the intended rule authority for JavaScript overlaps", async () => {
    const rules = await getJavaScriptRules(false);

    expect(rules["arrow-body-style"]).toEqual(["error", "as-needed"]);
    expect(rules["unicorn/consistent-arrow-return-style"]).toBeUndefined();

    expect(rules["no-duplicate-imports"]).toEqual([
      "off",
      { allowSeparateTypeImports: false, includeExports: false },
    ]);
    expect(rules["import-x/no-duplicates"]).toBe("error");

    expect(rules["sort-imports"]).toEqual([
      "off",
      {
        allowSeparatedGroups: false,
        ignoreCase: false,
        ignoreDeclarationSort: false,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
      },
    ]);
    expect(rules["perfectionist/sort-imports"]).toBeDefined();

    expect(rules["sort-keys"]).toEqual([
      "off",
      "asc",
      {
        allowLineSeparatedGroups: false,
        caseSensitive: true,
        ignoreComputedKeys: false,
        minKeys: 2,
        natural: false,
      },
    ]);
    expect(rules["perfectionist/sort-objects"]).toBeDefined();

    expect(rules["n/file-extension-in-import"]).toBe("off");
    expect(rules["import-x/extensions"]).toBeDefined();

    expect(rules["n/no-extraneous-import"]).toBe("off");
    expect(rules["import-x/no-extraneous-dependencies"]).toBe("error");

    expect(rules["n/no-missing-import"]).toBe("off");
    expect(rules["import-x/no-unresolved"]).toBe("error");

    expect(rules["n/no-process-exit"]).toBe("off");
    expect(rules["unicorn/no-process-exit"]).toBe("error");

    expect(rules["n/prefer-node-protocol"]).toBe("off");
    expect(rules["unicorn/prefer-node-protocol"]).toBe("error");

    expect(rules["no-empty-character-class"]).toBe("off");
    expect(rules["regexp/no-empty-character-class"]).toBe("error");

    expect(rules["no-invalid-regexp"]).toBe("off");
    expect(rules["regexp/no-invalid-regexp"]).toBe("error");

    expect(rules["no-useless-backreference"]).toBe("off");
    expect(rules["regexp/no-useless-backreference"]).toBe("error");

    expect(rules["no-unused-vars"]).toEqual(["off", expect.any(Object)]);
    expect(rules["unused-imports/no-unused-vars"]).toEqual([
      "error",
      expect.any(Object),
    ]);
  });

  it("prefers TypeScript-aware extension rules in TypeScript files", async () => {
    const rules = await getTypeScriptRules(true);

    expect(rules["no-unused-private-class-members"]).toBe("off");
    expect(rules["@typescript-eslint/no-unused-private-class-members"]).toBe(
      "error",
    );

    expect(rules["no-unused-expressions"]).toBe("off");
    expect(rules["@typescript-eslint/no-unused-expressions"]).toEqual([
      "error",
      expect.any(Object),
    ]);

    expect(rules["no-array-constructor"]).toBe("off");
    expect(rules["@typescript-eslint/no-array-constructor"]).toBe("error");

    expect(rules["class-methods-use-this"]).toBe("off");
    expect(rules["@typescript-eslint/class-methods-use-this"]).toBeDefined();

    expect(rules["default-param-last"]).toBe("off");
    expect(rules["@typescript-eslint/default-param-last"]).toBe("error");

    expect(rules["no-loop-func"]).toBe("error");
    expect(rules["@typescript-eslint/no-loop-func"]).toBeUndefined();

    expect(rules["no-shadow"]).toBe("off");
    expect(rules["@typescript-eslint/no-shadow"]).toBeDefined();

    expect(rules["no-use-before-define"]).toBe("off");
    expect(rules["@typescript-eslint/no-use-before-define"]).toBeDefined();

    expect(rules["max-params"]).toBe("off");
    expect(rules["@typescript-eslint/max-params"]).toBeDefined();

    expect(rules["prefer-destructuring"]).toBe("off");
    expect(rules["@typescript-eslint/prefer-destructuring"]).toBeDefined();

    expect(rules["@typescript-eslint/member-ordering"]).toEqual([
      "off",
      expect.any(Object),
    ]);
    expect(rules["perfectionist/sort-classes"]).toBeDefined();
  });
});
