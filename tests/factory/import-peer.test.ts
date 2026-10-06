/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import { describe, expect, it } from "vitest";

import {
  importOptionalPeer,
  importPeer,
} from "../../src/utilities/import-peer.js";

describe("importPeer", () => {
  it("imports an installed peer", async () => {
    const module = await importPeer<{ readonly reactRefresh?: unknown }>(
      "eslint-plugin-react-refresh",
      "react",
    );

    expect(module.reactRefresh).toBeDefined();
  });

  it("names the package to install when the peer is missing", async () => {
    const result = importPeer(
      "@cravingmaker/eslint-config-missing-peer",
      "react",
    );

    await expect(result).rejects.toThrow(
      'The "react" feature needs "@cravingmaker/eslint-config-missing-peer", which is not installed. Install it, or set `react: false` to turn the feature off.',
    );
    await expect(result).rejects.toHaveProperty(
      "cause.code",
      "ERR_MODULE_NOT_FOUND",
    );
  });

  it("does not catch an error that the peer throws while it loads", async () => {
    await expect(
      importPeer(
        "data:text/javascript,throw new Error('broken optional peer')",
        "express",
      ),
    ).rejects.toThrow("broken optional peer");
  });

  it("does not catch a resolution error other than a missing package", async () => {
    await expect(
      importPeer("eslint-plugin-react-refresh/not-exported", "react"),
    ).rejects.toHaveProperty("code", "ERR_PACKAGE_PATH_NOT_EXPORTED");
  });
});

describe("importOptionalPeer", () => {
  it("imports an installed peer", async () => {
    const module = await importOptionalPeer<{
      readonly reactRefresh?: unknown;
    }>("eslint-plugin-react-refresh");

    expect(module?.reactRefresh).toBeDefined();
  });

  it("returns undefined when the peer is missing", async () => {
    await expect(
      importOptionalPeer("@cravingmaker/eslint-config-missing-peer"),
    ).resolves.toBeUndefined();
  });

  it("does not catch an error that the peer throws while it loads", async () => {
    await expect(
      importOptionalPeer(
        "data:text/javascript,throw new Error('broken optional peer')",
      ),
    ).rejects.toThrow("broken optional peer");
  });
});
