/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { readFile } from "node:fs/promises";
import process from "node:process";

import { describe, expect, it } from "vitest";

import { createConfig } from "../dist/index.mjs";

// One property of the generated `RuleOptions` interface, such as `'eqeqeq'?: Linter.RuleEntry<Eqeqeq>`.
const ruleOptionPattern = /^ {2}'(?<ruleId>[^']+)'\?: Linter\.RuleEntry</gmu;

describe("generated rule types", () => {
  it("declare every rule the configuration sets, including optional integrations", async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The generated file has a fixed path.
    const declarations = await readFile(
      new URL("../src/typegen.d.ts", import.meta.url),
      "utf8",
    );
    const declaredRuleIds = new Set(
      declarations
        .matchAll(ruleOptionPattern)
        .map((match) => match.groups?.ruleId),
    );
    const config = await createConfig({
      reactRefreshVariant: "generic",
      tsconfigRootDir: process.cwd(),
      tsTypeChecked: true,
    });
    const configuredRuleIds = new Set(
      config.flatMap((entry) => Object.keys(entry.rules ?? {})),
    );
    const undeclaredRuleIds = configuredRuleIds
      .values()
      .filter((ruleId) => !declaredRuleIds.has(ruleId))
      .toArray()
      .toSorted((left, right) => left.localeCompare(right));

    expect(configuredRuleIds.size).toBeGreaterThan(0);
    expect(undeclaredRuleIds).toEqual([]);
  });
});
