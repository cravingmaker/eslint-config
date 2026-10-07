import process from "node:process";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";

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

const rootDirectory = process.cwd();
// One file of each kind of source, and a script that typed linting below leaves out.
const filePaths = [
  "scripts/build.ts",
  "src/Component.svelte",
  "src/example.d.ts",
  "src/example.js",
  "src/example.jsx",
  "src/example.mjs",
  "src/example.mts",
  "src/example.ts",
  "src/example.tsx",
  "src/state.svelte.js",
  "src/state.svelte.ts",
] as const;
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

async function createEslint(isTypeChecked: boolean): Promise<ESLint> {
  return new ESLint({
    overrideConfig: await createConfig({
      express: true,
      projectRootDirectory: rootDirectory,
      react: { refresh: "vite" },
      svelte: true,
      typescript: {
        ignoresTypeAware: ["scripts/**"],
        tsconfigRootDir: rootDirectory,
        typeChecked: isTypeChecked,
      },
    }),
    overrideConfigFile: true,
  });
}
// How ESLint resolves `filePath`: whether the parser reads type information, and the rules that
// need it and are on, apart from those that check for it themselves.
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
          requiresTypeInformation(plugins, ruleId),
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

describe("rules that need type information", () => {
  it.each(filePaths)(
    "are off in %s without typed linting",
    async (filePath) => {
      const eslint = await createEslint(false);

      expect(await describeTypeInformation(eslint, filePath)).toEqual({
        projectService: false,
        typeAwareRules: [],
      });
    },
  );

  it.each(filePaths)(
    "are on in %s with typed linting only where the parser reads type information",
    async (filePath) => {
      const eslint = await createEslint(true);
      const { projectService, typeAwareRules } = await describeTypeInformation(
        eslint,
        filePath,
      );

      expect(typeAwareRules.length > 0).toBe(projectService);
    },
  );

  it.each([...selfCheckingRules])(
    "may stay on outside the type-aware scope only for %s, because %s",
    async (ruleId) => {
      const config = await getEffectiveConfig(
        await createEslint(false),
        "src/example.ts",
      );
      const plugins = new Map(Object.entries(config?.plugins ?? {}));

      expect(requiresTypeInformation(plugins, ruleId)).toBe(true);
    },
  );
});
