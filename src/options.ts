import type { Linter } from "eslint";
import type {
  Feature,
  FeatureOptions,
  GlobalEnvironment,
  ImportsOptions,
  JsonOptions,
  Options,
  ReactOptions,
  ReactRefreshVariant,
  TypeAwareScope,
  TypeScriptOptions,
} from "./types.js";

import path from "node:path";
import process from "node:process";

import globalVariables from "globals";

import {
  javascriptRuneModuleFiles,
  svelteComponentFiles,
  typescriptFiles,
} from "./globs.js";
import { narrowFiles, withoutIgnores } from "./utilities/file-scope.js";

/**
 * What the project uses, for the options whose default is `"auto"`.
 */
type Detection = {
  readonly express: boolean;
  readonly react: boolean;
  readonly reactRefresh: ReactRefreshVariant | false;
  readonly svelte: boolean;
};
/**
 * The options of `createConfig` with every default applied. A feature that is off is `undefined`.
 */
type ResolvedOptions = {
  readonly comments: FeatureOptions | undefined;
  readonly express: FeatureOptions | undefined;
  readonly functional: FeatureOptions | undefined;
  /**
   * The built-in globals, then those of `environments`, then `globals`.
   */
  readonly globals: Readonly<Linter.Globals>;
  readonly html: FeatureOptions | undefined;
  readonly ignores: readonly string[];
  readonly imports: ImportsOptions | undefined;
  readonly javascript: FeatureOptions;
  /**
   * The JavaScript rune modules that the Svelte feature parses, which typescript-eslint's parser reads without type information.
   */
  readonly javascriptRuneModules: ReadonlyArray<string | readonly string[]>;
  readonly json: JsonOptions | undefined;
  readonly markdown: FeatureOptions | undefined;
  readonly node: FeatureOptions | undefined;
  readonly packageJson: FeatureOptions | undefined;
  readonly perfectionist: FeatureOptions | undefined;
  readonly projectRootDirectory: string;
  readonly promise: FeatureOptions | undefined;
  readonly react: ResolvedReactOptions | undefined;
  readonly regexp: FeatureOptions | undefined;
  readonly security: FeatureOptions | undefined;
  readonly sonarjs: FeatureOptions | undefined;
  readonly stylistic: FeatureOptions | undefined;
  readonly svelte: FeatureOptions | undefined;
  /**
   * The Svelte components whose scripts the features for JavaScript and TypeScript sources lint.
   */
  readonly svelteComponents: ReadonlyArray<string | readonly string[]>;
  readonly typeAware: TypeAwareScope | undefined;
  readonly typescript: ResolvedTypeScriptOptions | undefined;
  readonly unicorn: FeatureOptions | undefined;
  readonly unusedImports: FeatureOptions | undefined;
};
type ResolvedReactOptions = Omit<ReactOptions, "refresh"> & {
  readonly refresh: ReactRefreshVariant | false;
};
type ResolvedTypeScriptOptions = Omit<
  TypeScriptOptions,
  "tsconfigRootDir" | "typeChecked"
> & {
  readonly tsconfigRootDir: string;
  readonly typeChecked: boolean;
};
const undetected: Detection = {
  express: false,
  react: false,
  reactRefresh: false,
  svelte: false,
};
const resolveFeature = <Settings extends FeatureOptions>(
  value: Feature<Settings> = true,
): Partial<Settings> | undefined => {
  if (value === false) {
    return;
  }
  return value === true ? {} : value;
};

const resolveDetectedFeature = (
  isDetected: boolean,
  value: Feature | "auto" = "auto",
): FeatureOptions | undefined => {
  return resolveFeature(value === "auto" ? isDetected : value);
};

const resolveGlobals = (
  environments: readonly GlobalEnvironment[],
  globals: Readonly<Linter.Globals> = {},
): Readonly<Linter.Globals> => {
  return {
    ...globalVariables.builtin,
    ...Object.fromEntries(
      environments.flatMap((environment) => {
        // eslint-disable-next-line security/detect-object-injection -- Environment names are limited to the keys of globals by the public type.
        return Object.entries(globalVariables[environment]);
      }),
    ),
    ...globals,
  };
};

/**
 * Resolves the manifest directory without applying any feature defaults.
 */
const resolveProjectRootDirectory = (projectRootDirectory?: string): string => {
  return path.resolve(projectRootDirectory ?? process.cwd());
};

const resolveReact = (
  detection: Detection,
  value: Feature<ReactOptions> | "auto" = "auto",
): ResolvedReactOptions | undefined => {
  const react = resolveFeature(value === "auto" ? detection.react : value);
  if (typeof react === "undefined") {
    return;
  }
  const { refresh = "auto" } = react;
  return {
    ...react,
    refresh: refresh === "auto" ? detection.reactRefresh : refresh,
  };
};

