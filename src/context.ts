import type { Detection } from "./options.js";
import type { Context, Options, ReactRefreshVariant } from "./types.js";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { resolveOptions } from "./options.js";

/**
Builds the context for `options` in a project whose manifest declares `dependencies`.
*/
function buildContext(
  options: Options = {},
  dependencies: ReadonlySet<string> = new Set(),
): Context {
  const { globals, projectRootDirectory, typeAware, typescript } =
    resolveOptions(options);

  return {
    dependencies,
    globals,
    projectRootDirectory,
    tsconfigRootDir: typescript?.tsconfigRootDir ?? projectRootDirectory,
    typeAware,
  };
}
/**
Builds the context that every feature builder receives: the project root, the package names
that its manifest declares, the resolved globals, the tsconfig directory, and the type-aware
scope.
*/
async function createContext(options: Options = {}): Promise<Context> {
  const { projectRootDirectory } = resolveOptions(options);

  return buildContext(options, await readDependencies(projectRootDirectory));
}
/**
Detects what the `"auto"` defaults of `react`, `svelte`, and `express` turn on from the package
names that the project declares: a framework is detected when the project declares its package,
whatever plugins are installed, and React Refresh follows the bundler that the project declares.
*/
function detectFeatures(dependencies: ReadonlySet<string>): Detection {
  return {
    express: dependencies.has("express"),
    react: dependencies.has("react"),
    reactRefresh: detectReactRefreshVariant(dependencies),
    svelte: dependencies.has("svelte"),
  };
}
/**
Picks the React Refresh variant for the declared dependencies: Next.js first, then Vite.
Without either, React Refresh is off.
*/
function detectReactRefreshVariant(
  dependencies: ReadonlySet<string>,
): ReactRefreshVariant | false {
  if (dependencies.has("next")) return "next";
  return dependencies.has("vite") ? "vite" : false;
}
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
Reads the package names that the manifest at the project root declares in `dependencies`,
`devDependencies`, and `peerDependencies`. Like 0.1.0, a manifest that is missing, unreadable,
or not valid JSON declares none.
*/
async function readDependencies(
  projectRootDirectory: string,
): Promise<ReadonlySet<string>> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The project root is chosen by the caller.
    const raw = await readFile(
      path.join(projectRootDirectory, "package.json"),
      "utf8",
    );
    const manifest: unknown = JSON.parse(raw);
    if (!isRecord(manifest)) return new Set();

    const { dependencies, devDependencies, peerDependencies } = manifest;
    return new Set(
      [dependencies, devDependencies, peerDependencies].flatMap((field) =>
        isRecord(field) ? Object.keys(field) : [],
      ),
    );
  } catch {
    return new Set();
  }
}

/**
The context of `createConfig()` without options in a project that declares no dependencies.
Feature builders fall back to it when they are called on their own, as in tests.
*/
const defaultContext: Context = buildContext();

export {
  createContext,
  defaultContext,
  detectFeatures,
  detectReactRefreshVariant,
};
