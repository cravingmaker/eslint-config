import type { Linter } from "eslint";
import type globalVariables from "globals";
import type { RuleOptions } from "./typegen.js";

/**
Information every feature builder receives, resolved once per `createConfig` call.
*/
type Context = {
  /**
  Package names declared in the manifest at the project root.
  */
  readonly dependencies: ReadonlySet<string>;
  /**
  Globals for JavaScript, TypeScript, and Svelte files, from `environments` and `globals`.
  */
  readonly globals: Readonly<Linter.Globals>;
  /**
  The directory that holds the consumer's `package.json`.
  */
  readonly projectRootDirectory: string;
  /**
  Files that receive type-aware rules, or `undefined` when typed linting is off.
  */
  readonly typeAware: TypeAwareScope | undefined;
};
/**
A feature that is off (`false`), on with its defaults (`true`), or on with options.
*/
type Feature<Settings extends FeatureOptions = FeatureOptions> =
  boolean | Settings;
/**
Options that every feature accepts.
*/
type FeatureOptions = {
  /**
  File patterns for the feature, instead of its defaults.
  */
  readonly files?: readonly string[];
  /**
  File patterns to exclude from the feature without ignoring them globally.
  */
  readonly ignores?: readonly string[];
  /**
  Rule settings applied after the feature's own rules.
  */
  readonly overrides?: Rules;
};
/**
A runtime environment from the `globals` package, such as `"browser"` or `"node"`.
*/
type GlobalEnvironment = keyof typeof globalVariables;
/**
Options of the `json` feature.
*/
type JsonOptions = FeatureOptions & {
  /**
  Rule settings for JSON5 files.
  */
  readonly overridesJson5?: Rules;
  /**
  Rule settings for JSONC files.
  */
  readonly overridesJsonc?: Rules;
};
/**
Options for `createConfig`. A feature defaults to `true`, except `react`, `svelte`, and
`express`, which default to `"auto"`: on when the project uses them.
*/
type Options = {
  readonly comments?: Feature;
  /**
  Runtime environments whose globals are available.
  */
  readonly environments?: readonly GlobalEnvironment[];
  readonly express?: Feature | "auto";
  readonly functional?: Feature;
  /**
  Extra globals, or overrides for the ones from `environments`.
  */
  readonly globals?: Readonly<Linter.Globals>;
  readonly html?: Feature;
  /**
  Extra global ignore patterns.
  */
  readonly ignores?: readonly string[];
  readonly imports?: Feature;
  /**
  ESLint's core rules. Always on.
  */
  readonly javascript?: FeatureOptions;
  readonly json?: Feature<JsonOptions>;
  readonly markdown?: Feature;
  readonly node?: Feature;
  readonly packageJson?: Feature;
  readonly perfectionist?: Feature;
  /**
  The directory that holds the consumer's `package.json`. Defaults to `process.cwd()`.
  */
  readonly projectRootDirectory?: string;
  readonly promise?: Feature;
  readonly react?: Feature<ReactOptions> | "auto";
  readonly regexp?: Feature;
  readonly security?: Feature;
  readonly svelte?: Feature | "auto";
  readonly typescript?: Feature<TypeScriptOptions>;
  readonly unicorn?: Feature;
  readonly unusedImports?: Feature;
};
/**
Options of the `react` feature.
*/
type ReactOptions = FeatureOptions & {
  /**
  The React Refresh rule variant. `"auto"`, the default, detects it from the project.
  */
  readonly refresh?: ReactRefreshVariant | "auto" | false;
};
/**
A React Refresh rule variant, which decides the exports that are allowed next to components.
*/
type ReactRefreshVariant = "generic" | "next" | "vite";
/**
An option of a rule with generated types: its options object, or one entry of a rule that
accepts a list of options objects.
*/
type RuleOptionOf<RuleId extends keyof RuleOptions> =
  RuleOptionsOf<RuleId>[number];
/**
The options that follow the severity in the settings of a rule with generated types.
*/
type RuleOptionsOf<RuleId extends keyof RuleOptions> =
  NonNullable<RuleOptions[RuleId]> extends Linter.RuleEntry<infer OptionList>
    ? OptionList
    : never;
/**
Rule settings by rule ID. Rules of the bundled plugins are checked against their option
schemas; any other rule ID is accepted, for plugins added in user configs.
*/
type Rules = Record<string, Linter.RuleEntry | undefined> & RuleOptions;
/**
Files that receive type-aware rules.
*/
type TypeAwareScope = {
  readonly files: readonly string[];
  readonly ignores: readonly string[];
};
/**
Options of the `typescript` feature.
*/
type TypeScriptOptions = FeatureOptions & {
  /**
  File patterns for type-aware rules, instead of every TypeScript file.
  */
  readonly filesTypeAware?: readonly string[];
  /**
  File patterns to exclude from type-aware rules.
  */
  readonly ignoresTypeAware?: readonly string[];
  /**
  Rule settings applied after the type-aware rules.
  */
  readonly overridesTypeAware?: Rules;
  /**
  The directory that holds `tsconfig.json`. Defaults to `projectRootDirectory`.
  */
  readonly tsconfigRootDir?: string;
  /**
  Whether to lint with type information. Defaults to `false`.
  */
  readonly typeChecked?: boolean;
};

export type {
  Context,
  Feature,
  FeatureOptions,
  GlobalEnvironment,
  JsonOptions,
  Options,
  ReactOptions,
  ReactRefreshVariant,
  RuleOptionOf,
  RuleOptionsOf,
  Rules,
  TypeAwareScope,
  TypeScriptOptions,
};