/**
 * Resolves the files among `patterns` that svelte-eslint-parser reads: those among the Svelte feature's files, without its ignores. None while the Svelte feature is off.
 */
const resolveSvelteScope = (
  svelte: FeatureOptions | undefined,
  patterns: readonly string[],
): ReadonlyArray<string | readonly string[]> => {
  if (typeof svelte === "undefined") {
    return [];
  }
  const { files, ignores = [] } = svelte;
  return withoutIgnores(narrowFiles(patterns, files), ignores);
};

/**
 * Resolves the files that the parser reads with type information and that get type-aware rules:
 * `filesTypeAware` without `ignoresTypeAware`, within the TypeScript sources that the TypeScript
 * feature parses, because type information needs its parser, and without Svelte components, whose
 * parser reads none, whatever `files` names. Each list of ignores is applied on its own, so a
 * negated pattern brings back only what its own list left out. None while the TypeScript feature
 * or typed linting is off.
 */
const resolveTypeAwareScope = (
  typescript: ResolvedTypeScriptOptions | undefined,
): TypeAwareScope | undefined => {
  if (typescript?.typeChecked !== true) {
    return;
  }
  const {
    files,
    filesTypeAware,
    ignores = [],
    ignoresTypeAware = [],
  } = typescript;
  // The files that typescript-eslint parses itself: the TypeScript sources among the files of
  // the feature, without components.
  const parsed = withoutIgnores(
    withoutIgnores(narrowFiles(typescriptFiles, files), svelteComponentFiles),
    ignores,
  );
  return withoutIgnores(narrowFiles(parsed, filesTypeAware), ignoresTypeAware);
};

/**
 * Applies the defaults to the options of the TypeScript feature. Typed linting is on unless
 * `typeChecked` is `false`. typescript-eslint takes an absolute `tsconfigRootDir` only, so the
 * tsconfig directory becomes an absolute path: a relative one is resolved from the working
 * directory, as the project root is, and not from that root.
 */
const resolveTypeScript = (
  projectRootDirectory: string,
  value: Feature<TypeScriptOptions> = true,
): ResolvedTypeScriptOptions | undefined => {
  const typescript = resolveFeature(value);
  if (typeof typescript === "undefined") {
    return;
  }
  return {
    ...typescript,
    tsconfigRootDir: path.resolve(
      typescript.tsconfigRootDir ?? projectRootDirectory,
    ),
    typeChecked: typescript.typeChecked !== false,
  };
};

/**
 * Applies the defaults to the options of `createConfig`. Every feature is on unless it is
 * `false`, except `react`, `svelte`, and `express`, whose `"auto"` default follows `detection`.
 * The project root becomes an absolute path: a relative one is resolved from the working directory, which is also its default. Preparation passes the root it used to read the manifest.
 */
const resolveOptions = (
  options: Options = {},
  detection: Detection = undetected,
  projectRootDirectory: string = resolveProjectRootDirectory(
    options.projectRootDirectory,
  ),
): ResolvedOptions => {
  const svelte = resolveDetectedFeature(detection.svelte, options.svelte);
  const typescript = resolveTypeScript(
    projectRootDirectory,
    options.typescript,
  );
  return {
    comments: resolveFeature(options.comments),
    express: resolveDetectedFeature(detection.express, options.express),
    functional: resolveFeature(options.functional),
    globals: resolveGlobals(options.environments ?? [], options.globals),
    html: resolveFeature(options.html),
    ignores: options.ignores ?? [],
    imports: resolveFeature(options.imports),
    javascript: options.javascript ?? {},
    javascriptRuneModules: resolveSvelteScope(
      svelte,
      javascriptRuneModuleFiles,
    ),
    json: resolveFeature(options.json),
    markdown: resolveFeature(options.markdown),
    node: resolveFeature(options.node),
    packageJson: resolveFeature(options.packageJson),
    perfectionist: resolveFeature(options.perfectionist),
    projectRootDirectory,
    promise: resolveFeature(options.promise),
    react: resolveReact(detection, options.react),
    regexp: resolveFeature(options.regexp),
    security: resolveFeature(options.security),
    sonarjs: resolveFeature(options.sonarjs),
    stylistic: resolveFeature(options.stylistic),
    svelte,
    svelteComponents: resolveSvelteScope(svelte, svelteComponentFiles),
    typeAware: resolveTypeAwareScope(typescript),
    typescript,
    unicorn: resolveFeature(options.unicorn),
    unusedImports: resolveFeature(options.unusedImports),
  };
};

export { resolveOptions, resolveProjectRootDirectory };
export type { Detection, ResolvedOptions };
