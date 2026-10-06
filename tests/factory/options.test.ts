/* eslint-disable functional/no-expression-statements, functional/no-return-void -- Vitest suites are side-effect driven */

import process from "node:process";

import globalVariables from "globals";
import { describe, expect, it } from "vitest";

import { typescriptFiles } from "../../src/globs.js";
import { resolveOptions } from "../../src/options.js";

const featuresOnByDefault = [
  "comments",
  "functional",
  "html",
  "imports",
  "json",
  "markdown",
  "node",
  "packageJson",
  "perfectionist",
  "promise",
  "regexp",
  "security",
  "unicorn",
  "unusedImports",
] as const;
const allDetected = {
  express: true,
  react: true,
  reactRefresh: "vite",
  svelte: true,
} as const;

describe("resolveOptions", () => {
  it.each(featuresOnByDefault)("turns %s on by default", (feature) => {
    expect(resolveOptions()).toHaveProperty(feature, {});
  });

  it("turns a feature off with false, on with true, and on with its options", () => {
    const resolved = resolveOptions({
      comments: false,
      html: true,
      json: { overridesJsonc: { "json/no-empty-keys": "off" } },
    });

    expect(resolved.comments).toBeUndefined();
    expect(resolved.html).toEqual({});
    expect(resolved.json).toEqual({
      overridesJsonc: { "json/no-empty-keys": "off" },
    });
  });

  it("applies the defaults of the options that are not features", () => {
    const resolved = resolveOptions();

    expect(resolved.globals).toEqual(globalVariables.builtin);
    expect(resolved.ignores).toEqual([]);
    expect(resolved.javascript).toEqual({});
    expect(resolved.projectRootDirectory).toBe(process.cwd());
  });

  it("turns the auto features on only when they are detected", () => {
    const undetected = resolveOptions();
    const detected = resolveOptions({}, allDetected);

    expect(undetected.express).toBeUndefined();
    expect(undetected.react).toBeUndefined();
    expect(undetected.svelte).toBeUndefined();
    expect(detected.express).toEqual({});
    expect(detected.react).toEqual({ refresh: "vite" });
    expect(detected.svelte).toEqual({});
  });

  it("lets an explicit value beat detection", () => {
    const disabled = resolveOptions(
      { express: false, react: false, svelte: false },
      allDetected,
    );
    const enabled = resolveOptions({
      express: true,
      react: { files: ["app/**/*.tsx"] },
      svelte: true,
    });

    expect(disabled.express).toBeUndefined();
    expect(disabled.react).toBeUndefined();
    expect(disabled.svelte).toBeUndefined();
    expect(enabled.express).toEqual({});
    expect(enabled.react).toEqual({ files: ["app/**/*.tsx"], refresh: false });
    expect(enabled.svelte).toEqual({});
  });

  it("detects the React Refresh variant unless it is set", () => {
    const detection = { ...allDetected, reactRefresh: "next" } as const;

    expect(resolveOptions({}, detection).react?.refresh).toBe("next");
    expect(
      resolveOptions({ react: { refresh: "auto" } }, detection).react?.refresh,
    ).toBe("next");
    expect(
      resolveOptions({ react: { refresh: "vite" } }, detection).react?.refresh,
    ).toBe("vite");
    expect(
      resolveOptions({ react: { refresh: false } }, detection).react?.refresh,
    ).toBe(false);
  });

  it("resolves the TypeScript defaults from the project root", () => {
    const resolved = resolveOptions({ projectRootDirectory: "/project" });

    expect(resolved.typescript).toEqual({
      tsconfigRootDir: "/project",
      typeChecked: false,
    });
    expect(resolved.typeAware).toBeUndefined();
  });

  it("scopes type-aware rules to TypeScript files when type checking is on", () => {
    expect(
      resolveOptions({ typescript: { typeChecked: true } }).typeAware,
    ).toEqual({ files: typescriptFiles, ignores: [] });
    expect(
      resolveOptions({
        typescript: {
          filesTypeAware: ["src/**/*.ts"],
          ignoresTypeAware: ["src/**/*.test.ts"],
          typeChecked: true,
        },
      }).typeAware,
    ).toEqual({ files: ["src/**/*.ts"], ignores: ["src/**/*.test.ts"] });
  });

  it("has no TypeScript options or type-aware scope when TypeScript is off", () => {
    const resolved = resolveOptions({ typescript: false });

    expect(resolved.typescript).toBeUndefined();
    expect(resolved.typeAware).toBeUndefined();
  });

  it("merges the built-in, environment, and custom globals in that order", () => {
    const { globals } = resolveOptions({
      environments: ["browser"],
      globals: { myGlobal: "readonly", window: "off" },
    });

    expect(globals.Promise).toBe(false);
    expect(globals.document).toBe(false);
    expect(globals.myGlobal).toBe("readonly");
    expect(globals.window).toBe("off");
  });
});
