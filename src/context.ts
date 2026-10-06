import type { Context, Options, ReactRefreshVariant } from "./types.js";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { resolveOptions } from "./options.js";

/**
Builds the context that every feature builder receives: the project root, the package names
that its manifest declares, the resolved globals, and the type-aware scope.
*/
async function createContext(options: Options = {}): Promise<Context> {
  const { globals, projectRootDirectory, typeAware } = resolveOptions(options);

  return {
    dependencies: await readDependencies(projectRootDirectory),
    globals,
    projectRootDirectory,
    typeAware,
  };
}
/**
Picks the React Refresh variant for the declared dependencies: Next.js first, then Vite,
otherwise the generic variant.
*/
function detectReactRefreshVariant(
  dependencies: ReadonlySet<string>,
): ReactRefreshVariant {
  if (dependencies.has("next")) return "next";
  return dependencies.has("vite") ? "vite" : "generic";
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

export { createContext, detectReactRefreshVariant };
