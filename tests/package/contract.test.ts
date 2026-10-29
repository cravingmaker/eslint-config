/* eslint-disable perfectionist/sort-arrays, perfectionist/sort-modules, perfectionist/sort-objects -- Contract fixtures mirror manifest field order and keep related declarations together. */

import { readdir, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

type StringRecord = Readonly<Record<string, string>>;
type PackageManifest = {
  readonly dependencies: StringRecord;
  readonly devDependencies: StringRecord;
  readonly devEngines: {
    readonly packageManager: {
      readonly name: string;
      readonly onFail: string;
      readonly version: string;
    };
    readonly runtime: {
      readonly name: string;
      readonly onFail: string;
      readonly version: string;
    };
  };
  readonly engines: StringRecord;
  readonly exports: {
    readonly ".": {
      readonly default?: string;
      readonly import?: string;
      readonly types?: string;
    };
    readonly "./package.json": string;
  };
  readonly files: readonly string[];
  readonly main: string;
  readonly peerDependencies: StringRecord;
  readonly peerDependenciesMeta: Readonly<
    Record<string, { readonly optional?: boolean }>
  >;
  readonly private: boolean;
  readonly publishConfig: StringRecord;
  readonly sideEffects: boolean;
  readonly type: string;
  readonly types: string;
};
type PackageLock = {
  readonly packages: Readonly<
    Record<
      string,
      {
        readonly dependencies?: StringRecord;
        readonly devDependencies?: StringRecord;
        readonly engines?: StringRecord;
        readonly peerDependencies?: StringRecord;
        readonly peerDependenciesMeta?: Readonly<
          Record<string, { readonly optional?: boolean }>
        >;
      }
    >
  >;
};

const expectedOptionalPeerDependencies = [
  "@html-eslint/eslint-plugin-react",
  "@html-eslint/eslint-plugin-svelte",
  "@vitest/eslint-plugin",
  "eslint-plugin-express-security",
  "eslint-plugin-react-hooks",
  "eslint-plugin-react-refresh",
  "react",
  "svelte",
  "svelte-eslint-parser",
] as const;

const expectedPeerDependencies = {
  "@html-eslint/eslint-plugin-react": ">=0.60.0 <1",
  "@html-eslint/eslint-plugin-svelte": ">=0.60.0 <1",
  "@vitest/eslint-plugin": ">=1.6.27 <2",
  eslint: ">=10.4.0 <11",
  "eslint-plugin-express-security": ">=1.2.0 <4",
  "eslint-plugin-react-hooks": ">=7.1.0 <8",
  "eslint-plugin-react-refresh": ">=0.5.0 <1",
  react: ">=19.0.0 <20",
  svelte: ">=5.0.0 <6",
  "svelte-eslint-parser": ">=1.6.0 <2",
} as const;

// eslint-disable-next-line functional/prefer-immutable-types -- readFile accepts a URL instance; this helper does not mutate it.
const readJson = async <T>(url: URL): Promise<T> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, security/detect-non-literal-fs-filename -- Only the two fixed repository manifest URLs reach this unvalidated fixture-shape assertion.
  return JSON.parse(await readFile(url, "utf8")) as T;
};

const packageManifest = await readJson<PackageManifest>(
  new URL("../../package.json", import.meta.url),
);
const packageLock = await readJson<PackageLock>(
  new URL("../../package-lock.json", import.meta.url),
);
const packageLockRoot = packageLock.packages[""];

