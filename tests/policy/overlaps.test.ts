/* eslint-disable security/detect-non-literal-fs-filename -- The project is written to a temporary directory. */

import type { Linter } from "eslint";
import type { Options, Rules, TypeScriptOptions } from "../../src/types.js";

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";
import { featureOf, overlaps } from "../../src/overlaps.js";

type RuleEntries = Readonly<Record<string, RuleEntry>>;
// A rule's settings as ESLint resolves them: the severity as a number, then the options.
type RuleEntry = readonly [Linter.Severity, ...unknown[]];

const prefix = "@cravingmaker/eslint-config/";
const baseOptions = {
  projectRootDirectory: process.cwd(),
  typescript: { tsconfigRootDir: process.cwd(), typeChecked: true },
} as const satisfies Options;
// The options that turn each owner off.
const withoutOwner = {
  imports: { ...baseOptions, imports: false },
  perfectionist: { ...baseOptions, perfectionist: false },
  regexp: { ...baseOptions, regexp: false },
  unicorn: { ...baseOptions, unicorn: false },
  unusedImports: { ...baseOptions, unusedImports: false },
} as const satisfies Readonly<Record<keyof typeof overlaps, Options>>;
const optionsWithoutOwner = new Map<string, Options>(
  Object.entries(withoutOwner),
);
// The options that limit each owner to `src/` and leave its generated files out.
const ownerScope = {
  files: ["src/**"],
  ignores: ["**/*.generated.*"],
} as const;
const withNarrowedOwner = {
  imports: { ...baseOptions, imports: ownerScope },
  perfectionist: { ...baseOptions, perfectionist: ownerScope },
  regexp: { ...baseOptions, regexp: ownerScope },
  unicorn: { ...baseOptions, unicorn: ownerScope },
  unusedImports: { ...baseOptions, unusedImports: ownerScope },
} as const satisfies Readonly<Record<keyof typeof overlaps, Options>>;
const optionsWithNarrowedOwner = new Map<string, Options>(
  Object.entries(withNarrowedOwner),
);
const cases = Object.entries(overlaps).flatMap(([owner, replacedRules]) =>
  Object.entries(replacedRules).map(([replaced, ownerRules]) => ({
    owner,
    ownerRules,
    replaced,
  })),
);
// The replaced rules that the TypeScript feature holds. `typescript.overridesTypeAware` can set
// them as well, and apply in the type-aware scope only.
const typescriptCases = cases.filter(
  ({ replaced }) => featureOf(replaced) === "typescript",
);
// Typed linting that leaves the scripts out, as a project does whose tsconfig does not include
// them.
const withoutScripts = {
  ignoresTypeAware: ["scripts/**"],
  typeChecked: true,
} as const satisfies TypeScriptOptions;
/*
A sample for each of those rules, which the rule and a rule of its owner both report: a variable
that nothing uses, a method before a field, and overloads with another member between them.
*/
const samples = [
  {
    code: "const unused = 1;\nexport {};\n",
    fileName: "unused.ts",
    ownerRule: "unused-imports/no-unused-vars",
    replaced: "@typescript-eslint/no-unused-vars",
  },
  {
    code: "export class Counter {\n  increment(): number {\n    return this.count + 1;\n  }\n\n  count = 0;\n}\n",
    fileName: "members.ts",
    ownerRule: "perfectionist/sort-classes",
    replaced: "@typescript-eslint/member-ordering",
  },
  {
    code: "export type Reader = {\n  read(name: string): string;\n  close(): void;\n  read(id: number): string;\n};\n",
    fileName: "overloads.ts",
    ownerRule: "perfectionist/sort-object-types",
    replaced: "@typescript-eslint/adjacent-overload-signatures",
  },
] as const;
/*
What `overridesTypeAware` sets such a rule to, while its owner lints only `src/` and typed linting
leaves out the `legacy` folders, and the severity that the rule then has in four files: one that
both cover, one that only typed linting covers, one that only the owner lints, and one that
neither does.
*/
const narrowedSeverities = [
  { entry: "error", severities: [2, 2, 0, 2] },
  { entry: "off", severities: [0, 0, 0, 2] },
] as const;
const narrowedCases = typescriptCases.flatMap((testCase) =>
  narrowedSeverities.map((expected) => ({ ...testCase, ...expected })),
);

