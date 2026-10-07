/* eslint-disable security/detect-non-literal-fs-filename -- The fixtures are written to a temporary directory. */

import type { Linter } from "eslint";
import type { Options } from "../../src/types.js";

import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import { createConfig } from "../../src/factory.js";

type EffectiveConfig = {
  readonly languageOptions?: {
    readonly parserOptions?: Readonly<Record<string, unknown>>;
  };
  readonly rules?: RuleEntries;
};
type RuleEntries = Readonly<
  Record<string, readonly [Linter.Severity, ...unknown[]]>
>;

const rootDirectory = process.cwd();
// The frameworks are set, so that the results do not depend on this repository's manifest.
const baseOptions = {
  express: false,
  projectRootDirectory: rootDirectory,
  react: false,
  svelte: true,
  typescript: { tsconfigRootDir: rootDirectory },
} as const satisfies Options;
// The rules that Svelte components break by design, which are off in them.
const componentExceptions = [
  "functional/no-let",
  "import-x/no-mutable-exports",
  "import-x/unambiguous",
  "unicorn/no-top-level-assignment-in-function",
] as const;
/*
A project whose manifest declares Svelte. Its valid files cover both modes of a component and both
script languages: a runes component in TypeScript with state, a bound element, and an event
handler; one in JavaScript; a legacy component with an `export let` prop and a store; a rune
module that imports from Svelte; and a component that imports them. `Broken.svelte` imports a name
that the rune module does not export. `node_modules/svelte` links to this repository's copy.
*/
const projectFiles = {
  "package.json": JSON.stringify({
    devDependencies: { svelte: "5.0.0" },
    name: "fixture",
    private: true,
    type: "module",
  }),
  "src/App.svelte": [
    '<script lang="ts">',
    '  import Counter from "./lib/Counter.svelte";',
    '  import Legacy from "./lib/Legacy.svelte";',
    '  import Toggle from "./lib/Toggle.svelte";',
    '  import { visits } from "./lib/visits.svelte.js";',
    "</script>",
    "",
    "<Counter step={1} />",
    '<Legacy label="Visits" />',
    "<Toggle />",
    "<p>{$visits}</p>",
    "",
  ].join("\n"),
  "src/lib/Broken.svelte": [
    "<script>",
    '  import { missing } from "./visits.svelte.js";',
    "</script>",
    "",
    "<p>{missing}</p>",
    "",
  ].join("\n"),
  "src/lib/Counter.svelte": [
    '<script lang="ts">',
    "  type Properties = { readonly step: number };",
    "",
    "  const { step }: Properties = $props();",
    "  let count = $state(0);",
    "  let button: HTMLButtonElement | undefined = $state();",
    "",
    "  function increment(): void {",
    "    count += step;",
    "    button?.focus();",
    "  }",
    "</script>",
    "",
    '<button bind:this={button} type="button" onclick={increment}>{count}</button>',
    "",
  ].join("\n"),
  "src/lib/Legacy.svelte": [
    "<script>",
    '  import { visits } from "./visits.svelte.js";',
    "",
    '  export let label = "Count";',
    "",
    "  $: total = $visits + 1;",
    "</script>",
    "",
    "<p>{label}: {total}</p>",
    "",
  ].join("\n"),
  "src/lib/Toggle.svelte": [
    "<script>",
    "  let open = $state(false);",
    "",
    "  function toggle() {",
    "    open = !open;",
    "  }",
    "</script>",
    "",
    '<button type="button" onclick={toggle}>{open ? "Close" : "Open"}</button>',
    "",
  ].join("\n"),
  "src/lib/visits.svelte.js": [
    'import { writable } from "svelte/store";',
    "",
    "export const visits = writable(0);",
    "",
  ].join("\n"),
  "tsconfig.json": JSON.stringify({
    compilerOptions: {
      module: "esnext",
      moduleResolution: "bundler",
      skipLibCheck: true,
      strict: true,
      target: "es2022",
    },
    include: ["src/**/*.ts", "src/**/*.svelte"],
  }),
} as const;

const projectDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-svelte-scripts-"),
);
await Promise.all(
  Object.entries(projectFiles).map(async ([fileName, content]) => {
    const filePath = path.join(projectDirectory, fileName);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }),
);
await mkdir(path.join(projectDirectory, "node_modules"));
await symlink(
  path.join(rootDirectory, "node_modules", "svelte"),
  path.join(projectDirectory, "node_modules", "svelte"),
  "junction",
);

afterAll(async () => {
  await rm(projectDirectory, { force: true, recursive: true });
});