describe("package contract", () => {
  it("builds only the runtime and declaration bundles without hidden maps", async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The dist directory is fixed relative to this test module.
    const files = await readdir(new URL("../../dist/", import.meta.url));

    expect(
      files.toSorted((left, right) => {
        return left.localeCompare(right);
      }),
    ).toEqual(["index.d.mts", "index.mjs"]);
  });

  it.each(["index.d.mts", "index.mjs"])(
    "builds %s without external or inline source-map references",
    async (filename) => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- The filename comes from the two fixed build artifact names above.
      const content = await readFile(
        new URL(`../../dist/${filename}`, import.meta.url),
        "utf8",
      );

      expect(content).not.toContain("sourceMappingURL");
    },
  );

  it("publishes an ESM-only dist package with explicit support floors", () => {
    expect(packageManifest.private).toBe(false);
    expect(packageManifest.sideEffects).toBe(false);
    expect(packageManifest.type).toBe("module");
    expect(packageManifest.files).toEqual(["dist"]);
    expect(packageManifest.main).toBe("./dist/index.mjs");
    expect(packageManifest.types).toBe("./dist/index.d.mts");

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- The parsed manifest is asserted, so a missing export must fail the expectation.
    expect(packageManifest.exports["."]?.types).toBe("./dist/index.d.mts");
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- The parsed manifest is asserted, so a missing export must fail the expectation.
    expect(packageManifest.exports["."]?.import).toBe("./dist/index.mjs");
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- The parsed manifest is asserted, so a missing export must fail the expectation.
    expect(packageManifest.exports["."]?.default).toBe("./dist/index.mjs");
    expect(packageManifest.exports["./package.json"]).toBe("./package.json");

    expect(packageManifest.engines).toEqual({ node: ">=24.15.0" });
    expect(packageManifest.devEngines).toEqual({
      // The npm floor, 11.15.0, supports the registry-only settings of `.npmrc` and staged publishing.
      packageManager: {
        name: "npm",
        onFail: "error",
        version: ">=11.15.0",
      },
      runtime: {
        name: "node",
        onFail: "error",
        version: ">=24.15.0",
      },
    });

    expect(packageManifest.publishConfig.access).toBe("public");
    expect(packageManifest.publishConfig.registry).toBe(
      "https://registry.npmjs.org/",
    );
  });

  it("keeps runtime, development, and peer dependency roles aligned", () => {
    const dependencyNames = Object.keys(packageManifest.dependencies);
    const peerDependencyNames = Object.keys(packageManifest.peerDependencies);

    expect(packageManifest.peerDependencies).toEqual(expectedPeerDependencies);
    expect(Object.keys(packageManifest.peerDependenciesMeta)).toEqual(
      peerDependencyNames,
    );
    expect(packageManifest.peerDependenciesMeta.eslint).toEqual({
      optional: false,
    });
    expect(
      expectedOptionalPeerDependencies.filter((dependency) => {
        return (
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, security/detect-object-injection -- Keys come from the fixed optional-peer fixture; a missing entry in the asserted manifest must fail the expectation.
          packageManifest.peerDependenciesMeta[dependency]?.optional !== true
        );
      }),
    ).toEqual([]);

    expect(
      dependencyNames.filter((dependency) => {
        return Object.hasOwn(packageManifest.devDependencies, dependency);
      }),
    ).toEqual([]);
    expect(
      dependencyNames.filter((dependency) => {
        return Object.hasOwn(packageManifest.peerDependencies, dependency);
      }),
    ).toEqual([]);
    expect(
      peerDependencyNames.filter((dependency) => {
        return !Object.hasOwn(packageManifest.devDependencies, dependency);
      }),
    ).toEqual([]);
  });

  it("keeps the lockfile root contract synchronized with package.json", () => {
    expect(packageLockRoot).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- A missing root in the asserted lockfile must fail the expectation.
    expect(packageLockRoot?.dependencies).toEqual(packageManifest.dependencies);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- A missing root in the asserted lockfile must fail the expectation.
    expect(packageLockRoot?.devDependencies).toEqual(
      packageManifest.devDependencies,
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- A missing root in the asserted lockfile must fail the expectation.
    expect(packageLockRoot?.engines).toEqual(packageManifest.engines);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- A missing root in the asserted lockfile must fail the expectation.
    expect(packageLockRoot?.peerDependencies).toEqual(
      packageManifest.peerDependencies,
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- A missing root in the asserted lockfile must fail the expectation.
    expect(packageLockRoot?.peerDependenciesMeta).toEqual(
      packageManifest.peerDependenciesMeta,
    );
  });
});
