/* eslint-disable n/no-sync, security/detect-non-literal-fs-filename -- Packed-package smoke tests intentionally perform filesystem and process side effects. */

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

// A project root in `directory` whose manifest declares `developmentDependencies`.
const createProjectRoot = async (
  directory: string,
  developmentDependencies: Readonly<Record<string, string>>,
) => {
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(
    path.join(directory, "package.json"),
    JSON.stringify({
      devDependencies: developmentDependencies,
      private: true,
      type: "module",
    }),
    "utf8",
  );

  return directory;
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

/*
A consumer script that calls `createConfig` with each set of options and prints, for each, the
names of the framework blocks it returns or the message it fails with.
*/
const createFrameworkScript = (
  cases: Readonly<Record<string, Readonly<Record<string, unknown>>>>,
) => `
				import { createConfig } from '@cravingmaker/eslint-config';

				const results = {};
				for (const [name, options] of Object.entries(${JSON.stringify(cases)})) {
					try {
						const config = await createConfig(options);
						results[name] = config
							.map((entry) => entry.name)
							.filter((blockName) => ['express', 'react', 'svelte'].includes(blockName.split('/')[2]));
					} catch (error) {
						results[name] = error.message;
					}
				}

				process.stdout.write(JSON.stringify(results));
			`;

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
				const untyped = await createConfig({ typescript: { typeChecked: false } });
				const typed = await createConfig({ typescript: { typeChecked: true } });

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

  it("loads the optional integrations that the consumer declares and auto-detects Vite", async () => {
    const consumerDirectory = await createConsumer({
      dependencies: [
        "eslint",
        ...runtimeDependencies,
        ...optionalPeerDependencies,
      ],
      manifestDevelopmentDependencies: {
        express: "1.0.0",
        react: "1.0.0",
        svelte: "1.0.0",
        vite: "1.0.0",
      },
      name: "full-consumer",
      tarball,
    });

    const output = runConsumer(
      consumerDirectory,
      `
				import { createConfig } from '@cravingmaker/eslint-config';

				const config = await createConfig({ typescript: { typeChecked: false } });
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

  it("supports monorepo paths and project-root detection, and sets no rules for CommonJS files", async () => {
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
        devDependencies: { react: "1.0.0", vite: "1.0.0" },
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
					throw new Error('React and Vite were not detected from projectRootDirectory');
				}

				const nestedPackageConfig = await eslint.calculateConfigForFile('apps/web/package.json');
				if (!nestedPackageConfig?.plugins?.['package-json']) {
					throw new Error('Nested package.json did not receive package-specific rules');
				}

				for (const filePath of ['scripts/example.cjs', 'scripts/example.cts']) {
					const commonJsConfig = await eslint.calculateConfigForFile(filePath);
					if (Object.keys(commonJsConfig?.rules ?? {}).length !== 0) {
						throw new Error('CommonJS file received rules: ' + filePath);
					}
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
					markdown: { overrides: { 'markdown/no-missing-label-refs': 'off' } },
				});
				const names = config.map((entry) => entry.name).filter(Boolean);

				if (names.length !== config.length) throw new Error('Every config block must have a name');
				if (new Set(names).size !== names.length) throw new Error('Config block names must be unique');

				const eslint = new ESLint({ overrideConfig: config, overrideConfigFile: true });
				const jsConfig = await eslint.calculateConfigForFile('browser.js');
				const tsConfig = await eslint.calculateConfigForFile('browser.ts');
				const markdownConfig = await eslint.calculateConfigForFile('README.md');

				if (jsConfig?.languageOptions?.globals?.window === undefined) throw new Error('Browser globals missing from JS');
				if (tsConfig?.languageOptions?.globals?.window === undefined) throw new Error('Browser globals missing from TS');
				if (jsConfig?.languageOptions?.globals?.MY_GLOBAL !== 'readonly') throw new Error('Custom global missing from JS');
				if (tsConfig?.languageOptions?.globals?.MY_GLOBAL !== 'readonly') throw new Error('Custom global missing from TS');
				if (markdownConfig?.rules?.['markdown/no-missing-label-refs']?.[0] !== 0) throw new Error('Markdown override missing');

				process.stdout.write('ok');
			`,
    );

    expect(output).toBe("ok");
  });

  it("surfaces initialization failures from the optional integrations that the consumer declares", async () => {
    const consumerDirectory = await createConsumer({
      dependencies: ["eslint", ...runtimeDependencies],
      manifestDevelopmentDependencies: { express: "1.0.0" },
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

  it("fails with an install message when a framework is on without its peers", async () => {
    const consumerDirectory = await createConsumer({
      dependencies: ["eslint", ...runtimeDependencies],
      name: "missing-peers-consumer",
      tarball,
    });

    const results: unknown = JSON.parse(
      runConsumer(
        consumerDirectory,
        createFrameworkScript({
          express: { express: true },
          react: { react: true },
          svelte: { svelte: true },
        }),
      ),
    );

    expect(results).toEqual({
      express:
        'The "express" feature needs "eslint-plugin-express-security", which is not installed. Install it, or set `express: false` to turn the feature off.',
      react:
        'The "react" feature needs "@html-eslint/eslint-plugin-react", which is not installed. Install it, or set `react: false` to turn the feature off.',
      svelte:
        'The "svelte" feature needs "@html-eslint/eslint-plugin-svelte", which is not installed. Install it, or set `svelte: false` to turn the feature off.',
    });
  });

  it("fails with an install message for a partial peer set, unless the option that needs the missing peer is off", async () => {
    const consumerDirectory = await createConsumer({
      dependencies: [
        "eslint",
        ...runtimeDependencies,
        "@html-eslint/eslint-plugin-react",
        "@html-eslint/eslint-plugin-svelte",
        "eslint-plugin-react-hooks",
      ],
      manifestDevelopmentDependencies: { react: "1.0.0", vite: "1.0.0" },
      name: "partial-peers-consumer",
      tarball,
    });
    const refreshMessage =
      'The "react" feature needs "eslint-plugin-react-refresh", which is not installed. Install it, or set `react: { refresh: false }` to turn `refresh` off.';

    const results: unknown = JSON.parse(
      runConsumer(
        consumerDirectory,
        createFrameworkScript({
          // React is detected from the declared `react`, and React Refresh from the declared
          // Vite.
          detected: {},
          react: { react: true },
          reactWithoutRefresh: { react: { refresh: false } },
          svelte: { react: false, svelte: true },
        }),
      ),
    );

    expect(results).toEqual({
      detected: refreshMessage,
      react: refreshMessage,
      reactWithoutRefresh: [
        "@cravingmaker/eslint-config/react/html",
        "@cravingmaker/eslint-config/react/hooks",
      ],
      svelte:
        'The "svelte" feature needs "svelte-eslint-parser", which is not installed. Install it, or set `svelte: false` to turn the feature off.',
    });
  });

  it("detects the frameworks that the project root declares, whatever peers are installed", async () => {
    const consumerDirectory = await createConsumer({
      dependencies: [
        "eslint",
        ...runtimeDependencies,
        "@html-eslint/eslint-plugin-react",
        "@html-eslint/eslint-plugin-svelte",
        "eslint-plugin-react-hooks",
      ],
      // The working directory declares every framework, but each case reads its own project root.
      manifestDevelopmentDependencies: {
        express: "1.0.0",
        react: "1.0.0",
        svelte: "1.0.0",
        vite: "1.0.0",
      },
      name: "detection-consumer",
      tarball,
    });
    const createCase = async (
      name: string,
      developmentDependencies: Readonly<Record<string, string>>,
    ) => ({
      projectRootDirectory: await createProjectRoot(
        path.join(consumerDirectory, "projects", name),
        developmentDependencies,
      ),
    });

    const cases = {
      express: await createCase("express", { express: "1.0.0" }),
      none: await createCase("none", {}),
      react: await createCase("react", { react: "1.0.0" }),
      svelte: await createCase("svelte", { svelte: "1.0.0" }),
    };

    const results: unknown = JSON.parse(
      runConsumer(consumerDirectory, createFrameworkScript(cases)),
    );

    expect(results).toEqual({
      // A declared framework needs its peers.
      express:
        'The "express" feature needs "eslint-plugin-express-security", which is not installed. Install it, or set `express: false` to turn the feature off.',
      // Installed plugins turn nothing on.
      none: [],
      // Without Next.js or Vite, React Refresh is off, so its plugin is not needed.
      react: [
        "@cravingmaker/eslint-config/react/html",
        "@cravingmaker/eslint-config/react/hooks",
      ],
      svelte:
        'The "svelte" feature needs "svelte-eslint-parser", which is not installed. Install it, or set `svelte: false` to turn the feature off.',
    });
  });
});
