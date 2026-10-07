import type { Context } from "../../src/types.js";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { node } from "../../src/configs/node.js";
import { defaultContext } from "../../src/context.js";
import { typescriptFiles } from "../../src/globs.js";
import { expectLintError } from "../utilities.js";

type RuleEntries = Readonly<Record<string, readonly unknown[]>>;

const typedContext: Context = {
  ...defaultContext,
  typeAware: { files: typescriptFiles, ignores: ["**/*.d.ts"] },
};
const svelteContext: Context = {
  ...defaultContext,
  svelteComponents: [["**/*.svelte", "!**/generated/**"]],
};

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

describe("node feature", () => {
  it("turns n/no-sync off in TypeScript files without type information", async () => {
    const untyped = new ESLint({
      overrideConfig: node(),
      overrideConfigFile: true,
    });
    const typed = new ESLint({
      overrideConfig: node({}, typedContext),
      overrideConfigFile: true,
    });
    const severities = await Promise.all([
      getSeverity(untyped, "src/example.js", "n/no-sync"),
      getSeverity(untyped, "src/example.ts", "n/no-sync"),
      getSeverity(typed, "src/example.ts", "n/no-sync"),
      getSeverity(typed, "src/example.d.ts", "n/no-sync"),
    ]);

    expect(severities).toEqual([2, 0, 2, 0]);
  });

  it("turns n/no-sync off in Svelte components, which have no type information", async () => {
    const eslint = new ESLint({
      overrideConfig: node(
        {},
        { ...typedContext, svelteComponents: svelteContext.svelteComponents },
      ),
      overrideConfigFile: true,
    });

    expect(await getSeverity(eslint, "src/Component.svelte", "n/no-sync")).toBe(
      0,
    );
  });
});

describe("n rules", () => {
  it("n/no-process-env: reports disallowed process.env variables", async () => {
    await expectLintError(
      `console.log(process.env.PORT);\n`,
      "n/no-process-env",
      { filePath: "test.js" },
    );
  });

  it("n/no-sync: reports sync APIs below the module root", async () => {
    await expectLintError(
      `import fs from 'node:fs';\nfunction loadFixture(path) {\n\treturn fs.readFileSync(path, 'utf8');\n}\nconsole.log(loadFixture('fixture.txt'));\n`,
      "n/no-sync",
      { filePath: "test.js" },
    );
  });

  it("n/no-deprecated-api: reports deprecated Node.js APIs", async () => {
    await expectLintError(
      `import { Buffer } from 'node:buffer';\nconst value = new Buffer(1);\nconsole.log(value);\n`,
      "n/no-deprecated-api",
      { filePath: "test.js" },
    );
  });
});
