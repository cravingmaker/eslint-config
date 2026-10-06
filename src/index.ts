import type { Linter } from "eslint";
import type pluginReactHooks from "eslint-plugin-react-hooks";
import type { reactRefresh as ReactRefreshPlugin } from "eslint-plugin-react-refresh";
import type eslintPluginHtmlReact from "@html-eslint/eslint-plugin-react";
import type {
  parser as tseslintParser,
  plugin as tseslintPlugin,
} from "typescript-eslint";

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import pluginEslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import enforcePackageType from "eslint-enforce-package-type";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import pluginFunctional from "eslint-plugin-functional";
import pluginImportX, { createNodeResolver } from "eslint-plugin-import-x";
import pluginN from "eslint-plugin-n";
import packageJson from "eslint-plugin-package-json";
import pluginPerfectionist from "eslint-plugin-perfectionist";
import pluginPromise from "eslint-plugin-promise";
import pluginRegexp from "eslint-plugin-regexp";
import pluginSecurity from "eslint-plugin-security";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import { defineConfig, globalIgnores } from "eslint/config";
import pluginJson from "@eslint/json";
import pluginMarkdown from "@eslint/markdown";
import globalVariables from "globals";
import pluginHtml from "@html-eslint/eslint-plugin";
import htmlParser from "@html-eslint/parser";
import * as jsoncParser from "jsonc-eslint-parser";

import { javascript, javascriptRules } from "./configs/javascript/index.js";
import { javascriptFiles } from "./globs.js";
import { htmlEslintRules } from "./rules/html/html.js";
import { enforcePackageTypeEslintRules } from "./rules/json/enforce-package-type.js";
import { jsonEslintRules } from "./rules/json/json.js";
import { packageJsonEslintRules } from "./rules/json/package-json.js";
import { markdownEslintRules } from "./rules/markdown/markdown.js";
import { eslintCommentsRules } from "./rules/misc/eslint-comments.js";
import {
  functionalEslintRules,
  functionalTypeCheckedEslintRules,
} from "./rules/misc/functional.js";
import { importxEslintRules } from "./rules/misc/import-x.js";
import { perfectionistEslintRules } from "./rules/misc/perfectionist.js";
import { promiseEslintRules } from "./rules/misc/promise.js";
import { regexpEslintRules } from "./rules/misc/regexp.js";
import { unicornEslintRules } from "./rules/misc/unicorn.js";
import { unusedImportsEslintRules } from "./rules/misc/unused-imports.js";
import { nEslintRules, nUntypedTypeScriptEslintRules } from "./rules/node/n.js";
import { securityEslintRules } from "./rules/node/security.js";
import {
  tsEslintRules,
  tsEslintTypeCheckedRules,
} from "./rules/ts/typescript-eslint.js";

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
type TsConfigOptions = {
  readonly functionalRules: Readonly<
    Record<string, Linter.RuleEntry | undefined>
  >;
  readonly globals: Readonly<Linter.Globals>;
  readonly nRules: Readonly<Linter.RulesRecord>;
  readonly parser: typeof tseslintParser;
  readonly plugin: typeof tseslintPlugin;
  readonly resolverProject: Readonly<Record<string, unknown>>;
  readonly ruleOverrides: Readonly<Linter.RulesRecord>;
  readonly tsParserOptions: Readonly<Record<string, unknown>>;
  readonly tsRules: Readonly<Linter.RulesRecord>;
};

