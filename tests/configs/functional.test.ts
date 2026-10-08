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
  typeAware: [[...typescriptFiles, "!**/*.d.ts"]],
};
const tsOptions = {
  filePath: "tests/utilities.ts",
  tsTypeChecked: true,
} as const;
// Options of `functional/prefer-immutable-types` that the policy does not have.
const deepParameters = {
  enforcement: "None",
  ignoreInferredTypes: true,
  parameters: { enforcement: "ReadonlyDeep" },
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

  it("keeps the type-aware block within the type-aware scope, whatever its ignores bring back", async () => {
    // The feature lints `src/` only, declaration files included, which the scope leaves out.
    const eslint = new ESLint({
      overrideConfig: functional(
        { ignores: ["**/*", "!src/**"] },
        typedContext,
      ),
      overrideConfigFile: true,
    });
    const severities = await Promise.all([
      getSeverity(eslint, "src/example.ts", "functional/readonly-type"),
      getSeverity(eslint, "src/example.d.ts", "functional/readonly-type"),
      getSeverity(eslint, "lib/example.ts", "functional/readonly-type"),
    ]);

    expect(severities).toEqual([2, 0, undefined]);
  });

  it("applies an override that turns on a rule that needs type information in the type-aware scope only", async () => {
    const eslint = new ESLint({
      overrideConfig: functional(
        {
          overrides: {
            "functional/no-let": "warn",
            "functional/prefer-immutable-types": ["error", deepParameters],
          },
        },
        typedContext,
      ),
      overrideConfigFile: true,
    });
    const [typed, declaration, script] = await Promise.all([
      getRules(eslint, "src/example.ts"),
      getRules(eslint, "src/example.d.ts"),
      getRules(eslint, "src/example.js"),
    ]);

    expect(typed?.["functional/prefer-immutable-types"]).toEqual([
      2,
      deepParameters,
    ]);
    expect(declaration?.["functional/prefer-immutable-types"]).toEqual([0]);
    expect(script?.["functional/prefer-immutable-types"]).toEqual([0]);
    // An override of a rule that needs no type information applies in every file.
    expect(script?.["functional/no-let"]?.[0]).toBe(1);
  });

  it("does not apply such an override without typed linting", async () => {
    const eslint = new ESLint({
      overrideConfig: functional({
        overrides: {
          "functional/prefer-immutable-types": ["error", deepParameters],
        },
      }),
      overrideConfigFile: true,
    });
    const rules = await Promise.all([
      getRules(eslint, "src/example.ts"),
      getRules(eslint, "src/example.js"),
    ]);

    expect(
      rules.map((entries) => entries?.["functional/prefer-immutable-types"]),
    ).toEqual([[0], [0]]);
  });

  it("applies an override that turns such a rule off in every file", async () => {
    const eslint = new ESLint({
      overrideConfig: functional(
        { overrides: { "functional/readonly-type": ["off", "generic"] } },
        typedContext,
      ),
      overrideConfigFile: true,
    });
    const rules = await Promise.all([
      getRules(eslint, "src/example.ts"),
      getRules(eslint, "src/example.d.ts"),
      getRules(eslint, "src/example.js"),
    ]);

    expect(
      rules.map((entries) => entries?.["functional/readonly-type"]),
    ).toEqual([
      [0, "generic"],
      [0, "generic"],
      [0, "generic"],
    ]);
  });

  it("counts a deprecated rule that needs type information, which the policy does not set", async () => {
    // With `checkImplicit`, the rule asks for the type of a constant without a type annotation.
    const implicit = { checkImplicit: true };
    const eslint = new ESLint({
      overrideConfig: functional(
        {
          overrides: { "functional/prefer-readonly-type": ["error", implicit] },
        },
        typedContext,
      ),
      overrideConfigFile: true,
    });
    const rules = await Promise.all([
      getRules(eslint, "src/example.ts"),
      getRules(eslint, "src/example.d.ts"),
      getRules(eslint, "src/example.js"),
    ]);

    expect(
      rules.map((entries) => entries?.["functional/prefer-readonly-type"]),
    ).toEqual([[2, implicit], undefined, undefined]);
  });
});

describe("functional rules", () => {
  it("functional/readonly-type: requires readonly type literal properties", async () => {
    await expectLintError(
      `type User = Readonly<{ name: string }>;\nconst user: User = { name: 'Ada' };\nconsole.log(user);\n`,
      "functional/readonly-type",
      tsOptions,
    );
  });
});
