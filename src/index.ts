import type { Linter } from "eslint";

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { defineConfig, globalIgnores } from "eslint/config";
import globalVariables from "globals";

import { comments } from "./configs/comments.js";
import { express } from "./configs/express.js";
import { functional } from "./configs/functional.js";
import { html } from "./configs/html.js";
import { imports } from "./configs/imports.js";
import { javascript } from "./configs/javascript/index.js";
import { json } from "./configs/json.js";
import { markdown } from "./configs/markdown.js";
import { node } from "./configs/node.js";
import { packageJson } from "./configs/package-json.js";
import { perfectionist } from "./configs/perfectionist.js";
import { promise } from "./configs/promise.js";
import { react } from "./configs/react.js";
import { regexp } from "./configs/regexp.js";
import { security } from "./configs/security.js";
import { svelte } from "./configs/svelte.js";
import { typescript } from "./configs/typescript/index.js";
import { unicorn } from "./configs/unicorn.js";
import { unusedImports } from "./configs/unused-imports.js";
import { createContext } from "./context.js";

type CreateConfigOptions = {
  readonly environments?: readonly GlobalEnvironment[];
  readonly globals?: Linter.Globals;
  readonly ignores?: readonly string[];
  readonly plugins?: Linter.Config["plugins"];
  readonly projectRootDirectory?: string;
  readonly reactRefreshVariant?: "generic" | "next" | "vite";
  readonly rules?: RulesOptions;
  readonly tsconfigRootDir?: string;
  readonly tsTypeChecked?: boolean;
};
type GlobalEnvironment = keyof typeof globalVariables;
type ResolvedRules = {
  readonly express: Linter.RulesRecord;
  readonly html: Linter.RulesRecord;
  readonly js: Linter.RulesRecord;
  readonly json: Linter.RulesRecord;
  readonly json5: Linter.RulesRecord;
  readonly jsonc: Linter.RulesRecord;
  readonly markdown: Linter.RulesRecord;
  readonly packageJson: Linter.RulesRecord;
  readonly react: Linter.RulesRecord;
  readonly svelte: Linter.RulesRecord;
  readonly ts: Linter.RulesRecord;
};
type RulesOptions = {
  readonly express?: Linter.RulesRecord;
  readonly html?: Linter.RulesRecord;
  readonly js?: Linter.RulesRecord;
  readonly json?: Linter.RulesRecord;
  readonly json5?: Linter.RulesRecord;
  readonly jsonc?: Linter.RulesRecord;
  readonly markdown?: Linter.RulesRecord;
  readonly packageJson?: Linter.RulesRecord;
  readonly react?: Linter.RulesRecord;
  readonly svelte?: Linter.RulesRecord;
  readonly ts?: Linter.RulesRecord;
};

async function detectReactRefreshVariant(
  projectRootDirectory: string,
): Promise<"generic" | "next" | "vite"> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- projectRootDirectory is an explicit caller-controlled project base path.
    const raw = await readFile(
      path.join(projectRootDirectory, "package.json"),
      "utf8",
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON.parse returns `any`; immediately cast to a safe Record shape
    const packageManifest = JSON.parse(raw) as Record<
      string,
      Record<string, unknown> | undefined
    >;
    const dependencies: Record<string, unknown> = {
      ...packageManifest.dependencies,
      ...packageManifest.devDependencies,
      ...packageManifest.peerDependencies,
    };
    if ("next" in dependencies) return "next";
    if ("vite" in dependencies) return "vite";
    return "generic";
  } catch {
    return "generic";
  }
}
function resolveGlobalVariables(
  environments: readonly GlobalEnvironment[],

  globals: Readonly<Linter.Globals>,
): Readonly<Linter.Globals> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Object.assign widens the globals package's environment-record union through its external CommonJS typings.
  const environmentGlobals: Readonly<Linter.Globals> = Object.assign(
    {},
    ...environments.map(
      // eslint-disable-next-line security/detect-object-injection -- Environment is constrained to keys exported by the globals package.
      (environment) => globalVariables[environment],
    ),
  );
  const builtinGlobals: Readonly<Linter.Globals> = globalVariables.builtin;
  return { ...builtinGlobals, ...environmentGlobals, ...globals };
}
// eslint-disable-next-line functional/prefer-immutable-types -- Linter.RulesRecord values are not deeply readonly; external type constraint
function resolveRules(rules: RulesOptions): ResolvedRules {
  return {
    express: rules.express ?? {},
    html: rules.html ?? {},
    js: rules.js ?? {},
    json: rules.json ?? {},
    json5: rules.json5 ?? {},
    jsonc: rules.jsonc ?? {},
    markdown: rules.markdown ?? {},
    packageJson: rules.packageJson ?? {},
    react: rules.react ?? {},
    svelte: rules.svelte ?? {},
    ts: rules.ts ?? {},
  };
}

