/* eslint-disable functional/no-expression-statements, functional/no-return-void, n/no-sync, security/detect-non-literal-fs-filename -- Packed-package smoke tests intentionally perform filesystem and process side effects. */

import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

type ConsumerOptions = {
  readonly dependencies: readonly string[];
  readonly name: string;
  readonly tarball: string;

  readonly manifestDevelopmentDependencies?: Readonly<Record<string, string>>;
};

const projectDirectory = path.resolve(__dirname, "..");

const runtimeDependencies: readonly string[] = [
  "@eslint-community/eslint-plugin-eslint-comments",
  "eslint-enforce-package-type",
  "eslint-import-resolver-typescript",
  "eslint-plugin-functional",
  "eslint-plugin-import-x",
  "eslint-plugin-n",
  "eslint-plugin-package-json",
  "eslint-plugin-perfectionist",
  "eslint-plugin-promise",
  "eslint-plugin-regexp",
  "eslint-plugin-security",
  "eslint-plugin-unicorn",
  "eslint-plugin-unused-imports",
  "@eslint/json",
  "@eslint/markdown",
  "globals",
  "@html-eslint/eslint-plugin",
  "@html-eslint/parser",
  "jsonc-eslint-parser",
  "typescript-eslint",
];

const optionalPeerDependencies: readonly string[] = [
  "@html-eslint/eslint-plugin-react",
  "@html-eslint/eslint-plugin-svelte",
  "eslint-plugin-express-security",
  "eslint-plugin-react-hooks",
  "eslint-plugin-react-refresh",
  "react",
  "svelte",
  "svelte-eslint-parser",
];

const temporaryDirectory = await fs.mkdtemp(
  path.join(os.tmpdir(), "eslint-config-package-"),
);

const linkDependency = async (
  nodeModulesDirectory: string,
  dependency: string,
) => {
  const source = path.join(projectDirectory, "node_modules", dependency);
  const destination = path.join(nodeModulesDirectory, dependency);

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.symlink(source, destination, "junction");
};

const createPackedPackage = async (baseDirectory: string) => {
  execFileSync(
    "npm",
    ["pack", "--ignore-scripts", "--pack-destination", baseDirectory],
    {
      cwd: projectDirectory,
      encoding: "utf8",
    },
  );

  const packedFiles = await fs.readdir(baseDirectory);
  const tarballs = packedFiles.filter((file) => file.endsWith(".tgz"));
  expect(tarballs).toHaveLength(1);

  const [tarballFilename = ""] = tarballs;
  expect(tarballFilename).not.toBe("");

  return path.join(baseDirectory, tarballFilename);
};

const createConsumer = async ({
  dependencies,
  manifestDevelopmentDependencies = {},
  name,
  tarball,
}: ConsumerOptions) => {
  const consumerDirectory = path.join(temporaryDirectory, name);
  const nodeModulesDirectory = path.join(consumerDirectory, "node_modules");
  const packageDirectory = path.join(
    nodeModulesDirectory,
    "@cravingmaker",
    "eslint-config",
  );

  await fs.mkdir(packageDirectory, { recursive: true });

  execFileSync(
    "tar",
    ["-xzf", tarball, "--strip-components=1", "-C", packageDirectory],
    {
      cwd: temporaryDirectory,
    },
  );

  await Promise.all(
    dependencies.map(async (dependency) => {
      await linkDependency(nodeModulesDirectory, dependency);
    }),
  );

  await fs.writeFile(
    path.join(consumerDirectory, "package.json"),
    JSON.stringify({
      devDependencies: manifestDevelopmentDependencies,
      name: `eslint-config-${name}`,
      private: true,
      type: "module",
    }),
    "utf8",
  );

  return consumerDirectory;
};

const createBrokenPackage = async (
  consumerDirectory: string,
  packageName: string,
) => {
  const packageDirectory = path.join(
    consumerDirectory,
    "node_modules",
    packageName,
  );
  await fs.mkdir(packageDirectory, { recursive: true });
  await fs.writeFile(
    path.join(packageDirectory, "package.json"),
    JSON.stringify({
      exports: "./index.mjs",
      name: packageName,
      type: "module",
      version: "1.0.0",
    }),
    "utf8",
  );
  await fs.writeFile(
    path.join(packageDirectory, "index.mjs"),
    `throw new Error('broken optional peer');\n`,
    "utf8",
  );
};