async function buildExpressConfig(
  // eslint-disable-next-line functional/prefer-immutable-types -- Linter.RulesRecord values are not deeply readonly; external type constraint
  ruleOverrides: Readonly<Linter.RulesRecord>,
): Promise<Linter.Config | undefined> {
  const plugin = await tryImport<{
    default: NonNullable<Linter.Config["plugins"]>[string];
  }>("eslint-plugin-express-security");
  if (plugin === undefined) return undefined;
  const { expressSecurityEslintRules } =
    await import("./rules/node/express-security.js");
  return {
    files: ["**/*.{js,mjs,ts,mts}"],
    name: "@cravingmaker/eslint-config/express",
    plugins: { "express-security": plugin.default },
    rules: { ...expressSecurityEslintRules, ...ruleOverrides },
  };
}
async function buildReactConfig(
  variant: "generic" | "next" | "vite",
  // eslint-disable-next-line functional/prefer-immutable-types -- Linter.RulesRecord values are not deeply readonly; external type constraint
  ruleOverrides: Readonly<Linter.RulesRecord>,
): Promise<readonly Linter.Config[]> {
  const [htmlReactPlugin, hooksPlugin, refreshModule] = await Promise.all([
    tryImport<{ default: typeof eslintPluginHtmlReact }>(
      "@html-eslint/eslint-plugin-react",
    ),
    tryImport<{ default: typeof pluginReactHooks }>(
      "eslint-plugin-react-hooks",
    ),
    tryImport<{ reactRefresh: typeof ReactRefreshPlugin }>(
      "eslint-plugin-react-refresh",
    ),
  ]);

  const [htmlReactRulesModule, hooksRulesModule, refreshRulesModule] =
    await Promise.all([
      htmlReactPlugin === undefined
        ? undefined
        : import("./rules/html/html-react.js"),
      hooksPlugin === undefined
        ? undefined
        : import("./rules/react/react-hooks.js"),
      refreshModule === undefined
        ? undefined
        : import("./rules/react/react-refresh.js"),
    ]);

  const reactConfigs: Array<Linter.Config | undefined> = [
    htmlReactPlugin === undefined || htmlReactRulesModule === undefined
      ? undefined
      : {
          files: ["**/*.{jsx,mjsx,tsx,mtsx}"],
          name: "@cravingmaker/eslint-config/react/html",
          plugins: { "@html-eslint/react": htmlReactPlugin.default },
          rules: {
            ...htmlReactRulesModule.htmlReactEslintRules,
            ...ruleOverrides,
          },
        },
    hooksPlugin === undefined || hooksRulesModule === undefined
      ? undefined
      : {
          files: ["**/*.{jsx,mjsx,tsx,mtsx}"],
          name: "@cravingmaker/eslint-config/react/hooks",
          plugins: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- eslint-plugin-react-hooks configs.flat shape is not assignable to Linter.Plugin without assertion
            "react-hooks": hooksPlugin.default as unknown as NonNullable<
              Linter.Config["plugins"]
            >[string],
          },
          rules: {
            ...hooksRulesModule.reactHooksEslintRules,
            ...ruleOverrides,
          },
        },
    refreshModule === undefined || refreshRulesModule === undefined
      ? undefined
      : {
          files: ["**/*.{jsx,mjsx,tsx,mtsx}"],
          name: "@cravingmaker/eslint-config/react/refresh",
          plugins: { "react-refresh": refreshModule.reactRefresh.plugin },
          rules: {
            ...refreshRulesModule.getReactRefreshEslintRules(variant),
            ...ruleOverrides,
          },
        },
  ];
  return reactConfigs.filter((c): c is Linter.Config => c !== undefined);
}
async function buildSvelteConfig(
  // eslint-disable-next-line functional/prefer-immutable-types -- ESLint global records are not deeply readonly; external type constraint.
  globals: Readonly<Linter.Globals>,
  // eslint-disable-next-line functional/prefer-immutable-types -- Linter.RulesRecord values are not deeply readonly; external type constraint.
  ruleOverrides: Readonly<Linter.RulesRecord>,
  tsParser: typeof tseslintParser,
): Promise<Linter.Config | undefined> {
  const [plugin, svelteParserModule] = await Promise.all([
    tryImport<{ default: Record<string, unknown> }>(
      "@html-eslint/eslint-plugin-svelte",
    ),
    tryImport<{ default: Linter.Parser }>("svelte-eslint-parser"),
  ]);
  if (plugin === undefined || svelteParserModule === undefined)
    return undefined;
  const { htmlSvelteEslintRules } = await import("./rules/html/html-svelte.js");
  return {
    files: ["**/*.{svelte,svelte.js,svelte.mjs,svelte.ts,svelte.mts}"],
    languageOptions: {
      globals,
      parser: svelteParserModule.default,
      parserOptions: { parser: tsParser },
    },
    name: "@cravingmaker/eslint-config/svelte",
    plugins: { "@html-eslint/svelte": plugin.default },
    rules: { ...htmlSvelteEslintRules, ...ruleOverrides },
  };
}
// eslint-disable-next-line functional/prefer-immutable-types -- Linter.RulesRecord values are not deeply readonly; external type constraint
function buildTsConfig({
  functionalRules,
  globals,
  nRules,
  parser,
  plugin,
  resolverProject,
  ruleOverrides,
  tsParserOptions,
  tsRules,
}: TsConfigOptions): Linter.Config {
  return {
    files: ["**/*.{ts,mts,cts,tsx,mtsx}"],
    languageOptions: {
      globals,
      parser,
      parserOptions: tsParserOptions,
    },
    name: "@cravingmaker/eslint-config/typescript",
    plugins: { "@typescript-eslint": plugin },
    rules: {
      ...javascriptRules,
      ...tsRules,
      ...unicornEslintRules,
      ...functionalRules,
      ...promiseEslintRules,
      ...regexpEslintRules,
      ...nRules,
      ...securityEslintRules,
      ...unusedImportsEslintRules,
      ...importxEslintRules,
      ...perfectionistEslintRules,
      ...eslintCommentsRules,
      ...ruleOverrides,
    },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          ...resolverProject,
        }),
        createNodeResolver(),
      ],
    },
  };
}
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
  // eslint-disable-next-line functional/prefer-immutable-types -- ESLint global records are not deeply readonly; external type constraint.
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
function resolveOptionalImport(specifier: string): string | undefined {
  try {
    return import.meta.resolve(specifier);
  } catch (error) {
    if (
      Error.isError(error) &&
      "code" in error &&
      error.code === "ERR_MODULE_NOT_FOUND"
    )
      return undefined;
    // eslint-disable-next-line functional/no-throw-statements -- Unexpected resolution failures must remain visible.
    throw error;
  }
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
async function tryImport<T>(specifier: string): Promise<T | undefined> {
  const resolvedSpecifier = resolveOptionalImport(specifier);
  if (resolvedSpecifier === undefined) return undefined;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- dynamic import cannot be statically typed
  return (await import(resolvedSpecifier)) as T;
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
  const tsRules = tsTypeChecked ? tsEslintTypeCheckedRules : tsEslintRules;
  const functionalRules = tsTypeChecked
    ? functionalTypeCheckedEslintRules
    : functionalEslintRules;
  const nRules = tsTypeChecked ? nEslintRules : nUntypedTypeScriptEslintRules;
  const tsParserOptions = tsTypeChecked
    ? { projectService: true, tsconfigRootDir }
    : {};
  const resolverProject = tsconfigRootDir ? { project: tsconfigRootDir } : {};

  const resolvedVariant =
    reactRefreshVariant ??
    (await detectReactRefreshVariant(projectRootDirectory));
  const tseslint = await import("typescript-eslint");
  const tsConfig = buildTsConfig({
    functionalRules,
    globals: resolvedGlobals,
    nRules,
    parser: tseslint.parser,
    plugin: tseslint.plugin,
    resolverProject,
    ruleOverrides: tsRuleOverrides,
    tsParserOptions,
    tsRules,
  });

  const [reactConfigs, svelteConfig, expressConfig] = await Promise.all([
    buildReactConfig(resolvedVariant, reactRuleOverrides),
    buildSvelteConfig(resolvedGlobals, svelteRuleOverrides, tseslint.parser),
    buildExpressConfig(expressRuleOverrides),
  ]);
  const optionalConfigs = [
    tsConfig,
    ...reactConfigs,
    ...[expressConfig, svelteConfig].filter(
      (c): c is Linter.Config => c !== undefined,
    ),
  ];

  return defineConfig([
    globalIgnores(
      ["**/dist/", "**/build/", "**/coverage/", ...ignores],
      "@cravingmaker/eslint-config/ignores",
    ),

    {
      name: "@cravingmaker/eslint-config/plugins",
      plugins: {
        "@eslint-community/eslint-comments": pluginEslintComments,
        functional: pluginFunctional,
        "import-x": pluginImportX,
        n: pluginN,
        "package-json": packageJson,
        perfectionist: pluginPerfectionist,
        regexp: pluginRegexp,
        unicorn: eslintPluginUnicorn,
        "unused-imports": pluginUnusedImports,

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- eslint-plugin-promise does not have types
        promise: pluginPromise,

        security: pluginSecurity,

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- @eslint/markdown Plugin type is not assignable to Linter.Plugin without assertion
        markdown: pluginMarkdown as unknown as NonNullable<
          Linter.Config["plugins"]
        >[string],

        ...plugins,
      },
    },

    ...javascript({ globals: resolvedGlobals, overrides: jsRuleOverrides }),
    {
      files: [...javascriptFiles],
      name: "@cravingmaker/eslint-config/javascript/plugin-rules",
      rules: {
        ...unicornEslintRules,
        ...functionalEslintRules,
        ...promiseEslintRules,
        ...regexpEslintRules,
        ...nEslintRules,
        ...securityEslintRules,
        ...unusedImportsEslintRules,
        ...importxEslintRules,
        ...perfectionistEslintRules,
        ...eslintCommentsRules,
        ...jsRuleOverrides,
      },
    },

    {
      files: ["**/*.{jsx,mjsx}"],
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      name: "@cravingmaker/eslint-config/jsx",
    },

    {
      files: ["**/*.html"],
      languageOptions: { parser: htmlParser },
      name: "@cravingmaker/eslint-config/html",
      plugins: { "@html-eslint": pluginHtml },
      rules: {
        ...htmlEslintRules,
        ...htmlRuleOverrides,
      },
    },

    {
      files: ["**/package.json"],
      languageOptions: {
        parser: jsoncParser,
      },
      name: "@cravingmaker/eslint-config/package-json",
      plugins: {
        "enforce-package-type": enforcePackageType,
        "package-json": packageJson,
      },
      rules: {
        ...enforcePackageTypeEslintRules,
        ...packageJsonEslintRules,
        ...packageJsonRuleOverrides,
      },
    },

    {
      files: ["**/*.json"],
      ignores: ["**/package.json", "**/package-lock.json", "**/yarn.lock"],
      language: "json/json",
      name: "@cravingmaker/eslint-config/json",
      plugins: { json: pluginJson },
      rules: {
        ...jsonEslintRules,
        ...jsonRuleOverrides,
      },
    },
    {
      files: [
        "**/*.jsonc",
        "**/tsconfig*.json",
        "**/.vscode/*.json",
        "**/.devcontainer/*.json",
      ],
      language: "json/jsonc",
      name: "@cravingmaker/eslint-config/jsonc",
      plugins: { json: pluginJson },
      rules: {
        ...jsonEslintRules,
        ...jsoncRuleOverrides,
      },
    },
    {
      files: ["**/*.json5"],
      language: "json/json5",
      name: "@cravingmaker/eslint-config/json5",
      plugins: { json: pluginJson },
      rules: {
        ...jsonEslintRules,
        ...json5RuleOverrides,
      },
    },

    {
      files: ["**/*.md"],
      language: "markdown/gfm",
      languageOptions: {
        frontmatter: "yaml",
        math: true,
      },
      name: "@cravingmaker/eslint-config/markdown",
      plugins: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- @eslint/markdown Plugin type is not assignable to Linter.Plugin without assertion
        markdown: pluginMarkdown as unknown as NonNullable<
          Linter.Config["plugins"]
        >[string],
      },
      rules: {
        ...markdownEslintRules,
        ...markdownRuleOverrides,
      },
    },

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
