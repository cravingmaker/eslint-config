import type { Context } from "../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { functional } from "../../src/configs/functional.js";
import { defaultContext } from "../../src/context.js";
import { typescriptFiles } from "../../src/globs.js";
import { expectLintError } from "../utilities.js";

type RuleEntries = Readonly<Record<string, readonly unknown[]>>;

const typedContext: Context = {
  ...defaultContext,
  typeAware: { files: typescriptFiles, ignores: ["**/*.d.ts"] },
};
const tsOptions = {
  filePath: "tests/utilities.ts",
  tsTypeChecked: true,
} as const;

async function getRules(
  eslint: ESLint,
  filePath: string,
): Promise<RuleEntries | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    { readonly rules?: RuleEntries } | undefined;
  return config?.rules;
}
// The severity of a rule in the configuration for a file, or `undefined` when it is not set.
async function getSeverity(
  eslint: ESLint,
  filePath: string,
  ruleId: string,
): Promise<unknown> {
  const rules = new Map(
    Object.entries((await getRules(eslint, filePath)) ?? {}),
  );
  return rules.get(ruleId)?.[0];
}

describe("functional feature", () => {
  it("turns off the rules that need type information", async () => {
    const eslint = new ESLint({
      overrideConfig: functional(),
      overrideConfigFile: true,
    });
    const rules = await getRules(eslint, "src/example.ts");

    expect(rules?.["functional/prefer-immutable-types"]).toEqual([0]);
    expect(rules?.["functional/readonly-type"]).toEqual([0]);
  });

  it("turns them on in the type-aware scope when typed linting is on", async () => {
    const eslint = new ESLint({
      overrideConfig: functional({}, typedContext),
      overrideConfigFile: true,
    });
    const severities = await Promise.all([
      getSeverity(eslint, "src/example.ts", "functional/readonly-type"),
      getSeverity(eslint, "src/example.d.ts", "functional/readonly-type"),
      getSeverity(eslint, "src/example.js", "functional/readonly-type"),
    ]);

    expect(severities).toEqual([2, 0, 0]);
  });

  it("keeps the type-aware block within its files and below its overrides", async () => {
    const eslint = new ESLint({
      overrideConfig: functional(
        {
          files: ["app/**"],
          overrides: { "functional/prefer-immutable-types": "warn" },
        },
        typedContext,
      ),
      overrideConfigFile: true,
    });
    const [inside, outside] = await Promise.all([
      getRules(eslint, "app/example.ts"),
      getRules(eslint, "lib/example.ts"),
    ]);

    expect(inside?.["functional/prefer-immutable-types"]).toEqual([1]);
    expect(inside?.["functional/readonly-type"]?.[0]).toBe(2);
    expect(outside?.["functional/readonly-type"]).toBeUndefined();
  });
});

describe("functional rules", () => {
  it("functional/no-let: reports reassigned local bindings", async () => {
    await expectLintError(
      `let count = 0;\ncount += 1;\nconsole.log(count);\n`,
      "functional/no-let",
      tsOptions,
    );
  });

  it("functional/no-expression-statements: reports bare call expressions", async () => {
    await expectLintError(
      `function getValue(): string {\n\treturn 'ready';\n}\ngetValue();\n`,
      "functional/no-expression-statements",
      tsOptions,
    );
  });

  it("functional/readonly-type: requires readonly type literal properties", async () => {
    await expectLintError(
      `type User = Readonly<{ name: string }>;\nconst user: User = { name: 'Ada' };\nconsole.log(user);\n`,
      "functional/readonly-type",
      tsOptions,
    );
  });

  it("functional/prefer-immutable-types: reports mutable function parameters", async () => {
    await expectLintError(
      `function first(values: string[]): string {\n\treturn values[0] ?? '';\n}\nconsole.log(first(['one']));\n`,
      "functional/prefer-immutable-types",
      tsOptions,
    );
  });
});
