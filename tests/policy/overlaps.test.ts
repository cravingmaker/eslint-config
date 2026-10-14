/* eslint-disable security/detect-non-literal-fs-filename -- The project is written to a temporary directory. */

import type { Linter } from "eslint";
import type { Owner } from "../../src/overlaps.js";
import type { Options, Rules, TypeScriptOptions } from "../../src/types.js";

import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
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
} as const satisfies Readonly<Record<Owner, Options>>;
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
} as const satisfies Readonly<Record<Owner, Options>>;
const optionsWithNarrowedOwner = new Map<string, Options>(
  Object.entries(withNarrowedOwner),
);
/*
The two parts of the table, each with what a replaced rule does where its owner does not lint,
while the owner is off or leaves the file out, and the severity that the rule has there.
*/
const parts = [
  { effect: "brings it back", rules: overlaps.checks, severityWithoutOwner: 2 },
  { effect: "leaves it off", rules: overlaps.style, severityWithoutOwner: 0 },
] as const;
// One case for each row of the table.
const cases = parts.flatMap(({ effect, rules, severityWithoutOwner }) =>
  Object.entries(rules).flatMap(([owner, replacedRules]) =>
    Object.entries(replacedRules).map(([replaced, ownerRules]) => ({
      effect,
      owner,
      ownerRules,
      replaced,
      severityWithoutOwner,
    })),
  ),
);
// The replaced checks that the TypeScript feature holds. `typescript.overridesTypeAware` can set
// them as well, and apply in the type-aware scope only.
const typescriptCases = cases.filter(
  ({ replaced, severityWithoutOwner }) =>
    severityWithoutOwner === 2 && featureOf(replaced) === "typescript",
);
// The replaced style rules that the TypeScript feature holds.
const typescriptStyleCases = cases.filter(
  ({ replaced, severityWithoutOwner }) =>
    severityWithoutOwner === 0 && featureOf(replaced) === "typescript",
);
// Typed linting that leaves the scripts out, as a project does whose tsconfig does not include
// them.
const withoutScripts = {
  ignoresTypeAware: ["scripts/**"],
  typeChecked: true,
} as const satisfies TypeScriptOptions;
// A sample for each of those checks, which the rule and a rule of its owner both report: a
// variable that nothing uses.
const samples = [
  {
    code: "const unused = 1;\nexport {};\n",
    fileName: "unused.ts",
    ownerRule: "unused-imports/no-unused-vars",
    replaced: "@typescript-eslint/no-unused-vars",
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
// The files of the project that pass while every owner is on: imports in the order that
// perfectionist asks for, a to-do comment, and a type import next to a value import of the same
// module.
const passingFiles = {
  "src/ordered.js":
    'import { readFile } from "node:fs/promises";\n\nimport { alpha } from "./local.js";\n\nexport const value = [readFile, alpha];\n',
  "src/todo.js": "// TODO: tidy this up later\nexport const value = 1;\n",
  "src/type-import.ts":
    'import type { Scale } from "./scale.js";\n\nimport { scales } from "./scale.js";\n\nexport const first: Scale | undefined = scales[0];\n',
} as const;
/*
The other files of the project: the modules that the files above import, two files that an owner
is told to leave out, and three that a check reports, which import a module twice or one that
does not exist.
*/
const otherFiles = {
  "src/duplicate.ts":
    'import { scales } from "./scale.js";\nimport { scales as all } from "./scale.js";\n\nexport const both = [scales, all];\n',
  "src/generated/table.js": "export const table = { zeta: 1, alpha: 2 };\n",
  "src/generated/todo.js":
    "// TODO: tidy this up later\nexport const value = 1;\n",
  "src/local.js": "export const alpha = 1;\n",
  "src/missing.js":
    'import { nothing } from "./nothing.js";\n\nexport const value = nothing;\n',
  "src/missing.ts":
    'import { nothing } from "./nothing.js";\n\nexport const value: unknown = nothing;\n',
  "src/scale.ts":
    'export type Scale = "celsius" | "fahrenheit";\n\nexport const scales: readonly Scale[] = ["celsius", "fahrenheit"];\n',
} as const;

/*
A project whose tsconfig includes `src/` only. Each sample is in `src/` and in `scripts/`, which
typed linting leaves out with `withoutScripts`. The project is known by its real path: the
temporary directory can be a symbolic link, as it is on macOS, and `n/no-unpublished-import` then
reports every relative import.
*/
const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-overlaps-"),
);
const projectDirectory = await realpath(temporaryDirectory);
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
    ...Object.entries({ ...passingFiles, ...otherFiles }),
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
The messages of each of `filePaths` in the project as text, in the order of `filePaths`, with
`options`. A file that ESLint did not lint has `undefined`, so it does not pass for a file without
messages.
*/
async function getMessages(
  options: Options,
  filePaths: readonly string[],
): Promise<ReadonlyArray<readonly string[] | undefined>> {
  const messages = await lintProject(options, {}, filePaths);
  return messages.map((fileMessages) =>
    fileMessages?.map(
      ({ column, line, message, ruleId }) =>
        `${String(line)}:${String(column)} ${ruleId ?? "fatal"}: ${message}`,
    ),
  );
}
/*
The rules among `ruleIds` that report each of `filePaths` in the project, in the order of
`filePaths`, with `typescript` as the options of the TypeScript feature and `options` as the
others.
*/
async function getReported(
  typescript: TypeScriptOptions,
  filePaths: readonly string[],
  ruleIds: readonly string[],
  options: Options = {},
): Promise<ReadonlyArray<readonly string[]>> {
  const messages = await lintProject(options, typescript, filePaths);
  return messages.map((fileMessages = []) =>
    ruleIds.filter((ruleId) =>
      fileMessages.some((message) => message.ruleId === ruleId),
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
/*
The messages of each of `filePaths` in the project, in the order of `filePaths`, with `options`
and with `typescript` as the options of the TypeScript feature. The manifest of the project
declares no framework.
*/
async function lintProject(
  options: Options,
  typescript: TypeScriptOptions,
  filePaths: readonly string[],
): Promise<ReadonlyArray<readonly Linter.LintMessage[] | undefined>> {
  const eslint = new ESLint({
    cwd: projectDirectory,
    overrideConfig: await createConfig({
      ...options,
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
  return filePaths.map((filePath) => messagesByPath.get(filePath));
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
    "$owner replaces $replaced, and turning $owner off $effect",
    async ({ owner, ownerRules, replaced, severityWithoutOwner }) => {
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
      expect(ownerOff.get(replaced)?.[0]).toBe(severityWithoutOwner);
      expect(ownerRules.filter((ruleId) => ownerOff.has(ruleId))).toEqual([]);
    },
  );

  it.each(cases)(
    "$owner replaces $replaced in its own files, and leaving a file out of $owner $effect",
    async ({ owner, ownerRules, replaced, severityWithoutOwner }) => {
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
      expect(outside.get(replaced)?.[0]).toBe(severityWithoutOwner);
      expect(ignored.get(replaced)?.[0]).toBe(severityWithoutOwner);
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

  it("brings n/no-missing-import back in JavaScript files only", async () => {
    const filePaths = [
      "src/example.js",
      "src/example.ts",
      "src/Component.svelte",
    ];
    const [ownerOff, ownerNarrowed] = await Promise.all([
      getSeverityByFile(
        { ...withoutOwner.imports, svelte: true },
        filePaths,
        "n/no-missing-import",
      ),
      getSeverityByFile(
        { ...withNarrowedOwner.imports, svelte: true },
        filePaths.map((filePath) => filePath.replace("src/", "scripts/")),
        "n/no-missing-import",
      ),
    ]);

    expect({ ownerNarrowed, ownerOff }).toEqual({
      ownerNarrowed: [2, 0, 0],
      ownerOff: [2, 0, 0],
    });
  });

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
`typescript.overrides` apply in every file of the feature, so a replaced check that they set is
the user's everywhere. `typescript.overridesTypeAware` apply in the type-aware scope only, so a
check that only they set is still replaced outside that scope, and in every file while typed
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

  it("do not bring back a replaced check of another feature", async () => {
    const options = withTypeScript(baseOptions, {
      overridesTypeAware: { "no-negated-condition": "error" },
    });

    expect(
      await getSeverities(options, "src/example.ts", ["no-negated-condition"]),
    ).toEqual([0]);
  });

  it.each(typescriptStyleCases)(
    "turn the style rule $replaced on in the type-aware scope only, whether $owner is on or off",
    async ({ owner, replaced }) => {
      const typescript = {
        ...withoutScripts,
        overridesTypeAware: { [replaced]: "error" },
      } satisfies TypeScriptOptions;
      const filePaths = ["src/example.ts", "scripts/example.ts"];
      const withOwner = withTypeScript(baseOptions, typescript);
      const withoutIt = withTypeScript(
        optionsWithoutOwner.get(owner) ?? {},
        typescript,
      );
      const [ownerOn, ownerOff] = await Promise.all([
        getSeverityByFile(withOwner, filePaths, replaced),
        getSeverityByFile(withoutIt, filePaths, replaced),
      ]);

      expect({ ownerOff, ownerOn }).toEqual({
        ownerOff: [2, 0],
        ownerOn: [2, 0],
      });
    },
  );

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

/*
Turning an owner off, or leaving a file out of it, must not change which code passes. A rule that
comes back therefore makes the same check as the rule of its owner did, and a rule that asks for
something else, such as another order of the imports, stays off.
*/
describe("code that passes while every owner is on", () => {
  const filePaths = Object.keys(passingFiles);
  const noMessages = filePaths.map(() => []);

  it("has no message with the defaults", async () => {
    expect(await getMessages({}, filePaths)).toEqual(noMessages);
  });

  it.each(Object.keys(withoutOwner))(
    "has no message with %s off",
    async (owner) => {
      expect(
        await getMessages(optionsWithoutOwner.get(owner) ?? {}, filePaths),
      ).toEqual(noMessages);
    },
  );
});

describe("a file that an owner leaves out", () => {
  // The scope of `perfectionist` in the example of "Feature values" in the README.
  const withoutGenerated = { ignores: ["src/generated/**"] } as const;

  it("gets no sorting rule of another feature, as in the example of the README", async () => {
    const options = { perfectionist: withoutGenerated } satisfies Options;
    const sortingRules = Object.keys(overlaps.style.perfectionist);
    const [messages, severities] = await Promise.all([
      getMessages(options, ["src/generated/table.js"]),
      getSeverities(
        { ...baseOptions, ...options },
        "src/generated/table.ts",
        sortingRules,
      ),
    ]);

    expect(messages).toEqual([[]]);
    expect(severities).toEqual(sortingRules.map(() => 0));
  });

  it("keeps a to-do comment without a message", async () => {
    expect(
      await getMessages({ unicorn: withoutGenerated }, [
        "src/generated/todo.js",
      ]),
    ).toEqual([[]]);
  });
});

describe("a check that comes back", () => {
  it("reports what the rule of its owner reported, such as a module that is imported twice", async () => {
    const ruleIds = ["no-duplicate-imports", "import-x/no-duplicates"];
    const [[ownerOn], [ownerOff]] = await Promise.all([
      getReported({}, ["src/duplicate.ts"], ruleIds),
      getReported({}, ["src/duplicate.ts"], ruleIds, { imports: false }),
    ]);

    expect({ ownerOff, ownerOn }).toEqual({
      ownerOff: ["no-duplicate-imports"],
      ownerOn: ["import-x/no-duplicates"],
    });
  });

  it("reports a module that does not exist in JavaScript files only, and leaves TypeScript files to the compiler", async () => {
    const ruleIds = ["n/no-missing-import", "import-x/no-unresolved"];
    const filePaths = ["src/missing.js", "src/missing.ts"];
    const [ownerOn, ownerOff] = await Promise.all([
      getReported({}, filePaths, ruleIds),
      getReported({}, filePaths, ruleIds, { imports: false }),
    ]);

    expect({ ownerOff, ownerOn }).toEqual({
      ownerOff: [["n/no-missing-import"], []],
      ownerOn: [["import-x/no-unresolved"], ["import-x/no-unresolved"]],
    });
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
