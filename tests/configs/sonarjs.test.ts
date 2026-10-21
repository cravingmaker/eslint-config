import { ESLint } from "eslint";
import pluginSonarjs from "eslint-plugin-sonarjs";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";
import { typeAwareRuleIds } from "../../src/configs/plugins/sonarjs/rules-type-aware.js";
import { sonarjsRules } from "../../src/configs/plugins/sonarjs/rules.js";
import { expectLintError, expectNoLintError } from "../utilities.js";

const sortRuleIds = (ids: readonly string[]): readonly string[] => {
  return ids.toSorted((left, right) => {
    return left.localeCompare(right);
  });
};

const requiresTypeChecking = (documentation: object | undefined): boolean => {
  return (
    typeof documentation !== "undefined" &&
    "requiresTypeChecking" in documentation &&
    documentation.requiresTypeChecking === true
  );
};

describe("SonarJS policy", () => {
  it("classifies every current non-deprecated rule", () => {
    expect(sortRuleIds(Object.keys(sonarjsRules))).toEqual(
      sortRuleIds(
        Object.entries(pluginSonarjs.rules)
          .filter(([, rule]) => {
            return (
              typeof rule.meta?.deprecated === "undefined" ||
              rule.meta.deprecated === false
            );
          })
          .map(([name]) => {
            return `sonarjs/${name}`;
          }),
      ),
    );
  });

  it("guards every rule that requires type information, including disabled alternatives", () => {
    expect(sortRuleIds(typeAwareRuleIds)).toEqual(
      sortRuleIds(
        Object.entries(pluginSonarjs.rules)
          .filter(([, rule]) => {
            return requiresTypeChecking(rule.meta?.docs);
          })
          .map(([name]) => {
            return `sonarjs/${name}`;
          }),
      ),
    );
  });

  it.each(["example.js", "example.ts"])(
    "owns duplicate switch branches in %s",
    async (filePath) => {
      const source = `export function select(value) {
  switch (value) {
    case 1: {
      prepare();
      return finish();
    }
    case 2: {
      prepare();
      return finish();
    }
    default: {
      return fallback();
    }
  }
}
`;
      await expectLintError(source, "sonarjs/no-duplicated-branches", {
        filePath,
      });
      await expectNoLintError(source, "unicorn/no-duplicate-if-branches", {
        filePath,
      });
    },
  );

  it("reports exclusive tests", async () => {
    await expectLintError(
      'describe.only("suite", () => { it("case", () => { expect(1).toBe(1); }); });\n',
      "sonarjs/no-exclusive-tests",
      { filePath: "example.test.js" },
    );
  });

  it("reports insecure certificate verification", async () => {
    await expectLintError(
      'import https from "node:https";\nhttps.request({ rejectUnauthorized: false });\n',
      "sonarjs/unverified-certificate",
      { filePath: "example.js" },
    );
  });

  it("keeps overridden typed alternatives off without type information", async () => {
    const eslint = new ESLint({
      overrideConfig: await createConfig({
        sonarjs: {
          overrides: {
            "sonarjs/deprecation": "error",
            "sonarjs/no-try-promise": "warn",
          },
        },
        typescript: { typeChecked: false },
      }),
      overrideConfigFile: true,
    });

    await expect(
      eslint.calculateConfigForFile("src/example.ts"),
    ).resolves.toHaveProperty(["rules", "sonarjs/deprecation"], [0]);
    const [result] = await eslint.lintText(
      "export const value = Promise.resolve(1);\n",
      { filePath: "src/example.ts" },
    );
    expect(result.fatalErrorCount).toBe(0);
  });
});
