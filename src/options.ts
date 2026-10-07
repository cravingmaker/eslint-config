import type { Linter } from "eslint";
import type {
  Feature,
  FeatureOptions,
  GlobalEnvironment,
  JsonOptions,
  Options,
  ReactOptions,
  ReactRefreshVariant,
  TypeAwareScope,
  TypeScriptOptions,
} from "./types.js";

import process from "node:process";

import globalVariables from "globals";

import { typescriptFiles } from "./globs.js";
import { narrowFiles } from "./utilities/type-aware.js";

/**
What the project uses, for the options whose default is `"auto"`.
*/
type Detection = {
  readonly express: boolean;
  readonly react: boolean;
  readonly reactRefresh: ReactRefreshVariant | false;
  readonly svelte: boolean;
};
/**
The options of `createConfig` with every default applied. A feature that is off is `undefined`.
*/
type ResolvedOptions = {
  readonly comments: FeatureOptions | undefined;
  readonly express: FeatureOptions | undefined;
  readonly functional: FeatureOptions | undefined;
  /**
  The built-in globals, then those of `environments`, then `globals`.
  */
  readonly globals: Readonly<Linter.Globals>;
  readonly html: FeatureOptions | undefined;
  readonly ignores: readonly string[];
  readonly imports: FeatureOptions | undefined;
  readonly javascript: FeatureOptions;
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
  readonly svelte: FeatureOptions | undefined;
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

function resolveDetectedFeature(
  isDetected: boolean,
  value: Feature | "auto" = "auto",
): FeatureOptions | undefined {
  return resolveFeature(value === "auto" ? isDetected : value);
}
function resolveFeature<Settings extends FeatureOptions>(
  value: Feature<Settings> = true,
): Partial<Settings> | undefined {
  if (value === false) return undefined;
  return value === true ? {} : value;
}
function resolveGlobals(
  environments: readonly GlobalEnvironment[],
  globals: Readonly<Linter.Globals> = {},
): Readonly<Linter.Globals> {
  return {
    ...globalVariables.builtin,
    ...Object.fromEntries(
      environments.flatMap((environment) =>
        // eslint-disable-next-line security/detect-object-injection -- Environments are keys of the globals package.
        Object.entries(globalVariables[environment]),
      ),
    ),
    ...globals,
  };
}
/**
Applies the defaults to the options of `createConfig`. Every feature is on unless it is
`false`, except `react`, `svelte`, and `express`, whose `"auto"` default follows `detection`.
*/
function resolveOptions(
  options: Options = {},
  detection: Detection = undetected,
): ResolvedOptions {
  const projectRootDirectory = options.projectRootDirectory ?? process.cwd();

  return {
    comments: resolveFeature(options.comments),
    express: resolveDetectedFeature(detection.express, options.express),
    functional: resolveFeature(options.functional),
    globals: resolveGlobals(options.environments ?? [], options.globals),
    html: resolveFeature(options.html),
    ignores: options.ignores ?? [],
    imports: resolveFeature(options.imports),
    javascript: options.javascript ?? {},
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
    svelte: resolveDetectedFeature(detection.svelte, options.svelte),
    typeAware: resolveTypeAwareScope(options.typescript),
    typescript: resolveTypeScript(projectRootDirectory, options.typescript),
    unicorn: resolveFeature(options.unicorn),
    unusedImports: resolveFeature(options.unusedImports),
  };
}
function resolveReact(
  detection: Detection,
  value: Feature<ReactOptions> | "auto" = "auto",
): ResolvedReactOptions | undefined {
  const react = resolveFeature(value === "auto" ? detection.react : value);
  if (react === undefined) return undefined;

  const { refresh = "auto" } = react;
  return {
    ...react,
    refresh: refresh === "auto" ? detection.reactRefresh : refresh,
  };
}
/**
Resolves the files that the parser reads with type information and that get type-aware rules:
`filesTypeAware` without `ignoresTypeAware`, within the files that the TypeScript feature
parses, because type information needs its parser.
*/
function resolveTypeAwareScope(
  value: Feature<TypeScriptOptions> = true,
): TypeAwareScope | undefined {
  const typescript = resolveFeature(value);
  if (typescript?.typeChecked !== true) return undefined;

  const {
    files = typescriptFiles,
    filesTypeAware,
    ignores = [],
    ignoresTypeAware = [],
  } = typescript;
  return {
    files:
      filesTypeAware === undefined ? files : narrowFiles(filesTypeAware, files),
    ignores: [...ignores, ...ignoresTypeAware],
  };
}
function resolveTypeScript(
  projectRootDirectory: string,
  value: Feature<TypeScriptOptions> = true,
): ResolvedTypeScriptOptions | undefined {
  const typescript = resolveFeature(value);
  if (typescript === undefined) return undefined;

  return {
    ...typescript,
    tsconfigRootDir: typescript.tsconfigRootDir ?? projectRootDirectory,
    typeChecked: typescript.typeChecked ?? false,
  };
}

export { resolveOptions };
export type {
  Detection,
  ResolvedOptions,
  ResolvedReactOptions,
  ResolvedTypeScriptOptions,
};
