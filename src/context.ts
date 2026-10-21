import type { Detection, ResolvedOptions } from "./options.js";
import type { Context, Options, ReactRefreshVariant } from "./types.js";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { resolveOptions, resolveProjectRootDirectory } from "./options.js";
import { rejectUnknownOptions } from "./unknown-options.js";

type PreparedConfig = {
  readonly context: Context;
  readonly resolved: ResolvedOptions;
};
/**
 * Derives the shared context from the completed options and the project's declared dependencies.
 */
const buildContext = (
  {
    globals,
    projectRootDirectory,
    svelteComponents,
    typeAware,
    typescript,
  }: ResolvedOptions,
  dependencies: ReadonlySet<string> = new Set(),
): Context => {
  return {
    dependencies,
    globals,
    projectRootDirectory,
    svelteComponents,
    tsconfigRootDir: typescript?.tsconfigRootDir ?? projectRootDirectory,
    typeAware,
  };
};

/**
 * Picks the React Refresh variant for the declared dependencies: Next.js first, then Vite.
 * Without either, React Refresh is off.
 */
const detectReactRefreshVariant = (
  dependencies: ReadonlySet<string>,
): ReactRefreshVariant | false => {
  if (dependencies.has("next")) {
    return "next";
  }
  return dependencies.has("vite") ? "vite" : false;
};

/**
 * Detects what the `"auto"` defaults of `react`, `svelte`, and `express` turn on from the package
 * names that the project declares: a framework is detected when the project declares its package,
 * whatever plugins are installed, and React Refresh follows the bundler that the project declares.
 */
const detectFeatures = (dependencies: ReadonlySet<string>): Detection => {
  return {
    express: dependencies.has("express"),
    react: dependencies.has("react"),
    reactRefresh: detectReactRefreshVariant(dependencies),
    svelte: dependencies.has("svelte"),
  };
};

const isRecord = (
  value: unknown,
): value is Readonly<Record<string, unknown>> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Reads the package names that the manifest at the project root declares in `dependencies`,
 * `devDependencies`, and `peerDependencies`. Like 0.1.0, a manifest that is missing, unreadable,
 * or not valid JSON declares none.
 */
const readDependencies = async (
  projectRootDirectory: string,
): Promise<ReadonlySet<string>> => {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The project root is chosen by the caller.
    const raw = await readFile(
      path.join(projectRootDirectory, "package.json"),
      "utf8",
    );
    const manifest: unknown = JSON.parse(raw);
    if (!isRecord(manifest)) {
      return new Set();
    }
    const { dependencies, devDependencies, peerDependencies } = manifest;
    return new Set(
      [dependencies, devDependencies, peerDependencies].flatMap((field) => {
        return isRecord(field) ? Object.keys(field) : [];
      }),
    );
  } catch {
    return new Set();
  }
};

/**
 * Rejects unknown options before locating the manifest, detects the declared frameworks, and applies defaults once. The factory and its builders share these resolved options and context.
 */
const prepareConfig = async (
  options: Options = {},
): Promise<PreparedConfig> => {
  const knownOptions = rejectUnknownOptions(options);
  const projectRootDirectory = resolveProjectRootDirectory(
    knownOptions.projectRootDirectory,
  );
  const dependencies = await readDependencies(projectRootDirectory);
  const resolved = resolveOptions(
    knownOptions,
    detectFeatures(dependencies),
    projectRootDirectory,
  );
  return { context: buildContext(resolved, dependencies), resolved };
};

/**
 * Builds the context that every feature builder receives: the project root, the package names that its manifest declares, the resolved globals, the Svelte components, the tsconfig directory, and the type-aware scope.
 */
const createContext = async (options: Options = {}): Promise<Context> => {
  const { context } = await prepareConfig(options);
  return context;
};

/**
 * The context of `createConfig()` without options in a project that declares no dependencies.
 * Feature builders fall back to it when they are called on their own, as in tests.
 */
const defaultContext: Context = buildContext(resolveOptions());
export {
  createContext,
  defaultContext,
  detectFeatures,
  detectReactRefreshVariant,
  prepareConfig,
};
