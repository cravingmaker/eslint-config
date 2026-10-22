import { readFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

// One property of the generated `RuleOptions` interface, such as `'eqeqeq'?: Linter.RuleEntry<Eqeqeq>`.
const ruleOptionPattern = /^ {2}'(?<ruleId>[^']+)'\?: Linter\.RuleEntry</gmu;
const declarationsPath = fileURLToPath(
  new URL("../../src/typegen.d.ts", import.meta.url),
);

describe("generated rule types", () => {
  it("compile without errors when declaration files are checked", () => {
    const program = ts.createProgram([declarationsPath], {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      noEmit: true,
      skipLibCheck: false,
      strict: true,
      target: ts.ScriptTarget.ESNext,
      types: [],
    });
    const errors = ts
      .getPreEmitDiagnostics(program)
      .filter((diagnostic) => {
        return diagnostic.file?.fileName === declarationsPath;
      })
      .map((diagnostic) => {
        return ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      });

    expect(errors).toEqual([]);
  });

  it("declare every rule the configuration sets, including optional integrations", async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The generated file has a fixed path.
    const declarations = await readFile(
      new URL("../../src/typegen.d.ts", import.meta.url),
      "utf8",
    );
    const declaredRuleIds = new Set(
      declarations.matchAll(ruleOptionPattern).map((match) => {
        return match.groups?.ruleId;
      }),
    );
    const config = await createConfig({
      express: true,
      react: { refresh: "generic" },
      svelte: true,
      typescript: { tsconfigRootDir: process.cwd(), typeChecked: true },
    });
    const configuredRuleIds = new Set(
      config.flatMap((entry) => {
        return Object.keys(entry.rules ?? {});
      }),
    );
    const undeclaredRuleIds = configuredRuleIds
      .values()
      .filter((ruleId) => {
        return !declaredRuleIds.has(ruleId);
      })
      .toArray()
      .toSorted((left, right) => {
        return left.localeCompare(right);
      });

    expect(configuredRuleIds.size).toBeGreaterThan(0);
    expect(undeclaredRuleIds).toEqual([]);
  });
});