async function createEslint(options: Options): Promise<ESLint> {
  return new ESLint({
    overrideConfig: await createConfig(options),
    overrideConfigFile: true,
  });
}
// The messages of each of `filePaths` in the fixture project as `line:column rule`, by path.
async function describeMessages(
  filePaths: readonly string[],
): Promise<Readonly<Record<string, readonly string[]>>> {
  const eslint = new ESLint({
    cwd: projectDirectory,
    overrideConfig: await createConfig({
      projectRootDirectory: projectDirectory,
      typescript: { tsconfigRootDir: projectDirectory },
    }),
    overrideConfigFile: true,
  });
  const results = await eslint.lintFiles([...filePaths]);
  return Object.fromEntries(
    results.map(({ filePath, messages }) => [
      path.relative(projectDirectory, filePath),
      messages.map(
        ({ column, line, ruleId }) =>
          `${String(line)}:${String(column)} ${ruleId ?? "fatal"}`,
      ),
    ]),
  );
}
async function getEffectiveConfig(
  eslint: ESLint,
  filePath: string,
): Promise<EffectiveConfig | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  return (await eslint.calculateConfigForFile(filePath)) as
    EffectiveConfig | undefined;
}
// The severity of each of `ruleIds` in `rules`, or `undefined` for a rule that they do not set.
function getSeverities(
  rules: RuleEntries | undefined,
  ruleIds: readonly string[],
): ReadonlyArray<Linter.Severity | undefined> {
  const entries = new Map(Object.entries(rules ?? {}));
  return ruleIds.map((ruleId) => entries.get(ruleId)?.[0]);
}
// The rules of the Svelte feature's own plugin in `rules`.
function getSvelteRuleIds(rules: RuleEntries | undefined): readonly string[] {
  return Object.keys(rules ?? {}).filter((ruleId) =>
    ruleId.startsWith("@html-eslint/svelte/"),
  );
}
// `rules` without `ruleIds`.
function withoutRules(
  rules: RuleEntries | undefined,
  ruleIds: readonly string[],
): RuleEntries {
  return Object.fromEntries(
    Object.entries(rules ?? {}).filter(([ruleId]) => !ruleIds.includes(ruleId)),
  );
}

describe("svelte scripts", () => {
  it("get the rules of TypeScript sources, apart from the rules that components break", async () => {
    const eslint = await createEslint(baseOptions);
    const [component, source] = await Promise.all([
      getEffectiveConfig(eslint, "src/Component.svelte"),
      getEffectiveConfig(eslint, "src/example.ts"),
    ]);

    expect(
      withoutRules(component?.rules, [
        ...getSvelteRuleIds(component?.rules),
        ...componentExceptions,
      ]),
    ).toEqual(withoutRules(source?.rules, componentExceptions));
    expect(
      [component, source].map((config) =>
        getSeverities(config?.rules, componentExceptions),
      ),
    ).toEqual([
      componentExceptions.map(() => 0),
      componentExceptions.map(() => 2),
    ]);
  });

  it("get the TypeScript rules without type information when typed linting is on", async () => {
    const eslint = await createEslint({
      ...baseOptions,
      typescript: {
        ...baseOptions.typescript,
        ignoresTypeAware: ["scripts/**"],
        typeChecked: true,
      },
    });
    const [component, typedSource, untypedSource] = await Promise.all(
      ["src/Component.svelte", "src/example.ts", "scripts/example.ts"].map(
        async (filePath) => await getEffectiveConfig(eslint, filePath),
      ),
    );

    expect(component?.languageOptions?.parserOptions).not.toHaveProperty(
      "projectService",
    );
    expect(typedSource?.languageOptions?.parserOptions).toHaveProperty(
      "projectService",
      true,
    );
    expect(
      withoutRules(component?.rules, [
        ...getSvelteRuleIds(component?.rules),
        ...componentExceptions,
      ]),
    ).toEqual(withoutRules(untypedSource?.rules, componentExceptions));
  });

  it("report problems in JavaScript and TypeScript scripts and in the template", async () => {
    const eslint = await createEslint(baseOptions);
    const [[javascript], [typescript]] = await Promise.all([
      eslint.lintText(
        [
          "<script>",
          "  const total = 1;",
          "  debugger;",
          "</script>",
          "",
          '<p>{total == 1 ? "one" : "many"}</p>',
          "",
        ].join("\n"),
        { filePath: "src/Total.svelte" },
      ),
      eslint.lintText(
        [
          '<script lang="ts">',
          "  const value: any = 1;",
          "</script>",
          "",
          "<p>{value}</p>",
          "",
        ].join("\n"),
        { filePath: "src/Value.svelte" },
      ),
    ]);

    expect(
      [javascript, typescript].map(({ messages }) =>
        messages.map(
          ({ line, ruleId }) => `${String(line)} ${ruleId ?? "fatal"}`,
        ),
      ),
    ).toEqual([
      expect.arrayContaining(["3 no-debugger", "6 eqeqeq"]),
      expect.arrayContaining(["2 @typescript-eslint/no-explicit-any"]),
    ]);
  });

  it("keep to the components that the Svelte feature parses", async () => {
    const [narrowed, off] = await Promise.all([
      createEslint({
        ...baseOptions,
        svelte: { files: ["app/**/*.svelte"], ignores: ["**/generated/**"] },
      }),
      createEslint({ ...baseOptions, svelte: false }),
    ]);
    const configs = await Promise.all([
      getEffectiveConfig(narrowed, "app/Component.svelte"),
      getEffectiveConfig(narrowed, "app/generated/Component.svelte"),
      getEffectiveConfig(narrowed, "lib/Component.svelte"),
      getEffectiveConfig(off, "src/Component.svelte"),
    ]);

    expect(configs[0]?.rules).toHaveProperty(["eqeqeq", 0], 2);
    // Where svelte-eslint-parser does not read a component, no other feature lints it either.
    expect(configs.slice(1)).toEqual([undefined, undefined, undefined]);
  });

  it("lint valid components in both modes and script languages without messages", async () => {
    const filePaths = [
      "src/App.svelte",
      "src/lib/Counter.svelte",
      "src/lib/Legacy.svelte",
      "src/lib/Toggle.svelte",
      "src/lib/visits.svelte.js",
    ];

    expect(await describeMessages(filePaths)).toEqual(
      Object.fromEntries(filePaths.map((filePath) => [filePath, []])),
    );
  });

  it("let import-x read the JavaScript modules that a component imports", async () => {
    expect(await describeMessages(["src/lib/Broken.svelte"])).toEqual({
      "src/lib/Broken.svelte": ["2:12 import-x/named"],
    });
  });
});