const runConsumer = (consumerDirectory: string, script: string) =>
  execFileSync(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: consumerDirectory,
    encoding: "utf8",
  });

const tarball = await createPackedPackage(temporaryDirectory);

describe("published package", () => {
  afterAll(async () => {
    await fs.rm(temporaryDirectory, { force: true, recursive: true });
  });

  it("works without optional peers and defaults TypeScript type checking to off", async () => {
    const consumerDirectory = await createConsumer({
      dependencies: ["eslint", ...runtimeDependencies],
      name: "base-consumer",
      tarball,
    });

    const output = runConsumer(
      consumerDirectory,
      String.raw`
				import { ESLint } from 'eslint';
				import { createConfig } from '@cravingmaker/eslint-config';

				const optionalPluginNames = [
					'@html-eslint/react',
					'@html-eslint/svelte',
					'express-security',
					'react-hooks',
					'react-refresh',
				];

				const getPluginNames = (config) =>
					new Set(config.flatMap((entry) => Object.keys(entry.plugins ?? {})));

				const getTypeScriptConfig = (config) =>
					new ESLint({ overrideConfig: config, overrideConfigFile: true }).calculateConfigForFile('example.ts');

				const defaultConfig = await createConfig();
				const untyped = await createConfig({ tsTypeChecked: false });
				const typed = await createConfig({ tsTypeChecked: true });

				if (!Array.isArray(defaultConfig) || defaultConfig.length === 0) {
					throw new Error('createConfig did not return a non-empty flat config');
				}

				const detectedOptionalPlugins = optionalPluginNames.filter((name) => getPluginNames(defaultConfig).has(name));
				if (detectedOptionalPlugins.length !== 0) {
					throw new Error('Optional plugins were loaded unexpectedly: ' + detectedOptionalPlugins.join(', '));
				}

				const defaultTsConfig = await getTypeScriptConfig(defaultConfig);
				const untypedTsConfig = await getTypeScriptConfig(untyped);
				const typedTsConfig = await getTypeScriptConfig(typed);

				if (
					[defaultTsConfig, untypedTsConfig, typedTsConfig].some(
						(config) => config?.plugins?.['@typescript-eslint'] === undefined,
					)
				) {
					throw new Error('TypeScript config was not created');
				}

				if (defaultTsConfig.languageOptions?.parserOptions?.projectService !== undefined) {
					throw new Error('Default TypeScript config unexpectedly enabled projectService');
				}

				if (defaultTsConfig.rules?.['@typescript-eslint/no-unsafe-assignment']?.[0] !== 0) {
					throw new Error('Default TypeScript config unexpectedly enabled type-aware rules');
				}

				if (defaultTsConfig.rules?.['n/no-sync']?.[0] !== 0) {
					throw new Error('Default TypeScript config unexpectedly enabled n/no-sync without type information');
				}

				if (typedTsConfig.rules?.['n/no-sync']?.[0] !== 2) {
					throw new Error('Typed TypeScript config did not enable n/no-sync');
				}

				const eslint = new ESLint({
					overrideConfig: defaultConfig,
					overrideConfigFile: true,
				});
				await eslint.lintText(
					"import fs from 'node:fs';\nfs.readFileSync('fixture.txt', 'utf8');\n",
					{ filePath: 'example.ts' },
				);
				const jsxResults = await eslint.lintText(
					"const element = <div>Hello</div>;\nconsole.log(element);\n",
					{ filePath: 'component.jsx' },
				);
				const jsxParsingErrors = jsxResults.flatMap((result) => result.messages).filter((message) => message.fatal);

				if (jsxParsingErrors.length !== 0) {
					throw new Error('JSX did not parse without optional React peers');
				}

				if (untypedTsConfig.languageOptions?.parserOptions?.projectService !== undefined) {
					throw new Error('Untyped TypeScript config unexpectedly enabled projectService');
				}

				if (typedTsConfig.languageOptions?.parserOptions?.projectService !== true) {
					throw new Error('Typed TypeScript config did not enable projectService');
				}

				if (typedTsConfig.rules?.['@typescript-eslint/no-unsafe-assignment']?.[0] !== 2) {
					throw new Error('Typed TypeScript rules were not enabled');
				}

				process.stdout.write('ok');
			`,
    );

    expect(output).toBe("ok");
  });

  it("loads optional integrations from the consumer and auto-detects Vite", async () => {
    const consumerDirectory = await createConsumer({
      dependencies: [
        "eslint",
        ...runtimeDependencies,
        ...optionalPeerDependencies,
      ],
      manifestDevelopmentDependencies: { vite: "1.0.0" },
      name: "full-consumer",
      tarball,
    });

    const output = runConsumer(
      consumerDirectory,
      `
				import { createConfig } from '@cravingmaker/eslint-config';

				const config = await createConfig({ tsTypeChecked: false });
				const pluginNames = new Set(config.flatMap((entry) => Object.keys(entry.plugins ?? {})));

				for (const plugin of [
					'@html-eslint/react',
					'@html-eslint/svelte',
					'express-security',
					'react-hooks',
					'react-refresh',
				]) {
					if (!pluginNames.has(plugin)) {
						throw new Error('Optional plugin was not loaded: ' + plugin);
					}
				}

				const refreshConfig = config.find((entry) => Object.hasOwn(entry.plugins ?? {}, 'react-refresh'));
				const refreshRule = refreshConfig?.rules?.['react-refresh/only-export-components'];

				const { ESLint } = await import('eslint');
				const eslint = new ESLint({ overrideConfig: config, overrideConfigFile: true });
				const svelteConfig = await eslint.calculateConfigForFile('component.svelte');
				const svelteTsConfig = await eslint.calculateConfigForFile('component.svelte.ts');

				if (svelteConfig?.languageOptions?.parser?.meta?.name !== 'svelte-eslint-parser') {
					throw new Error('Svelte parser was not selected for .svelte files');
				}

				if (svelteTsConfig?.languageOptions?.parser?.meta?.name !== 'svelte-eslint-parser') {
					throw new Error('Svelte parser was not the final parser for .svelte.ts files');
				}

				if (svelteConfig?.languageOptions?.parserOptions?.parser?.meta?.name !== 'typescript-eslint/parser') {
					throw new Error('Svelte parser was not configured to delegate TypeScript script blocks');
				}

				if (!Array.isArray(refreshRule) || refreshRule[0] !== 'warn') {
					throw new Error('React Refresh rule was not configured');
				}

				if (refreshRule[1]?.allowConstantExport !== true) {
					throw new Error('Vite React Refresh variant was not auto-detected');
				}

				process.stdout.write('ok');
			`,
    );

    expect(output).toBe("ok");
  });

  it("supports monorepo paths, project-root detection, and CommonJS extensions", async () => {
    const consumerDirectory = await createConsumer({
      dependencies: [
        "eslint",
        ...runtimeDependencies,
        ...optionalPeerDependencies,
      ],
      name: "monorepo-consumer",
      tarball,
    });
    const appDirectory = path.join(consumerDirectory, "apps", "web");
    await fs.mkdir(path.join(appDirectory, "dist"), { recursive: true });
    await fs.writeFile(
      path.join(appDirectory, "package.json"),
      JSON.stringify({
        devDependencies: { vite: "1.0.0" },
        name: "web-app",
        private: true,
        type: "module",
      }),
      "utf8",
    );
    await fs.writeFile(
      path.join(appDirectory, "dist", "ignored.js"),
      "const unused = 1;\n",
      "utf8",
    );

    const output = runConsumer(
      consumerDirectory,
      `
				import path from 'node:path';
				import { ESLint } from 'eslint';
				import { createConfig } from '@cravingmaker/eslint-config';

				const appRoot = path.join(process.cwd(), 'apps', 'web');
				const config = await createConfig({ projectRootDirectory: appRoot });
				const eslint = new ESLint({ overrideConfig: config, overrideConfigFile: true });

				const refreshConfig = config.find((entry) => Object.hasOwn(entry.plugins ?? {}, 'react-refresh'));
				const refreshRule = refreshConfig?.rules?.['react-refresh/only-export-components'];

				if (!Array.isArray(refreshRule) || refreshRule[1]?.allowConstantExport !== true) {
					throw new Error('Vite was not detected from projectRootDirectory');
				}

				const nestedPackageConfig = await eslint.calculateConfigForFile('apps/web/package.json');
				if (!nestedPackageConfig?.plugins?.['package-json']) {
					throw new Error('Nested package.json did not receive package-specific rules');
				}

				const cjsConfig = await eslint.calculateConfigForFile('scripts/example.cjs');
				if (cjsConfig?.languageOptions?.sourceType !== 'commonjs') {
					throw new Error('.cjs did not use CommonJS source type');
				}

				const ctsConfig = await eslint.calculateConfigForFile('scripts/example.cts');
				if (ctsConfig?.languageOptions?.sourceType !== 'commonjs') {
					throw new Error('.cts did not use CommonJS source type');
				}

				const cjsResult = await eslint.lintText("module.exports = require('node:path');", {
					filePath: 'scripts/example.cjs',
				});
				const ctsResult = await eslint.lintText("module.exports = require('node:path');", {
					filePath: 'scripts/example.cts',
				});
				const commonJsFatalErrors = cjsResult.concat(ctsResult)
					.flatMap((result) => result.messages)
					.filter((message) => message.fatal);

				if (commonJsFatalErrors.length !== 0) {
					throw new Error('CommonJS extensions failed to parse');
				}

				const ignored = await eslint.isPathIgnored(path.join(appRoot, 'dist', 'ignored.js'));
				if (!ignored) {
					throw new Error('Nested dist directory was not globally ignored');
				}

				process.stdout.write('ok');
			`,
    );

    expect(output).toBe("ok");
  });

  it("exposes environments, custom globals, markdown overrides, and config names", async () => {
    const consumerDirectory = await createConsumer({
      dependencies: ["eslint", ...runtimeDependencies],
      name: "api-completeness-consumer",
      tarball,
    });

    const output = runConsumer(
      consumerDirectory,
      `
				import { ESLint } from 'eslint';
				import { createConfig } from '@cravingmaker/eslint-config';

				const config = await createConfig({
					environments: ['browser'],
					globals: { MY_GLOBAL: 'readonly' },
					rules: { markdown: { 'markdown/no-missing-label-refs': 'off' } },
				});
				const names = config.map((entry) => entry.name).filter(Boolean);

				if (names.length !== config.length) throw new Error('Every config block must have a name');
				if (new Set(names).size !== names.length) throw new Error('Config block names must be unique');

				const eslint = new ESLint({ overrideConfig: config, overrideConfigFile: true });
				const jsConfig = await eslint.calculateConfigForFile('browser.js');
				const tsConfig = await eslint.calculateConfigForFile('browser.ts');
				const markdownConfig = config.find((entry) => entry.name === '@cravingmaker/eslint-config/markdown');

				if (jsConfig?.languageOptions?.globals?.window === undefined) throw new Error('Browser globals missing from JS');
				if (tsConfig?.languageOptions?.globals?.window === undefined) throw new Error('Browser globals missing from TS');
				if (jsConfig?.languageOptions?.globals?.MY_GLOBAL !== 'readonly') throw new Error('Custom global missing from JS');
				if (tsConfig?.languageOptions?.globals?.MY_GLOBAL !== 'readonly') throw new Error('Custom global missing from TS');
				if (markdownConfig?.rules?.['markdown/no-missing-label-refs'] !== 'off') throw new Error('Markdown override missing');

				process.stdout.write('ok');
			`,
    );

    expect(output).toBe("ok");
  });

  it("surfaces initialization failures from installed optional integrations", async () => {
    const consumerDirectory = await createConsumer({
      dependencies: ["eslint", ...runtimeDependencies],
      name: "broken-optional-peer-consumer",
      tarball,
    });
    await createBrokenPackage(
      consumerDirectory,
      "eslint-plugin-express-security",
    );

    expect(() =>
      runConsumer(
        consumerDirectory,
        `
					import { createConfig } from '@cravingmaker/eslint-config';
					await createConfig();
				`,
      ),
    ).toThrow(/broken optional peer/u);
  });
});
