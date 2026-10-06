import { describe, expect, it } from "vitest";

import {
  importPeer,
  isPeerInstalled,
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

  it("names the option to turn off instead when only that option needs the peer", async () => {
    await expect(
      importPeer(
        "@cravingmaker/eslint-config-missing-peer",
        "react",
        "refresh",
      ),
    ).rejects.toThrow(
      'The "react" feature needs "@cravingmaker/eslint-config-missing-peer", which is not installed. Install it, or set `react: { refresh: false }` to turn `refresh` off.',
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

describe("isPeerInstalled", () => {
  it("is true for an installed peer", () => {
    expect(isPeerInstalled("eslint-plugin-react-refresh")).toBe(true);
  });

  it("is false for a missing peer", () => {
    expect(isPeerInstalled("@cravingmaker/eslint-config-missing-peer")).toBe(
      false,
    );
  });
});
