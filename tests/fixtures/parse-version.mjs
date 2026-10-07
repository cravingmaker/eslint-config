const versionPattern = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)$/v;

/**
Reads the major, minor, and patch numbers of a version such as "24.15.0", or returns `undefined`
for any other text.
*/
export function parseVersion(text) {
  const groups = versionPattern.exec(text)?.groups;
  return groups === undefined
    ? undefined
    : {
        major: Number(groups.major),
        minor: Number(groups.minor),
        patch: Number(groups.patch),
      };
}
