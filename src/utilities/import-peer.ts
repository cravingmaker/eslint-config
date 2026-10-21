const isModuleNotFound = (error: unknown): boolean => {
  return (
    Error.isError(error) &&
    "code" in error &&
    error.code === "ERR_MODULE_NOT_FOUND"
  );
};

const resolvePeer = (
  packageName: string,
  feature: string,
  option?: string,
): string => {
  try {
    return import.meta.resolve(packageName);
  } catch (error) {
    if (!isModuleNotFound(error)) {
      // eslint-disable-next-line functional/no-throw-statements -- Preserve failures other than an absent optional peer.
      throw error;
    }
    const alternative =
      typeof option === "undefined"
        ? `set \`${feature}: false\` to turn the feature off`
        : `set \`${feature}: { ${option}: false }\` to turn \`${option}\` off`;
    // eslint-disable-next-line functional/no-throw-statements -- A feature that is on cannot work without its peer.
    throw new Error(
      `The "${feature}" feature needs "${packageName}", which is not installed. Install it, or ${alternative}.`,
      { cause: error },
    );
  }
};

/**
 * Imports an optional peer dependency that an enabled feature needs. A missing peer fails with
 * a message that names the package to install and the setting that turns off what needs it: the
 * whole feature, or only `option` when nothing else in the feature needs the peer. Any other
 * failure, such as a peer that throws while it loads, is not caught.
 */
const importPeer = async <Module>(
  packageName: string,
  feature: string,
  option?: string,
): Promise<Module> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- A dynamic import cannot be typed statically.
  return (await import(resolvePeer(packageName, feature, option))) as Module;
};

export { importPeer };