/*
A project whose tsconfig includes `src/` only. Each sample is in `src/` and in `scripts/`, which
typed linting leaves out with `withoutScripts`.
*/
const projectDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-overlaps-"),
);
await Promise.all(
  [
    ["package.json", JSON.stringify({ name: "fixture", type: "module" })],
    [
      "tsconfig.json",
      JSON.stringify({
        compilerOptions: {
          module: "nodenext",
          noEmit: true,
          strict: true,
          target: "es2024",
        },
        include: ["src"],
      }),
    ],
    ...samples.flatMap(({ code, fileName }) => [
      [`scripts/${fileName}`, code],
      [`src/${fileName}`, code],
    ]),
  ].map(async ([fileName = "", content = ""]) => {
    const filePath = path.join(projectDirectory, fileName);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }),
);

afterAll(async () => {
  await rm(projectDirectory, { force: true, recursive: true });
});

/*
The rules among `ruleIds` that report each of `filePaths` in the project, in the order of
`filePaths`, with `typescript` as the options of the TypeScript feature. The manifest of the
project declares no framework.
*/
async function getReported(
  typescript: TypeScriptOptions,
  filePaths: readonly string[],
  ruleIds: readonly string[],
): Promise<ReadonlyArray<readonly string[]>> {
  const eslint = new ESLint({
    cwd: projectDirectory,
    overrideConfig: await createConfig({
      projectRootDirectory: projectDirectory,
      typescript: { ...typescript, tsconfigRootDir: projectDirectory },
    }),
    overrideConfigFile: true,
  });
  const results = await eslint.lintFiles([...filePaths]);
  const messagesByPath = new Map(
    results.map(({ filePath, messages }) => [
      path.relative(projectDirectory, filePath).replaceAll(path.sep, "/"),
      messages,
    ]),
  );

  // A file that does not parse has one message without a rule, so no rule reports it.
  expect(
    results
      .flatMap(({ messages }) => messages)
      .filter(({ fatal }) => fatal === true)
      .map(({ message }) => message),
  ).toEqual([]);
  return filePaths.map((filePath) =>
    ruleIds.filter((ruleId) =>
      (messagesByPath.get(filePath) ?? []).some(
        (message) => message.ruleId === ruleId,
      ),
    ),
  );
}
// The rules that ESLint resolves for `filePath` with `options`.
async function getRules(
  options: Options,
  filePath: string,
): Promise<ReadonlyMap<string, RuleEntry>> {
  const eslint = new ESLint({
    overrideConfig: await createConfig(options),
    overrideConfigFile: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    { readonly rules?: RuleEntries } | undefined;
  return new Map(Object.entries(config?.rules ?? {}));
}
// The severity of each of `ruleIds` that ESLint resolves for `filePath` with `options`.
async function getSeverities(
  options: Options,
  filePath: string,
  ruleIds: readonly string[],
): Promise<ReadonlyArray<Linter.Severity | undefined>> {
  const rules = await getRules(options, filePath);
  return ruleIds.map((ruleId) => rules.get(ruleId)?.[0]);
}
// The severity of `ruleId` that ESLint resolves for each of `filePaths` with `options`.
async function getSeverityByFile(
  options: Options,
  filePaths: readonly string[],
  ruleId: string,
): Promise<ReadonlyArray<Linter.Severity | undefined>> {
  const severities = await Promise.all(
    filePaths.map(
      async (filePath) => await getSeverities(options, filePath, [ruleId]),
    ),
  );
  return severities.map(([severity]) => severity);
}
// `options` with `typescript` added to the typed linting of `baseOptions`.
function withTypeScript(
  options: Options,
  typescript: TypeScriptOptions,
): Options {
  return {
    ...options,
    typescript: { ...baseOptions.typescript, ...typescript },
  };
}

describe("overlap table", () => {
  it.each(cases)(
    "$owner replaces $replaced, and turning $owner off brings it back",
    async ({ owner, ownerRules, replaced }) => {
      const filePath =
        featureOf(replaced) === "typescript"
          ? "src/example.ts"
          : "src/example.js";
      const [ownerOn, ownerOff] = await Promise.all([
        getRules(baseOptions, filePath),
        getRules(optionsWithoutOwner.get(owner) ?? {}, filePath),
      ]);

      expect(ownerOn.get(replaced)?.[0]).toBe(0);
      expect(
        ownerRules.some((ruleId) => (ownerOn.get(ruleId)?.[0] ?? 0) !== 0),
      ).toBe(true);
      expect(ownerOff.get(replaced)?.[0]).toBe(2);
      expect(ownerRules.filter((ruleId) => ownerOff.has(ruleId))).toEqual([]);
    },
  );

  it.each(cases)(
    "$owner replaces $replaced only in its own files, without its ignores",
    async ({ owner, ownerRules, replaced }) => {
      const extension = featureOf(replaced) === "typescript" ? "ts" : "js";
      const options = optionsWithNarrowedOwner.get(owner) ?? {};
      const [inside, outside, ignored] = await Promise.all(
        [
          `src/example.${extension}`,
          `scripts/example.${extension}`,
          `src/example.generated.${extension}`,
        ].map(async (filePath) => await getRules(options, filePath)),
      );

      expect(inside.get(replaced)?.[0]).toBe(0);
      expect(
        ownerRules.some((ruleId) => (inside.get(ruleId)?.[0] ?? 0) !== 0),
      ).toBe(true);
      expect(outside.get(replaced)?.[0]).toBe(2);
      expect(ignored.get(replaced)?.[0]).toBe(2);
      expect(
        ownerRules.filter(
          (ruleId) => outside.has(ruleId) || ignored.has(ruleId),
        ),
      ).toEqual([]);
    },
  );

  // The scripts of Svelte components get the rules of TypeScript sources, so core rules that
  // typescript-eslint replaces stay off there whether the owner is on or off.
  it.each(cases)(
    "$owner replaces $replaced in Svelte components as in TypeScript sources",
    async ({ owner, ownerRules, replaced }) => {
      const ownerOn = { ...baseOptions, svelte: true };
      const ownerOff = { ...optionsWithoutOwner.get(owner), svelte: true };
      const ruleIds = [replaced, ...ownerRules];
      const [componentOn, sourceOn, componentOff, sourceOff] =
        await Promise.all([
          getSeverities(ownerOn, "src/Component.svelte", ruleIds),
          getSeverities(ownerOn, "src/example.ts", ruleIds),
          getSeverities(ownerOff, "src/Component.svelte", ruleIds),
          getSeverities(ownerOff, "src/example.ts", ruleIds),
        ]);

      expect(componentOn[0]).toBe(0);
      expect(componentOn).toEqual(sourceOn);
      expect(componentOff).toEqual(sourceOff);
    },
  );

  it("names the feature of every replaced rule", () => {
    expect(
      cases.filter(({ replaced }) => featureOf(replaced) === undefined),
    ).toEqual([]);
  });

  it("keeps a replaced rule that the user overrides in its feature", async () => {
    const rules = await getRules(
      {
        ...baseOptions,
        javascript: { overrides: { "sort-keys": ["warn", "asc"] } },
        node: { overrides: { "n/prefer-node-protocol": "warn" } },
      },
      "src/example.js",
    );

    expect(rules.get("sort-keys")?.[0]).toBe(1);
    expect(rules.get("n/prefer-node-protocol")?.[0]).toBe(1);
    expect(rules.get("no-negated-condition")?.[0]).toBe(0);
  });
});

/*
`typescript.overrides` apply in every file of the feature, so a replaced rule that they set is
the user's everywhere. `typescript.overridesTypeAware` apply in the type-aware scope only, so a
rule that only they set is still replaced outside that scope, and in every file while typed
linting is off.
*/
describe("replaced rules in typescript.overridesTypeAware", () => {
  it("have a sample each", () => {
    expect(new Set(samples.map(({ replaced }) => replaced))).toEqual(
      new Set(typescriptCases.map(({ replaced }) => replaced)),
    );
  });

  describe.each(samples)(
    "the sample of $replaced",
    ({ fileName, ownerRule, replaced }) => {
      /*
      The rules that report the sample with `overridesTypeAware`: with typed linting off, and with
      it on, in the file that it covers and in the one that it leaves out.
      */
      const describeReports = async (
        overridesTypeAware: Readonly<Rules>,
      ): Promise<Readonly<Record<string, readonly string[]>>> => {
        const ruleIds = [replaced, ownerRule];
        const [[untyped], [inside, outside]] = await Promise.all([
          getReported({ overridesTypeAware }, [`src/${fileName}`], ruleIds),
          getReported(
            { ...withoutScripts, overridesTypeAware },
            [`src/${fileName}`, `scripts/${fileName}`],
            ruleIds,
          ),
        ]);
        return { inside, outside, untyped };
      };

      it("is reported by the rule of the owner only, without an override", async () => {
        expect(await describeReports({})).toEqual({
          inside: [ownerRule],
          outside: [ownerRule],
          untyped: [ownerRule],
        });
      });

      it('is reported by the rule of the owner only with "off", whether typed linting covers the file or not', async () => {
        expect(await describeReports({ [replaced]: "off" })).toEqual({
          inside: [ownerRule],
          outside: [ownerRule],
          untyped: [ownerRule],
        });
      });

      it('is reported by both rules with "error", but only where typed linting covers the file', async () => {
        expect(await describeReports({ [replaced]: "error" })).toEqual({
          inside: [replaced, ownerRule],
          outside: [ownerRule],
          untyped: [ownerRule],
        });
      });
    },
  );

  it.each(typescriptCases)(
    "$owner still replaces $replaced in Svelte components, which typed linting leaves out",
    async ({ replaced }) => {
      const options = withTypeScript(
        { ...baseOptions, svelte: true },
        { overridesTypeAware: { [replaced]: "error" } },
      );

      expect(
        await getSeverityByFile(
          options,
          ["src/example.ts", "src/Component.svelte"],
          replaced,
        ),
      ).toEqual([2, 0]);
    },
  );

  it.each(typescriptCases)(
    "turning $owner off brings $replaced back where overridesTypeAware does not apply",
    async ({ owner, replaced }) => {
      const options = withTypeScript(optionsWithoutOwner.get(owner) ?? {}, {
        ...withoutScripts,
        overridesTypeAware: { [replaced]: "off" },
      });

      expect(
        await getSeverityByFile(
          options,
          ["src/example.ts", "scripts/example.ts"],
          replaced,
        ),
      ).toEqual([0, 2]);
    },
  );

  it.each(narrowedCases)(
    "$owner replaces $replaced, set to $entry, in its own files outside the type-aware scope",
    async ({ entry, owner, replaced, severities }) => {
      const options = withTypeScript(
        optionsWithNarrowedOwner.get(owner) ?? {},
        {
          ignoresTypeAware: ["**/legacy/**"],
          overridesTypeAware: { [replaced]: entry },
        },
      );

      expect(
        await getSeverityByFile(
          options,
          [
            "src/example.ts",
            "scripts/example.ts",
            "src/legacy/example.ts",
            "scripts/legacy/example.ts",
          ],
          replaced,
        ),
      ).toEqual(severities);
    },
  );

  it.each(typescriptCases)(
    "leave $replaced to typescript.overrides outside the type-aware scope",
    async ({ replaced }) => {
      const typescript = {
        overrides: { [replaced]: "warn" },
        overridesTypeAware: { [replaced]: "off" },
      } satisfies TypeScriptOptions;
      const [typed, untyped] = await Promise.all([
        getSeverityByFile(
          withTypeScript(baseOptions, { ...withoutScripts, ...typescript }),
          ["src/example.ts", "scripts/example.ts"],
          replaced,
        ),
        getSeverityByFile(
          { projectRootDirectory: process.cwd(), typescript },
          ["src/example.ts"],
          replaced,
        ),
      ]);

      expect({ typed, untyped }).toEqual({ typed: [0, 1], untyped: [1] });
    },
  );

  it("apply with their options in the type-aware scope", async () => {
    const ruleId = "@typescript-eslint/no-unused-vars";
    const options = withTypeScript(baseOptions, {
      ...withoutScripts,
      overridesTypeAware: { [ruleId]: ["warn", { args: "none" }] },
    });
    const [inside, outside] = await Promise.all([
      getRules(options, "src/example.ts"),
      getRules(options, "scripts/example.ts"),
    ]);

    // ESLint adds the defaults of a rule's options, so the settings may have more than these.
    expect(inside.get(ruleId)).toMatchObject([1, { args: "none" }]);
    expect(outside.get(ruleId)?.[0]).toBe(0);
  });

  it("do not bring back a replaced rule of another feature", async () => {
    const options = withTypeScript(baseOptions, {
      overridesTypeAware: { "sort-keys": "error" },
    });

    expect(
      await getSeverities(options, "src/example.ts", ["sort-keys"]),
    ).toEqual([0]);
  });

  it("are set again in one block over the type-aware scope, and only with typed linting", async () => {
    const overridesTypeAware = {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "error",
    } satisfies Rules;
    const [typed, untyped] = await Promise.all([
      createConfig(withTypeScript(baseOptions, { overridesTypeAware })),
      createConfig({
        projectRootDirectory: process.cwd(),
        typescript: { overridesTypeAware },
      }),
    ]);
    // The blocks of `configs` that turn off or set again the replaced rules of typescript-eslint.
    const getBlocks = (
      configs: readonly Linter.Config[],
    ): readonly Linter.Config[] =>
      configs.filter(
        ({ name = "" }) =>
          name === `${prefix}overlaps/typescript` ||
          name.startsWith(`${prefix}overlaps/typescript/`),
      );
    const typeAwareRules = typed.find(
      ({ name }) => name === `${prefix}typescript/rules-type-aware`,
    );

    // A type-aware block has no `ignores`, which could bring back a file outside the scope.
    expect(getBlocks(typed)).toStrictEqual([
      expect.objectContaining({ name: `${prefix}overlaps/typescript` }),
      {
        files: typeAwareRules?.files,
        name: `${prefix}overlaps/typescript/overrides-type-aware`,
        rules: { "@typescript-eslint/no-unused-vars": "error" },
      },
    ]);
    expect(getBlocks(untyped).map(({ name }) => name)).toEqual([
      `${prefix}overlaps/typescript`,
    ]);
  });
});

describe("overlaps owned by the javascript feature", () => {
  it("stay in the rule maps, because the javascript feature is always on", async () => {
    const rules = await getRules(baseOptions, "src/example.js");

    expect(rules.get("arrow-body-style")).toEqual([2, "as-needed"]);
    expect(rules.has("unicorn/consistent-arrow-return-style")).toBe(false);
    expect(rules.get("perfectionist/sort-variable-declarations")?.[0]).toBe(0);
    expect(rules.get("unicorn/try-complexity")?.[0]).toBe(0);
  });
});

describe("TypeScript replacements", () => {
  it("prefer typescript-eslint extension rules in TypeScript files", async () => {
    const rules = await getRules(baseOptions, "src/example.ts");
    const pairs = [
      ["class-methods-use-this", "@typescript-eslint/class-methods-use-this"],
      ["default-param-last", "@typescript-eslint/default-param-last"],
      ["max-params", "@typescript-eslint/max-params"],
      ["no-array-constructor", "@typescript-eslint/no-array-constructor"],
      ["no-shadow", "@typescript-eslint/no-shadow"],
      ["no-unused-expressions", "@typescript-eslint/no-unused-expressions"],
      [
        "no-unused-private-class-members",
        "@typescript-eslint/no-unused-private-class-members",
      ],
      ["no-use-before-define", "@typescript-eslint/no-use-before-define"],
      ["prefer-destructuring", "@typescript-eslint/prefer-destructuring"],
    ];

    expect(
      pairs.map(([core = "", extension = ""]) => [
        rules.get(core)?.[0],
        rules.get(extension)?.[0],
      ]),
    ).toEqual(pairs.map(() => [0, 2]));
    expect(rules.get("no-loop-func")?.[0]).toBe(2);
    expect(rules.has("@typescript-eslint/no-loop-func")).toBe(false);
  });
});