export async function createConfig({
  environments = [],
  globals: customGlobals = {},
  ignores = [],
  plugins = {},
  projectRootDirectory = process.cwd(),
  reactRefreshVariant,
  rules = {},
  tsconfigRootDir = projectRootDirectory,
  tsTypeChecked = false,
}: CreateConfigOptions = {}) {
  const {
    express: expressRuleOverrides,
    html: htmlRuleOverrides,
    js: jsRuleOverrides,
    json: jsonRuleOverrides,
    json5: json5RuleOverrides,
    jsonc: jsoncRuleOverrides,
    markdown: markdownRuleOverrides,
    packageJson: packageJsonRuleOverrides,
    react: reactRuleOverrides,
    svelte: svelteRuleOverrides,
    ts: tsRuleOverrides,
  } = resolveRules(rules);

  const resolvedGlobals = resolveGlobalVariables(environments, customGlobals);
  const context = await createContext({
    environments,
    globals: customGlobals,
    projectRootDirectory,
    typescript: { tsconfigRootDir, typeChecked: tsTypeChecked },
  });
  const codeQualityOptions = { overrides: jsRuleOverrides };

  const resolvedVariant =
    reactRefreshVariant ??
    (await detectReactRefreshVariant(projectRootDirectory));
  const [tsConfigs, reactConfigs, svelteConfigs, expressConfigs] =
    await Promise.all([
      typescript({ overrides: tsRuleOverrides }, context),
      react({ overrides: reactRuleOverrides, refresh: resolvedVariant }),
      svelte({ overrides: svelteRuleOverrides }, context),
      express({ overrides: expressRuleOverrides }),
    ]);
  const optionalConfigs = [
    ...tsConfigs,
    ...reactConfigs,
    ...svelteConfigs,
    ...expressConfigs,
  ];

  return defineConfig([
    globalIgnores(
      ["**/dist/", "**/build/", "**/coverage/", ...ignores],
      "@cravingmaker/eslint-config/ignores",
    ),

    {
      name: "@cravingmaker/eslint-config/plugins",
      plugins: { ...plugins },
    },

    ...javascript({ globals: resolvedGlobals, overrides: jsRuleOverrides }),
    ...comments(codeQualityOptions),
    ...node(codeQualityOptions, context),
    ...security(codeQualityOptions),
    ...imports(codeQualityOptions, context),
    ...unusedImports(codeQualityOptions),
    ...promise(codeQualityOptions),
    ...regexp(codeQualityOptions),
    ...unicorn(codeQualityOptions),
    ...functional(codeQualityOptions, context),
    ...perfectionist(codeQualityOptions),

    {
      files: ["**/*.{jsx,mjsx}"],
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      name: "@cravingmaker/eslint-config/jsx",
    },

    ...html({ overrides: htmlRuleOverrides }),
    ...packageJson({ overrides: packageJsonRuleOverrides }),
    ...json({
      overrides: jsonRuleOverrides,
      overridesJson5: json5RuleOverrides,
      overridesJsonc: jsoncRuleOverrides,
    }),
    ...markdown({ overrides: markdownRuleOverrides }),

    ...optionalConfigs,

    {
      files: ["**/*.cjs"],
      languageOptions: { sourceType: "commonjs" },
      name: "@cravingmaker/eslint-config/commonjs/javascript",
    },

    {
      files: ["**/*.cts"],
      languageOptions: { sourceType: "commonjs" },
      name: "@cravingmaker/eslint-config/commonjs/typescript",
    },
  ]);
}

export type { CreateConfigOptions, GlobalEnvironment, RulesOptions };
