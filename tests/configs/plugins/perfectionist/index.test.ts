import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../../../dist/index.mjs";
import { expectLintError, expectNoLintError } from "../../../support/lint.js";

const jsOptions = { filePath: "test.js" } as const;
const tsOptions = {
  filePath: "tests/support/lint.ts",
  tsTypeChecked: true,
} as const;

describe("perfectionist rules", () => {
  it("perfectionist/sort-arrays: sorts const-asserted array literals only", async () => {
    await expectLintError(
      `const names = ['beta', 'alpha'] as const;\nconsole.log(names);\n`,
      "perfectionist/sort-arrays",
      tsOptions,
    );
  });

  it("perfectionist/sort-imports: fixes imports into the groups of the policy, with node: imports on their own and paths sorted without their leading dots", async () => {
    const code = [
      'import { shared } from "../shared.js";',
      'import { z } from "zod";',
      'import { config } from "./config.js";',
      'import { readFile } from "node:fs/promises";',
      'import type { Linter } from "eslint";',
      "",
      "export type Config = Linter.Config;",
      "console.log(shared, z, config, readFile);",
      "",
    ].join("\n");
    // Only the fixes of this rule, so that the output shows its order alone.
    const eslint = new ESLint({
      fix: (message) => {
        return message.ruleId === "perfectionist/sort-imports";
      },
      overrideConfig: await createConfig({
        typescript: { typeChecked: false },
      }),
      overrideConfigFile: true,
    });
    const [result] = await eslint.lintText(code, {
      filePath: "src/example.ts",
    });

    await expectLintError(code, "perfectionist/sort-imports", {
      filePath: "src/example.ts",
    });
    expect(result.output).toBe(
      [
        'import type { Linter } from "eslint";',
        "",
        'import { readFile } from "node:fs/promises";',
        "",
        'import { z } from "zod";',
        "",
        'import { config } from "./config.js";',
        'import { shared } from "../shared.js";',
        "",
        "export type Config = Linter.Config;",
        "console.log(shared, z, config, readFile);",
        "",
      ].join("\n"),
    );
    expect(
      result.messages.map(({ ruleId }) => {
        return ruleId;
      }),
    ).not.toContain("perfectionist/sort-imports");
  });

  it("perfectionist/sort-intersection-types: sorts intersection members by configured type groups", async () => {
    await expectLintError(
      `type Entity = { id: string } & string;\nconst entity = 'id' as Entity;\nconsole.log(entity);\n`,
      "perfectionist/sort-intersection-types",
      tsOptions,
    );
  });

  it("perfectionist/sort-union-types: sorts union members by configured type groups", async () => {
    await expectLintError(
      `type Value = { id: string } | string;\nconst value = 'id' as Value;\nconsole.log(value);\n`,
      "perfectionist/sort-union-types",
      tsOptions,
    );
  });

  it("perfectionist/sort-variable-declarations: stays disabled in favor of one-var", async () => {
    await expectNoLintError(
      `const beta = 2, alpha = 1;\nconsole.log(beta, alpha);\n`,
      "perfectionist/sort-variable-declarations",
      jsOptions,
    );
  });
});
