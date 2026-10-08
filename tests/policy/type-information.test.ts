/* eslint-disable security/detect-non-literal-fs-filename -- The project is written to a temporary directory. */

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

type ConfigOptions = NonNullable<Parameters<typeof createConfig>[0]>;
type EffectiveConfig = {
  readonly languageOptions?: {
    readonly parserOptions?: Readonly<Record<string, unknown>>;
  };
  readonly plugins?: Readonly<Record<string, Plugin | undefined>>;
  readonly rules?: Readonly<Record<string, readonly unknown[]>>;
};
type Plugin = {
  readonly rules?: Readonly<
    Record<
      string,
      | {
          readonly meta?: {
            readonly docs?: { readonly requiresTypeChecking?: boolean };
          };
        }
      | undefined
    >
  >;
};
// Options that decide where the parser reads type information, and the files where it then does.
type Shape = readonly [
  description: string,
  options: ConfigOptions,
  typed: readonly string[],
];

const plainModule = "export const example = 1;\n";
const jsxModule = "export function Example() {\n  return <p>example</p>;\n}\n";
const runeModule = "export const state = $state({ count: 0 });\n";
/*
One file of each kind of source, a script, and two generated files that an option can tell apart.
The tsconfig of the project includes `src/` only, so the project service cannot find the script.
The script has what the rules of `functional` and `node` ask for type information about, which
they do only when they find it: an expression statement, and a call of a synchronous method in a
function. Only the component and the declaration file have type syntax, and the TSX file has no
JSX, so espree parses a TypeScript file that an option leaves out of the TypeScript feature. The
TypeScript files have different names, because a tsconfig includes only one of `example.ts`,
`example.tsx`, and `example.d.ts`.
*/
const sources = {
  "scripts/build.ts":
    'import { readFileSync } from "node:fs";\n\nexport const values = [1];\nvalues.push(2);\n\nexport function read(file) {\n  return readFileSync(file, "utf8");\n}\n',
  "src/Component.svelte":
    '<script lang="ts">\n  const count: number = 1;\n</script>\n\n<p>{count}</p>\n',
  "src/example.js": plainModule,
  "src/example.jsx": jsxModule,
  "src/example.mjs": plainModule,
  "src/example.mts": plainModule,
  "src/example.ts": plainModule,
  "src/generated/data.ts": plainModule,
  "src/generated/keep.ts": plainModule,
  "src/state.svelte.js": runeModule,
  "src/state.svelte.ts": runeModule,
  "src/types.d.ts": "export declare const version: string;\n",
  "src/view.tsx": plainModule,
} as const;
const filePaths = Object.keys(sources);
// The TypeScript files that the tsconfig includes, and those of them that are not generated.
const typedSources = [
  "src/example.mts",
  "src/example.ts",
  "src/generated/data.ts",
  "src/generated/keep.ts",
  "src/state.svelte.ts",
  "src/types.d.ts",
  "src/view.tsx",
];
const writtenSources = typedSources.filter(
  (filePath) => !filePath.startsWith("src/generated/"),
);
// Typed linting that leaves out the script, which no tsconfig includes.
const withoutScripts = {
  ignoresTypeAware: ["scripts/**"],
  typeChecked: true,
} as const;
// Files of the TypeScript feature that name Svelte components, whose parser reads no type
// information.
const withComponents = {
  files: ["src/**/*.{ts,svelte}"],
  typeChecked: true,
} as const;
/*
ESLint reads an ignore list in order, so a negated pattern brings back files that the patterns
before it left out. It does so within its own list, as in `ignoresTypeAware` below, and must not
across two lists: joined lists used to bring a file back into a type-aware block. Every shape
leaves the script out of typed linting, and the last one is a control without a negated pattern.
*/
const shapes: readonly Shape[] = [
  [
    "typed linting off",
    { typescript: { ignoresTypeAware: ["scripts/**"] } },
    [],
  ],
  ["typed linting on", { typescript: withoutScripts }, typedSources],
  [
    "a negated pattern in the ignores of functional",
    {
      functional: { ignores: ["**/*", "!scripts/**"] },
      typescript: withoutScripts,
    },
    typedSources,
  ],
  [
    "a negated pattern in the ignores of node",
    {
      node: { ignores: ["**/*", "!scripts/**"] },
      typescript: withoutScripts,
    },
    typedSources,
  ],
  [
    "a negated pattern in the ignores of typescript",
    {
      typescript: {
        ignores: ["**/generated/**", "!**/generated/keep.ts"],
        ignoresTypeAware: ["scripts/**", "**/generated/keep.ts"],
        typeChecked: true,
      },
    },
    writtenSources,
  ],
  [
    "a negated pattern in ignoresTypeAware",
    {
      typescript: {
        ignoresTypeAware: [
          "scripts/**",
          "**/generated/**",
          "!**/generated/keep.ts",
        ],
        typeChecked: true,
      },
    },
    [...writtenSources, "src/generated/keep.ts"],
  ],
  [
    "a negated pattern in ignoresTypeAware for a file that typescript ignores",
    {
      typescript: {
        ignores: ["**/generated/**"],
        ignoresTypeAware: ["scripts/**", "!**/generated/keep.ts"],
        typeChecked: true,
      },
    },
    writtenSources,
  ],
  [
    "Svelte components among the files of typescript",
    { typescript: withComponents },
    [
      "src/example.ts",
      "src/generated/data.ts",
      "src/generated/keep.ts",
      "src/state.svelte.ts",
      "src/types.d.ts",
    ],
  ],
  [
    "ignores without a negated pattern",
    {
      functional: { ignores: ["scripts/**"] },
      node: { ignores: ["scripts/**"] },
      typescript: {
        ignores: ["**/generated/data.ts"],
        ignoresTypeAware: ["scripts/**", "**/generated/keep.ts"],
        typeChecked: true,
      },
    },
    writtenSources,
  ],
];
/*
Rules that need type information but check for it themselves and do nothing in a file without it.
They may stay on outside the type-aware scope, each for the reason given.
*/
const selfCheckingRules = new Map([
  [
    "unicorn/no-non-function-verb-prefix",
    "it lints only TypeScript files that the parser reads with type information",
  ],
]);
/*
Rules that need type information without declaring it, each with the files where it does.
`n/no-sync` asks for it wherever typescript-eslint is the parser, which the node feature takes to
be the TypeScript files and the Svelte components.
*/
const undeclaredRules = new Map([
  ["n/no-sync", [".mts", ".svelte", ".ts", ".tsx"]],
]);

const projectDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-type-information-"),
);
await Promise.all(
  Object.entries({
    ...sources,
    "package.json": JSON.stringify({ name: "fixture", type: "module" }),
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        jsx: "preserve",
        module: "nodenext",
        noEmit: true,
        strict: true,
        target: "es2024",
      },
      include: ["src"],
    }),
  }).map(async ([fileName, content]) => {
    const filePath = path.join(projectDirectory, fileName);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }),
);

afterAll(async () => {
  await rm(projectDirectory, { force: true, recursive: true });
});

// ESLint for the project with every framework on, so that their rules are checked as well.
async function createEslint(options: ConfigOptions): Promise<ESLint> {
  return new ESLint({
    cwd: projectDirectory,
    overrideConfig: await createConfig({
      express: true,
      projectRootDirectory: projectDirectory,
      react: { refresh: "vite" },
      svelte: true,
      ...options,
    }),
    overrideConfigFile: true,
  });
}
// How ESLint resolves `filePath`: whether the parser reads type information, and the rules that
// need it there and are on, apart from those that check for it themselves.
async function describeTypeInformation(
  eslint: ESLint,
  filePath: string,
): Promise<{
  readonly projectService: boolean;
  readonly typeAwareRules: readonly string[];
}> {
  const config = await getEffectiveConfig(eslint, filePath);
  const plugins = new Map(Object.entries(config?.plugins ?? {}));
  return {
    projectService:
      config?.languageOptions?.parserOptions?.projectService === true,
    typeAwareRules: Object.entries(config?.rules ?? {})
      .filter(
        ([ruleId, [severity]]) =>
          severity !== 0 &&
          !selfCheckingRules.has(ruleId) &&
          (requiresTypeInformation(plugins, ruleId) ||
            (undeclaredRules.get(ruleId) ?? []).some((extension) =>
              filePath.endsWith(extension),
            )),
      )
      .map(([ruleId]) => ruleId),
  };
}
async function getEffectiveConfig(
  eslint: ESLint,
  filePath: string,
): Promise<EffectiveConfig | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  return (await eslint.calculateConfigForFile(filePath)) as
    EffectiveConfig | undefined;
}
// Whether the rule declares that it needs type information.
function requiresTypeInformation(
  plugins: ReadonlyMap<string, Plugin | undefined>,
  ruleId: string,
): boolean {
  const slash = ruleId.lastIndexOf("/");
  const plugin = plugins.get(ruleId.slice(0, slash));
  const rules = new Map(Object.entries(plugin?.rules ?? {}));
  return (
    rules.get(ruleId.slice(slash + 1))?.meta?.docs?.requiresTypeChecking ===
    true
  );
}

describe.each(shapes)(
  "rules that need type information, with %s",
  (_description, options, typed) => {
    const eslint = createEslint(options);

    // A rule that needs type information throws in a file without it, which stops ESLint for
    // every file. A resolved configuration does not show that, so the files are linted. A
    // message without a rule is a parsing error, or says that ESLint did not lint the file.
    it.each(filePaths)("do not stop ESLint in %s", async (filePath) => {
      const linter = await eslint;
      const [result] = await linter.lintFiles([filePath]);

      expect(
        result.messages
          .filter(({ ruleId }) => typeof ruleId !== "string")
          .map(({ message }) => message),
      ).toEqual([]);
    });

    it.each(typed)(
      "are on in %s, where the parser reads type information",
      async (filePath) => {
        const { projectService, typeAwareRules } =
          await describeTypeInformation(await eslint, filePath);

        expect(projectService).toBe(true);
        // The rules of typescript-eslint cover the whole type-aware scope.
        expect(typeAwareRules).toContain(
          "@typescript-eslint/no-floating-promises",
        );
      },
    );

    it.each(filePaths.filter((filePath) => !typed.includes(filePath)))(
      "are off in %s, where the parser reads none",
      async (filePath) => {
        expect(await describeTypeInformation(await eslint, filePath)).toEqual({
          projectService: false,
          typeAwareRules: [],
        });
      },
    );
  },
);

describe("rules that need type information", () => {
  it.each([...selfCheckingRules])(
    "may stay on outside the type-aware scope only for %s, because %s",
    async (ruleId) => {
      const config = await getEffectiveConfig(
        await createEslint({}),
        "src/example.ts",
      );
      const plugins = new Map(Object.entries(config?.plugins ?? {}));

      expect(requiresTypeInformation(plugins, ruleId)).toBe(true);
    },
  );

  it("leave a component among the files of typescript with the rules that need none", async () => {
    const config = await getEffectiveConfig(
      await createEslint({ typescript: withComponents }),
      "src/Component.svelte",
    );

    expect(config?.rules?.["@typescript-eslint/no-explicit-any"]?.[0]).toBe(2);
  });
});
