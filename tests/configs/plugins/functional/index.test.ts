import type { Context } from "../../../../src/types.js";

import { execFile } from "node:child_process";
import process from "node:process";
import { promisify } from "node:util";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../../../dist/index.mjs";
import { functional } from "../../../../src/configs/plugins/functional/index.js";
import { defaultContext } from "../../../../src/context.js";
import { typescriptFiles } from "../../../../src/globs.js";
import { expectLintError, expectNoLintError } from "../../../support/lint.js";
import { getResolvedRules as getRules } from "../../../support/resolved-config.js";

const typedContext: Context = {
  ...defaultContext,
  typeAware: [[...typescriptFiles, "!**/*.d.ts"]],
};
const untypedContext: Context = { ...defaultContext, typeAware: undefined };
const tsOptions = {
  filePath: "tests/support/lint.ts",
  typeChecked: true,
} as const;
// Options of `functional/prefer-immutable-types` that the policy does not have.
const deepParameters = {
  enforcement: "None",
  ignoreInferredTypes: true,
  parameters: { enforcement: "ReadonlyDeep" },
} as const;

// The readonly-type severity for a file, or `undefined` when it is not set.
const getReadonlyTypeSeverity = async (
  eslint: ESLint,
  filePath: string,
): Promise<unknown> => {
  const rules = new Map(
    Object.entries((await getRules(eslint, filePath)) ?? {}),
  );
  return rules.get("functional/readonly-type")?.[0];
};

describe("functional feature", () => {
  it("lets consumers restore tacit preference only where type information is available", async () => {
    const eslint = new ESLint({
      overrideConfig: functional(
        {
          overrides: {
            "functional/prefer-tacit": [
              "warn",
              { checkMemberExpressions: false },
            ],
          },
        },
        typedContext,
      ),
      overrideConfigFile: true,
    });
    const configs = await Promise.all(
      ["src/example.ts", "src/example.js", "src/example.d.ts"].map(
        async (filePath) => {
          return await getRules(eslint, filePath);
        },
      ),
    );
    expect(
      configs.map((rules) => {
        return Number(rules?.["functional/prefer-tacit"]?.[0]);
      }),
    ).toEqual([1, 0, 0]);
  });

  it("turns off the rules that need type information without typed linting", async () => {
    const eslint = new ESLint({
      overrideConfig: functional({}, untypedContext),
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
      getReadonlyTypeSeverity(eslint, "src/example.ts"),
      getReadonlyTypeSeverity(eslint, "src/example.d.ts"),
      getReadonlyTypeSeverity(eslint, "src/example.js"),
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

    expect(inside?.["functional/prefer-immutable-types"]?.[0]).toBe(1);
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
      getReadonlyTypeSeverity(eslint, "src/example.ts"),
      getReadonlyTypeSeverity(eslint, "src/example.d.ts"),
      getReadonlyTypeSeverity(eslint, "lib/example.ts"),
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
      overrideConfig: functional(
        {
          overrides: {
            "functional/prefer-immutable-types": ["error", deepParameters],
          },
        },
        untypedContext,
      ),
      overrideConfigFile: true,
    });
    const rules = await Promise.all([
      getRules(eslint, "src/example.ts"),
      getRules(eslint, "src/example.js"),
    ]);

    expect(
      rules.map((entries) => {
        return entries?.["functional/prefer-immutable-types"];
      }),
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
      rules.map((entries) => {
        return entries?.["functional/readonly-type"];
      }),
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
      rules.map((entries) => {
        return entries?.["functional/prefer-readonly-type"];
      }),
    ).toEqual([[2, implicit], undefined, undefined]);
  });
});

describe("functional rules", () => {
  it("allows a block-bodied wrapper for a single-argument callback", async () => {
    await expectNoLintError(
      "const double = (value: number): number => { return value * 2; }; export const values = [1, 2, 3].map((value) => { return double(value); });",
      "functional/prefer-tacit",
      tsOptions,
    );
  });

  it("keeps explicit forwarding arrows instead of passing array callback arguments", async () => {
    const code = `const multiply = (value, factor = 2) => { return value * factor; };
export const values = [1, 2, 3].map((value) => { return multiply(value); });`;
    await expectNoLintError(code, "functional/prefer-tacit", tsOptions);
    await expectLintError(
      code.replace("(value) => { return multiply(value); }", "multiply"),
      "unicorn/no-array-callback-reference",
      tsOptions,
    );
    const eslint = new ESLint({
      fix: true,
      overrideConfig: await createConfig({ react: false, svelte: false }),
      overrideConfigFile: true,
    });
    const [result] = await eslint.lintText(code, {
      filePath: tsOptions.filePath,
    });
    expect(result.fatalErrorCount).toBe(0);
    const fixed = result.output ?? code;
    expect(fixed).toContain("multiply(value)");
    // eslint-disable-next-line @typescript-eslint/strict-void-return -- execFile's callback form also returns the child process.
    const execute = promisify(execFile);
    const forwarded = await execute(process.execPath, [
      "--input-type=module",
      "--eval",
      `${fixed}\nconsole.log(JSON.stringify(values));`,
    ]);
    const direct = await execute(process.execPath, [
      "--input-type=module",
      "--eval",
      `${code.replace("(value) => { return multiply(value); }", "multiply")}\nconsole.log(JSON.stringify(values));`,
    ]);
    expect(forwarded.stdout.trim()).toBe("[2,4,6]");
    expect(direct.stdout.trim()).toBe("[0,2,6]");
  });

  it("functional/readonly-type: requires readonly type literal properties", async () => {
    await expectLintError(
      `type User = Readonly<{ name: string }>;\nconst user: User = { name: 'Ada' };\nconsole.log(user);\n`,
      "functional/readonly-type",
      tsOptions,
    );
  });
});
