import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import reference from "./actionlint-reference.json" with { type: "json" };

/**
 * @typedef {(typeof reference.releases)[number]} Release
 */

const projectDirectory = fileURLToPath(
  new globalThis.URL("..", import.meta.url),
);
const execute = promisify(execFile);
const timeout = 30_000;

/**
 * @param {Uint8Array} bytes
 */
const sha256 = (bytes) => {
  return createHash("sha256").update(bytes).digest("hex");
};

/**
 * @param {unknown} error
 * @param {string} code
 */
const hasCode = (error, code) => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
};

// Assertions throw synchronously; the asynchronous steps only compose them.

/**
 * @returns {Release}
 */
const pinnedRelease = () => {
  const release = reference.releases.find((candidate) => {
    return (
      candidate.platform === process.platform && candidate.arch === process.arch
    );
  });
  if (!release) {
    throw new Error(
      `The pinned workflow tool has no binary for ${process.platform}/${process.arch}`,
    );
  }
  return release;
};

/**
 * @param {Uint8Array} bytes
 * @param {string} expected
 * @param {string} message
 */
const assertChecksum = (bytes, expected, message) => {
  if (sha256(bytes) !== expected) {
    throw new Error(message);
  }
};

/**
 * @param {Response} response
 * @param {string} url
 */
const assertDownloaded = (response, url) => {
  if (!response.ok) {
    throw new Error(
      `Download pinned actionlint: HTTP ${String(response.status)} from ${url}`,
    );
  }
};

/**
 * @param {boolean} installed
 * @param {string} binary
 */
const assertInstalled = (installed, binary) => {
  if (!installed) {
    throw new Error(`Installed actionlint is missing: ${binary}`);
  }
};

/**
 * Whether the cache holds the pinned binary. Other content fails instead of being replaced, because the cache may hold user files.
 *
 * @param {string} binary
 * @param {string} expected
 * @returns {Promise<boolean>}
 */
const isCached = async (binary, expected) => {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The path is the pinned cache entry below the project's ignored `.tools/` directory.
    const bytes = await fs.readFile(binary);
    assertChecksum(
      bytes,
      expected,
      `Cached actionlint does not match the pinned binary: ${binary}. Remove this cache directory and rerun lint:workflows.`,
    );
    return true;
  } catch (error) {
    if (hasCode(error, "ENOENT")) {
      return false;
    }
    // eslint-disable-next-line functional/no-promise-reject -- A mismatched cache or an unreadable binary must stop the check.
    throw error;
  }
};

/**
 * @param {string} source
 * @param {string} target
 */
const copyOnce = async (source, target) => {
  try {
    await fs.copyFile(source, target, constants.COPYFILE_EXCL);
  } catch (error) {
    // A concurrent run installed the same verified binary first.
    if (!hasCode(error, "EEXIST")) {
      // eslint-disable-next-line functional/no-promise-reject -- Any other copy failure must stop the installation.
      throw error;
    }
  }
};

/**
 * @param {string} staging
 * @param {Release} release
 */
const downloadAndExtract = async (staging, release) => {
  const url = `https://github.com/rhysd/actionlint/releases/download/v${reference.version}/${release.archive}`;
  const response = await globalThis.fetch(url, {
    signal: globalThis.AbortSignal.timeout(timeout),
  });
  assertDownloaded(response, url);
  const bytes = new Uint8Array(await response.arrayBuffer());
  assertChecksum(
    bytes,
    release.archiveSha256,
    `Pinned actionlint archive checksum mismatch: ${release.archive}`,
  );
  // Extract the verified archive from standard input, so downloaded data is never written to a file.
  const extraction = execute(
    "tar",
    ["-xzf", "-", "-C", staging, "actionlint"],
    { maxBuffer: 1024 * 1024, timeout },
  );
  extraction.child.stdin?.end(bytes);
  await extraction;
  const extracted = path.join(staging, "actionlint");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The binary was just extracted into the staging directory.
  const extractedBytes = await fs.readFile(extracted);
  assertChecksum(
    extractedBytes,
    release.binarySha256,
    `Pinned actionlint binary checksum mismatch: ${release.archive}`,
  );
  return extracted;
};

/**
 * @param {string} tools
 * @param {string} binary
 * @param {Release} release
 */
const install = async (tools, binary, release) => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- `.tools/` is the project's ignored tool cache.
  await fs.mkdir(tools, { recursive: true });
  const staging = await fs.mkdtemp(path.join(tools, ".actionlint-"));
  try {
    const extracted = await downloadAndExtract(staging, release);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The cache directory is pinned below the project's ignored `.tools/` directory.
    await fs.mkdir(path.dirname(binary), { recursive: true });
    await copyOnce(extracted, binary);
  } finally {
    await fs.rm(staging, { force: true, recursive: true });
  }
};

/**
 * Returns the pinned actionlint binary, downloading and verifying it on first use.
 *
 * @param {string} [root]
 * @returns {Promise<string>}
 */
const ensureActionlint = async (root = projectDirectory) => {
  const release = pinnedRelease();
  const tools = path.join(root, ".tools");
  const binary = path.join(
    tools,
    `actionlint-${reference.version}-${process.platform}-${process.arch}`,
    "actionlint",
  );
  if (await isCached(binary, release.binarySha256)) {
    return binary;
  }
  await install(tools, binary, release);
  assertInstalled(await isCached(binary, release.binarySha256), binary);
  return binary;
};

export { ensureActionlint, projectDirectory };
