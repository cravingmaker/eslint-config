/**
Imports an optional peer dependency, or returns `undefined` when it is not installed, as 0.1.0
does for every integration. Any other failure, such as a peer that throws while it loads, is not
caught.
*/
async function importOptionalPeer<Module>(
  packageName: string,
): Promise<Module | undefined> {
  const specifier = resolveOptionalPeer(packageName);
  if (specifier === undefined) return undefined;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- A dynamic import cannot be typed statically.
  return (await import(specifier)) as Module;
}
/**
Imports an optional peer dependency that an enabled feature needs. A missing peer fails with
a message that names the package to install. Any other failure, such as a peer that throws
while it loads, is not caught.
*/
async function importPeer<Module>(
  packageName: string,
  feature: string,
): Promise<Module> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- A dynamic import cannot be typed statically.
  return (await import(resolvePeer(packageName, feature))) as Module;
}
function isModuleNotFound(error: unknown): boolean {
  return (
    Error.isError(error) &&
    "code" in error &&
    error.code === "ERR_MODULE_NOT_FOUND"
  );
}
function resolveOptionalPeer(packageName: string): string | undefined {
  try {
    return import.meta.resolve(packageName);
  } catch (error) {
    // eslint-disable-next-line functional/no-throw-statements -- Resolution failures other than a missing package must stay visible.
    if (!isModuleNotFound(error)) throw error;
    return undefined;
  }
}
function resolvePeer(packageName: string, feature: string): string {
  try {
    return import.meta.resolve(packageName);
  } catch (error) {
    // eslint-disable-next-line functional/no-throw-statements -- Resolution failures other than a missing package must stay visible.
    if (!isModuleNotFound(error)) throw error;
    // eslint-disable-next-line functional/no-throw-statements -- A feature that is on cannot work without its peer.
    throw new Error(
      `The "${feature}" feature needs "${packageName}", which is not installed. Install it, or set \`${feature}: false\` to turn the feature off.`,
      { cause: error },
    );
  }
}

export { importOptionalPeer, importPeer };
