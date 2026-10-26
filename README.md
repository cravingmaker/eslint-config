# @cravingmaker/eslint-config

[![npm version](https://img.shields.io/npm/v/%40cravingmaker%2Feslint-config)](https://www.npmjs.com/package/@cravingmaker/eslint-config)
[![CI](https://github.com/cravingmaker/eslint-config/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/cravingmaker/eslint-config/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/cravingmaker/eslint-config/badge)](https://scorecard.dev/viewer/?uri=github.com/cravingmaker/eslint-config)
[![License: MIT](https://img.shields.io/npm/l/%40cravingmaker%2Feslint-config)](https://github.com/cravingmaker/eslint-config/blob/main/LICENSE)

Craving Maker's opinionated, TypeScript-first ESLint configuration. One call, `createConfig()`, returns a flat config that lints the TypeScript, JavaScript, React, Svelte, Express, HTML, JSON, `package.json`, and Markdown files of an ES module project.

- **TypeScript first.** TypeScript files get typescript-eslint's strict and stylistic rules with type information, read through the project's `tsconfig.json`.
- **One explicit policy.** ESLint's core rules and more than twenty plugins, with an explicit setting for every rule that is not deprecated, instead of plugin presets. Where two rules repeat a check, one of them is off. A rule that a plugin update adds stays off until the policy covers it.
- **Features that you control.** Each plugin is a feature that you can turn off, limit to some files, or adjust with overrides. The options are typed, down to the options of each rule.
- **Frameworks when you declare them.** The rules for React, Svelte, and Express turn on when the project's `package.json` declares the framework.
- **Made for Prettier.** Prettier formats, and no rule fights it over layout.

Its companion, [@cravingmaker/prettier-config](https://github.com/cravingmaker/prettier-config), formats the layout that this config leaves to Prettier; see [Formatting with Prettier](#formatting-with-prettier). The [coding principles](https://github.com/cravingmaker/eslint-config/blob/main/CODING_PRINCIPLES.md) set the priorities behind the policy.

## Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Features](#features)
- [Frameworks](#frameworks)
- [TypeScript](#typescript)
- [Formatting with Prettier](#formatting-with-prettier)
- [Code style](#code-style)
- [Rules that replace other rules](#rules-that-replace-other-rules)
- [File-role exceptions](#file-role-exceptions)
- [User configs](#user-configs)
- [Monorepos](#monorepos)
- [Inspecting the config](#inspecting-the-config)
- [Limits](#limits)
- [Versioning](#versioning)
- [Contributing and security](#contributing-and-security)
- [License](#license)

## Requirements

- Node.js 24.15.0 or later.
- ESLint 10.4.0 or later, below 11.
- TypeScript in the peer range of the installed typescript-eslint, `>=4.8.4 <6.1.0`. npm installs a version in that range when the project has none. TypeScript 7 is not supported yet: npm can install it with an `ERESOLVE overriding peer dependency` warning, but ESLint then stops while it loads the config, before it lints any file, with `TypeError: Cannot read properties of undefined (reading 'Intrinsic')` from ts-api-utils.
- For TypeScript files, a `tsconfig.json` that includes them, with the compiler options in [tsconfig](#tsconfig).
- ES modules. The package is ESM-only, so the config file is an ES module: `eslint.config.js` in a package with `"type": "module"`, or `eslint.config.mjs`. JavaScript and TypeScript files are linted as ES modules, and CommonJS files get no rules; see [CommonJS](#commonjs).

## Installation

```bash
npm install --save-dev --save-exact eslint @cravingmaker/eslint-config
```

Pin the exact version, as `--save-exact` does, because a release can change lint results; see [Versioning](#versioning). React, Svelte, and Express need plugins of their own; see [Peer dependencies](#peer-dependencies).

## Usage

Create `eslint.config.js` at the root of the project:

```js
// @ts-check

import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig();
```

Then run ESLint:

```bash
npx eslint .
```

`createConfig()` returns a promise of a flat config array, which ESLint accepts as the default export. With `// @ts-check`, an editor checks the options against the types of this package, including the options of each rule.

Every feature is on by default, apart from React, Svelte, and Express, which turn on when the `package.json` of the project declares them; see [Automatic detection](#automatic-detection). TypeScript files are linted with type information, so a tsconfig must include each of them; see [Typed linting](#typed-linting).

Only the built-in globals of ECMAScript are defined. In JavaScript files, `no-undef` therefore reports names such as `console`, `window`, and `process` until `environments` names the runtime. TypeScript files are not affected, because the compiler checks names there.

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  environments: ["browser"],
});
```

## Options

`createConfig(options, ...userConfigs)` takes one options object, whose properties are all optional, and any number of [user configs](#user-configs). An option that it does not know is an error, at the top level and in the object of a feature: `createConfig()` rejects with a message that names each such option and the valid ones, and ESLint exits with code 2 before it lints anything.

| Option                                                                                                                                            | Default         | Description                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projectRootDirectory`                                                                                                                            | `process.cwd()` | The directory whose `package.json` decides the `"auto"` features. It is also the default of `typescript.tsconfigRootDir`. A relative path is resolved from the working directory.           |
| `ignores`                                                                                                                                         | `[]`            | Patterns of files that no feature lints, after the default ones: `**/dist/`, `**/build/`, `**/coverage/`, `**/.next/`, and `**/.svelte-kit/`.                                               |
| `environments`                                                                                                                                    | `[]`            | Runtimes whose globals are defined in JavaScript, TypeScript, and Svelte files, named as in the [globals](https://www.npmjs.com/package/globals) package: `"browser"`, `"node"`, and so on. |
| `globals`                                                                                                                                         | `{}`            | More globals, or changes to those of `environments`, such as `{ MY_GLOBAL: "readonly" }`.                                                                                                   |
| `javascript`                                                                                                                                      | `{}`            | ESLint's core rules. Always on, so it takes only an object.                                                                                                                                 |
| `typescript`                                                                                                                                      | `true`          | typescript-eslint, with type information by default and the options in [TypeScript](#typescript).                                                                                           |
| `comments`, `node`, `security`, `sonarjs`, `imports`, `unusedImports`, `promise`, `regexp`, `unicorn`, `functional`, `perfectionist`, `stylistic` | `true`          | Code-quality and style plugins for JavaScript and TypeScript.                                                                                                                               |
| `html`, `json`, `packageJson`, `markdown`                                                                                                         | `true`          | File formats. `json` also takes `overridesJsonc` and `overridesJson5`.                                                                                                                      |
| `react`, `svelte`, `express`                                                                                                                      | `"auto"`        | Frameworks, described in [Frameworks](#frameworks).                                                                                                                                         |

The default ignores apply at any depth, inside workspaces too, whatever the features and the frameworks. Your `ignores` come after them, so a directory negation such as `"!**/.next/"` lints that directory again, while negating a single file inside a directory that stays ignored has no effect.

### Feature values

Every option from `javascript` down is a feature, and takes one of these values:

- `false` turns the feature off, so none of its rules apply.
- `true` turns it on with its defaults.
- An object turns it on with these options:
  - `files`: patterns that limit the feature to some of its default files, such as `src/**`. The feature lints a file that matches one of its default patterns and one of these.
  - `ignores`: patterns of files that the feature leaves out. Other features still lint them.
  - `overrides`: rule settings applied after the feature's own rules, in the feature's files. They merge as the rules of a later config object do: a severity alone, such as `"warn"`, keeps the options that the policy gives the rule, and settings with options replace them, without merging the two.
- `"auto"`, for `react`, `svelte`, and `express` only, turns the feature on when the project declares the framework. It is their default.

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  functional: false,
  perfectionist: { ignores: ["src/generated/**"] },
  unicorn: {
    overrides: {
      "unicorn/no-null": "off",
    },
  },
});
```

Three things to keep in mind:

- **`files` limits a feature and cannot extend it.** A directory is enough: with `files: ["src/**"]`, a feature for sources lints the sources and the Svelte components in `src/`, and leaves the JSON and Markdown files there to their own features. A pattern with an extension, such as `src/**/*.ts`, also leaves out every other file that the feature lints by default, Svelte components included. A pattern that matches none of the default files, such as `**/*.markdown` for `markdown`, matches nothing. To lint another file type, see [Other file types](#other-file-types).
- **Override a rule in the feature that holds it:** a core rule in `javascript`, and a plugin's rule in the feature of that plugin, listed in [Features](#features). The blocks of each feature come after those of the features before it, so `javascript: { overrides: { "unicorn/no-null": "off" } }` changes nothing, while `unicorn: { overrides: { "unicorn/no-null": "off" } }` turns the rule off. To change a rule in some files only, use a [user config](#user-configs).
- **An override of a rule that needs type information applies only where typed linting does.** Such a rule stops ESLint in a file without type information, so an override that turns it on, or only changes its options, applies in the files that [typed linting](#typed-linting) covers. In the other files of the feature the rule stays off, and so it does in every file while `typeChecked` is `false`. An override that turns such a rule off applies in every file. These rules are the ones of typescript-eslint, eslint-plugin-functional, and eslint-plugin-sonarjs that need type information, and `n/no-sync`, which needs it only where typescript-eslint parses a file: in TypeScript files, and in the Svelte components and `.svelte.js` rune modules that the Svelte feature lints. In other JavaScript files, an override of `n/no-sync` applies as any other does.

The options of every rule of the bundled plugins are typed and checked against their schemas. Any other rule ID is accepted, for plugins that a user config adds.

## Features

A source is a JavaScript or TypeScript file: `**/*.{js,mjs,jsx,mjsx,ts,mts,tsx,mtsx}`, declaration files included. While the Svelte feature is on, `javascript`, `typescript`, and the code-quality features also lint the scripts of the Svelte components that it lints; see [Svelte](#svelte).

| Feature         | Plugins                                                                                                                                                                                                                                                                            | Default files                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `javascript`    | ESLint's core rules                                                                                                                                                                                                                                                                | Sources                                                                |
| `typescript`    | [typescript-eslint](https://www.npmjs.com/package/typescript-eslint)                                                                                                                                                                                                               | TypeScript sources: `**/*.{ts,mts,tsx,mtsx}`                           |
| `comments`      | [@eslint-community/eslint-plugin-eslint-comments](https://www.npmjs.com/package/@eslint-community/eslint-plugin-eslint-comments)                                                                                                                                                   | Sources                                                                |
| `node`          | [eslint-plugin-n](https://www.npmjs.com/package/eslint-plugin-n)                                                                                                                                                                                                                   | Sources                                                                |
| `security`      | [eslint-plugin-security](https://www.npmjs.com/package/eslint-plugin-security)                                                                                                                                                                                                     | Sources                                                                |
| `sonarjs`       | [eslint-plugin-sonarjs](https://www.npmjs.com/package/eslint-plugin-sonarjs)                                                                                                                                                                                                       | Sources                                                                |
| `imports`       | [eslint-plugin-import-x](https://www.npmjs.com/package/eslint-plugin-import-x), with [eslint-import-resolver-typescript](https://www.npmjs.com/package/eslint-import-resolver-typescript)                                                                                          | Sources                                                                |
| `unusedImports` | [eslint-plugin-unused-imports](https://www.npmjs.com/package/eslint-plugin-unused-imports)                                                                                                                                                                                         | Sources                                                                |
| `promise`       | [eslint-plugin-promise](https://www.npmjs.com/package/eslint-plugin-promise)                                                                                                                                                                                                       | Sources                                                                |
| `regexp`        | [eslint-plugin-regexp](https://www.npmjs.com/package/eslint-plugin-regexp)                                                                                                                                                                                                         | Sources                                                                |
| `unicorn`       | [eslint-plugin-unicorn](https://www.npmjs.com/package/eslint-plugin-unicorn)                                                                                                                                                                                                       | Sources                                                                |
| `functional`    | [eslint-plugin-functional](https://www.npmjs.com/package/eslint-plugin-functional)                                                                                                                                                                                                 | Sources                                                                |
| `perfectionist` | [eslint-plugin-perfectionist](https://www.npmjs.com/package/eslint-plugin-perfectionist)                                                                                                                                                                                           | Sources                                                                |
| `stylistic`     | [@stylistic/eslint-plugin](https://eslint.style/rules)                                                                                                                                                                                                                             | Sources                                                                |
| `react`         | [@html-eslint/eslint-plugin-react](https://www.npmjs.com/package/@html-eslint/eslint-plugin-react), [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks), [eslint-plugin-react-refresh](https://www.npmjs.com/package/eslint-plugin-react-refresh) | The hooks rules in sources, the others in `**/*.{jsx,mjsx,tsx,mtsx}`   |
| `svelte`        | [@html-eslint/eslint-plugin-svelte](https://www.npmjs.com/package/@html-eslint/eslint-plugin-svelte), with [svelte-eslint-parser](https://www.npmjs.com/package/svelte-eslint-parser)                                                                                              | `**/*.svelte`, and rune modules: `**/*.svelte.{js,ts}`                 |
| `express`       | [eslint-plugin-express-security](https://www.npmjs.com/package/eslint-plugin-express-security)                                                                                                                                                                                     | `**/*.{js,mjs,ts,mts}`                                                 |
| `html`          | [@html-eslint/eslint-plugin](https://www.npmjs.com/package/@html-eslint/eslint-plugin)                                                                                                                                                                                             | `**/*.html`                                                            |
| `json`          | [@eslint/json](https://www.npmjs.com/package/@eslint/json)                                                                                                                                                                                                                         | JSON, JSONC, and JSON5 files, below                                    |
| `packageJson`   | [eslint-plugin-package-json](https://www.npmjs.com/package/eslint-plugin-package-json), [eslint-enforce-package-type](https://www.npmjs.com/package/eslint-enforce-package-type)                                                                                                   | `**/package.json`                                                      |
| `markdown`      | [@eslint/markdown](https://www.npmjs.com/package/@eslint/markdown)                                                                                                                                                                                                                 | `**/*.md`, as GitHub Flavored Markdown with YAML front matter and math |

Nothing else is linted: not CommonJS files (see [CommonJS](#commonjs)), not the code blocks in Markdown files, and no other file type, such as CSS, YAML, Vue, or Astro.

### Bundled rules

Four rules come with this package and need no installation. Each belongs to a feature, so override it in that feature:

| Rule                                             | Feature       | Checks                                                                                                                     |
| ------------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `@cravingmaker/prefer-arrow-functions`           | `javascript`  | Functions are arrow functions; see [Functions](#functions).                                                                |
| `@cravingmaker/starred-documentation`            | `unicorn`     | Each line of a multiline documentation comment starts with `*`; see [Comments and blank lines](#comments-and-blank-lines). |
| `@cravingmaker/svelte-function-variable-padding` | `stylistic`   | A blank line follows a function-valued variable at the top level of a Svelte script.                                       |
| `@cravingmaker/require-peer-metadata`            | `packageJson` | Each declared peer has an entry in `peerDependenciesMeta`; see [`package.json`](#packagejson).                             |

### SonarJS

SonarJS adds control-flow, security, accessibility, and test checks. Its rules that repeat a check of another feature are off, each with the owner named in the policy; SonarJS itself owns the checks for duplicate branches, so `unicorn/no-duplicate-if-branches` is off. Checks that need a judgment, such as complexity thresholds and suspected hardcoded secrets, warn. Its rules that need type information run with [typed linting](#typed-linting).

The eighteen AWS CDK checks are errors wherever SonarJS lints, also when only a workspace declares the CDK, or declares it as an optional dependency: they do not depend on framework detection. The twenty test rules recognize tests by the test APIs that they call, so they also check tests outside `*.test.*` and `*.spec.*` files, such as `__tests__/check.js`. `sonarjs/assertions-in-tests` needs type information, and warns.

### Security

Every rule of eslint-plugin-security that is on warns, in tests as well, because its reports ask for a review: a report does not prove a vulnerability, and its absence does not prove an operation safe. Two of them warn about dynamic filesystem paths and computed keys. Suppress such a warning for one operation at a time, after checking where its input comes from, such as a fixed file name in a new temporary directory, or a key from a fixed table.

### `package.json`

The `packageJson` feature requires `"type": "module"`. A package with `exports` or `publishConfig.exports` must also expose `"./package.json": "./package.json"`. A package that declares `peerDependencies` needs an entry in `peerDependenciesMeta` for each peer, with an explicit boolean `optional`: `true` for an optional peer, and `false` for a required one. A package without peers can leave the metadata out, but an empty `peerDependenciesMeta` is an error. Use `packageJson.overrides` to change these rules.

### JSON

The `json` feature lints three languages:

- JSON: `**/*.json`, apart from `package.json`, `package-lock.json`, and the JSONC files below.
- JSONC: `**/*.jsonc`, `**/tsconfig*.json`, `**/jsconfig*.json`, `**/.vscode/*.json`, `**/.devcontainer.json`, `**/.devcontainer/*.json`, and `**/.devcontainer/*/devcontainer.json`.
- JSON5: `**/*.json5`.

`json.files` and `json.ignores` apply to all three languages. `json.overrides` apply to JSON files only: JSONC and JSON5 files take their overrides from `json.overridesJsonc` and `json.overridesJson5`.

## Frameworks

### Automatic detection

`react`, `svelte`, and `express` default to `"auto"`. The feature turns on when the `package.json` in `projectRootDirectory` declares the package `react`, `svelte`, or `express` in `dependencies`, `devDependencies`, or `peerDependencies`. Installed packages count for nothing, and neither do the plugins, declared or installed. A `package.json` that is missing or not valid JSON declares nothing.

`true`, `false`, or an object always wins over detection. A monorepo root that declares no framework therefore turns a framework on with `true` or an object; see [Monorepos](#monorepos).

### Peer dependencies

The plugins of each framework are optional peer dependencies. Install the ones for the frameworks that you use:

```bash
# React
npm install --save-dev --save-exact @html-eslint/eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh
# Svelte
npm install --save-dev --save-exact @html-eslint/eslint-plugin-svelte svelte-eslint-parser
# Express
npm install --save-dev --save-exact eslint-plugin-express-security
```

| Feature   | Needs                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `react`   | `@html-eslint/eslint-plugin-react` and `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh` while React Refresh is on |
| `svelte`  | `@html-eslint/eslint-plugin-svelte` and `svelte-eslint-parser`, which loads `svelte` from the project                           |
| `express` | `eslint-plugin-express-security`                                                                                                |

The supported versions are the ranges in the `peerDependencies` of this package, which include React 19 and Svelte 5. The policy uses the rules and options of the installed version. When a feature is on, whether set or detected, and a package that it needs is missing, `createConfig()` rejects with a message that names the first missing package, and ESLint exits with code 2 before it lints anything:

```text
The "react" feature needs "@html-eslint/eslint-plugin-react", which is not installed. Install it, or set `react: false` to turn the feature off.
```

The packages that a peer loads itself are not checked. Without `svelte`, for example, the Svelte feature fails with Node's message `Cannot find package 'svelte'` instead.

### React

The `react` feature has three parts:

- **HTML in JSX.** Every rule of @html-eslint/eslint-plugin-react, in JSX and TSX files. The class name rules also check the arguments of `classnames`, `clsx`, `cn`, `cva`, `tw`, and `twMerge`.
- **Hooks.** The Rules of Hooks, `exhaustive-deps`, and the React Compiler rules of eslint-plugin-react-hooks, in every source, because custom hooks live in `.js` and `.ts` files too. The compiler rules analyze functions named like a component, with a capital letter, or like a hook, with `use` and a capital letter or digit.
- **React Refresh.** `react-refresh/only-export-components`, as a warning, in JSX and TSX files.

`react.files` limits all three parts: the hooks rules to the sources that match it, and the other two parts to the JSX and TSX files that match it. Overrides of `react-hooks/*` rules apply wherever the hooks rules do, and other overrides where the other two parts do. While React Refresh is off, an override of a `react-refresh/*` rule applies nowhere, because its plugin is not loaded.

`react.refresh` selects the React Refresh variant, which decides what a file may export next to its components:

| `refresh`          | Effect                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `"auto"` (default) | `"next"` when the project declares `next`, otherwise `"vite"` when it declares `vite`, otherwise off   |
| `"generic"`        | Components only                                                                                        |
| `"next"`           | Components, and the route segment config, metadata, viewport, and static generation exports of Next.js |
| `"vite"`           | Components and constants                                                                               |
| `false`            | Off, and `eslint-plugin-react-refresh` is not needed                                                   |

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  react: {
    overrides: {
      "react-hooks/exhaustive-deps": "warn",
    },
    refresh: "vite",
  },
});
```

The feature has no rules for JSX itself, such as those of eslint-plugin-react, and none for accessibility, such as those of eslint-plugin-jsx-a11y; add them with a [user config](#user-configs). In typed TSX files, components may have PascalCase names; see [Typed linting](#typed-linting). The Functional rules can still report handlers and effects, as [Known issues](#known-issues) describes.

### Svelte

The `svelte` feature lints components (`.svelte`) and rune modules (`.svelte.js` and `.svelte.ts`):

- **Markup.** Every rule of @html-eslint/eslint-plugin-svelte.
- **Scripts.** svelte-eslint-parser hands every script of a component to typescript-eslint's parser, with `lang="ts"` or without. The scripts therefore get the rules of TypeScript sources, apart from the React and Express rules, and without type information. Core rules that the TypeScript compiler checks, such as `no-undef`, are off in components as in TypeScript files. A project with no TypeScript files whose components are written in JavaScript can keep `no-undef` with `typescript: false`.
- **Rune modules** are sources by their extension, so they get the rules of JavaScript or TypeScript sources in full, apart from `n/no-sync` in `.svelte.js` modules. svelte-eslint-parser hands rune modules to typescript-eslint's parser, where that rule needs type information, which JavaScript files never get.

Name rune modules `.svelte.js` or `.svelte.ts`. Files ending in `.svelte.mjs` or `.svelte.mts` are linted as ordinary sources, without rune or template support.

Four rules are off in components, because components break them by design:

- `functional/no-let` and `unicorn/no-top-level-assignment-in-function`: the instance script runs once per component instance, so its top-level variables are the instance's state, which Svelte updates through assignments, as in `let count = $state(0)` with `onclick={() => { count = count + 1; }}`. `bind:` targets need `let` as well.
- `import-x/no-mutable-exports`: the props of legacy mode are `export let` declarations.
- `import-x/unambiguous`: svelte-eslint-parser puts the statements of a script below its element instead of the program, where the rule looks for them.

Rune modules keep all four: their top level is module state that every importer shares.

`svelte.files` and `svelte.ignores` also decide which components the other features lint. Only svelte-eslint-parser can read a component, so a component that the Svelte feature leaves out is not linted at all. Ignore patterns apply in order: a negated pattern such as `!**/generated/Kept.svelte` brings a component back, with its script rules and the exceptions above, within `svelte.files` and the files of each feature, and a later pattern can leave it out again. Typed linting leaves components out: they get neither type information nor the rules that need it.

Prettier formats `.svelte` files only with [prettier-plugin-svelte](https://www.npmjs.com/package/prettier-plugin-svelte).

### Express

The `express` feature turns on nine rules of eslint-plugin-express-security, such as `require-helmet` and `no-permissive-cors`, in `**/*.{js,mjs,ts,mts}`. The plugin's other rules are not turned on.

## TypeScript

typescript-eslint parses TypeScript files, and its strict and stylistic rules apply to them, including the rules that need type information: [typed linting](#typed-linting) is on by default. The `typescript` feature takes these options, besides `files`, `ignores`, and `overrides`:

| Option               | Default                  | Description                                                                                                                                                                                           |
| -------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typeChecked`        | `true`                   | Lint with type information. `false` turns typed linting off.                                                                                                                                          |
| `filesTypeAware`     | The files of the feature | Files that the parser reads with type information and that get the rules that need it. They match only the TypeScript files that the feature lints, so a directory such as `src/**` is enough.        |
| `ignoresTypeAware`   | `[]`                     | Files to lint without type information, such as scripts that no tsconfig includes.                                                                                                                    |
| `overridesTypeAware` | `{}`                     | Rule settings for the files that typed linting covers, applied after the rules that need type information and after `overrides`.                                                                      |
| `tsconfigRootDir`    | `projectRootDirectory`   | The directory that holds the root `tsconfig.json`, for typescript-eslint and the TypeScript import resolver. A relative path is resolved from the working directory, not from `projectRootDirectory`. |

### tsconfig

Typed linting reads the type information of each TypeScript file through the nearest `tsconfig.json`, which must include the file. The policy expects strict mode, and it leaves some checks to the compiler. Set these compiler options in that tsconfig explicitly, next to the options of your project, whatever the defaults of your TypeScript version:

```json
{
  "compilerOptions": {
    "allowUnreachableCode": false,
    "noImplicitReturns": true,
    "strict": true
  }
}
```

- `strict` includes `strictNullChecks`, which five rules need. Without it, `@typescript-eslint/no-unnecessary-boolean-literal-compare`, `no-unnecessary-condition`, `no-useless-default-assignment`, `prefer-nullish-coalescing`, and `strict-boolean-expressions` report "This rule requires the `strictNullChecks` compiler option to be turned on to function correctly." in every file. TypeScript 6 turns `strict` on by default; earlier versions do not.
- `noImplicitReturns` and `allowUnreachableCode: false` make the compiler report a missing return value and unreachable code, so `@typescript-eslint/consistent-return`, `sonarjs/no-inconsistent-returns`, and `no-unreachable` are off in TypeScript files. So is `no-useless-return`, because `noImplicitReturns` requires the `return;` that it would remove.

The core rules whose checks the compiler makes in any case, such as `no-undef`, are off in TypeScript files as well. ESLint does not report the errors of the compiler, so run `tsc --noEmit` too, for example in CI.

The policy needs these three options and no others. It works with or without `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, and `noFallthroughCasesInSwitch`, and the rules that cover the same ground stay on either way.

### Typed linting

typescript-eslint's project service reads the type information of each TypeScript file through the nearest `tsconfig.json`, and the rules of the `typescript`, `functional`, `node`, and `sonarjs` features that need type information turn on in the same files. A file that no tsconfig includes fails with a parsing error that says it "was not found by the project service". Leave such files out of typed linting with `ignoresTypeAware`, or limit typed linting to your sources with `filesTypeAware`:

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  typescript: {
    // Linted without type information, because no tsconfig includes them
    ignoresTypeAware: ["scripts/**"],
    tsconfigRootDir: import.meta.dirname,
  },
});
```

`filesTypeAware` and `ignoresTypeAware` decide both where the parser reads type information and where the rules that need it apply, so no such rule runs without it. JavaScript files never get type information, and neither do Svelte components.

`typeChecked: false` turns typed linting off, for a project without a tsconfig, for example. TypeScript files then get the rules that work without type information, and the rules that need it are off:

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  typescript: { typeChecked: false },
});
```

In typed `.tsx` files, function-valued `const` bindings and function declarations may also have PascalCase names, so that arrow components such as `Greeting` pass `@typescript-eslint/naming-convention`. The allowance goes by the type of the value, not by whether it is a component, and other files and other values keep the usual naming formats.

`@typescript-eslint/promise-function-async` treats a return type of `any` or `unknown` as possibly a promise (`allowAny: false`), so it also reports functions that return such values on purpose, without a fix. Give the function a precise return type, or keep it synchronous with a local exception: adding `async` makes it return a promise.

## Formatting with Prettier

Prettier formats, and ESLint checks everything else. Run them as separate steps:

```bash
npx prettier --check . && npx eslint .
```

Any Prettier config works. [@cravingmaker/prettier-config](https://github.com/cravingmaker/prettier-config) is the companion of this one, and the formatting tests of this package use it.

You do not need eslint-config-prettier. The rules that would fight Prettier over layout are off, each with its reason in the rule map, among them the indentation, wrapping, quote, and semicolon rules of Stylistic, so you can choose Prettier options such as `useTabs`, `printWidth`, `singleQuote`, and `semi`. Others that are off for the same reason:

- `no-unexpected-multiline`.
- `unicorn/empty-brace-spaces`, `unicorn/number-literal-case`, and `unicorn/no-nested-ternary`.
- The layout rules of @html-eslint: `attrs-newline`, `class-spacing`, `element-newline`, `indent`, `no-extra-spacing-tags`, `no-extra-spacing-text`, `no-multiple-empty-lines`, `no-trailing-spaces`, and `quotes`.

The rules that agree with Prettier stay on: token spacing, spaced comments, class member separation, PascalCase JSX components, self-closing JSX, and consistent JSX expression braces. Mixed logical and bitwise operators need parentheses, while ordinary arithmetic follows JavaScript precedence. Unlike eslint-config-prettier, the config keeps `curly` on. The tests of this package check that Prettier's output passes these rules.

In HTML, a custom element keeps an explicit end tag, as in `<my-element></my-element>`, because a trailing slash does not close a custom element. A custom element that is self-closing or has no end tag gets a warning without a fix, because the rule cannot tell where the end tag belongs. Void elements such as `<br />` are self-closing, with a fix.

`unicorn/template-indent` checks templates tagged `outdent`, `dedent`, `sql`, or `styled`, the arguments of `dedent` and `stripIndent`, and templates after an `/* indent */` comment. It leaves out `gql` and `html` templates and those after an `/* HTML */` comment, which Prettier formats.

A project that does not format its HTML with Prettier can turn the HTML layout rules back on:

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  html: {
    overrides: {
      "@html-eslint/attrs-newline": "error",
      "@html-eslint/element-newline": "error",
      "@html-eslint/indent": ["error", 2],
      "@html-eslint/no-trailing-spaces": "error",
      "@html-eslint/quotes": "error",
    },
  },
});
```

## Code style

These conventions go beyond layout, so Prettier keeps them as they are. ESLint fixes and Prettier formatting converge on them when they run repeatedly.

### Functions

Functions are arrow functions with block bodies. `@cravingmaker/prefer-arrow-functions`, in the `javascript` feature, replaces `func-style` and `prefer-arrow-callback`, so declarations, initializers, assignments, return values, exports, and callbacks follow one rule, and `arrow-body-style` is `"always"`. Methods, accessors, generators, overload signatures and their implementations, named recursive function expressions, and functions that use their own `this`, `arguments`, or `new.target` keep their form, and so do local constructors used with `new`, `extends`, `Reflect.construct`, or `.prototype`. The rule reports without fixes or suggestions: review hoisting and function identity when you convert a function, and use a scoped override for a constructor that only other files call with `new`.

Array callbacks forward the arguments that they mean to pass, as in `values.map((value) => { return format(value); })`. `unicorn/no-array-callback-reference` is on and `functional/prefer-tacit` is off, because passing a function to `map` directly also passes the index and the array, which changes the result of a function with optional parameters.

### Assignments

Updates are explicit: `count = count + 1`, not `count += 1` or `count++`. `operator-assignment` and `logical-assignment-operators` are `"never"`, and `no-plusplus` reports `++` and `--`, in `for` loops too. Write a logical update as an explicit `if` where a setter must run only on its condition. When you convert existing code, keep the order in which receivers and keys are evaluated, numeric coercion, and BigInt operands as they were, and save the old value first where an expression uses the result of `count++`.

### Comments and blank lines

Multiline documentation comments, `/** ... */`, keep a leading `*` on each line (`@cravingmaker/starred-documentation`, in the `unicorn` feature), with their paragraph breaks; `unicorn/no-asterisk-prefix-in-documentation-comments` is off. Ordinary line and block comments keep their form.

A blank line follows a function-valued variable declaration, before the next statement and its documentation comment, including named exports, several declarators, and TypeScript assertion wrappers (`@stylistic/padding-line-between-statements`). Other variables, object properties, closing braces, and the end of a file need no blank line. The Stylistic rule skips the top level of Svelte scripts, where `@cravingmaker/svelte-function-variable-padding` adds the blank line instead; it follows the `files`, `ignores`, and `overrides` of the `stylistic` feature.

Perfectionist orders module declarations, but its checks for blank lines between them are off, because its fixer miscounts the paragraphs of documentation comments.

### Imports and escapes

`perfectionist/sort-imports` owns the order of imports and the blank lines between them, and comments do not split its groups. `import-x/newline-after-import` asks for at least one blank line after the imports (`count: 1` with `exactCount: false`), so a multiline documentation comment can follow them.

Hexadecimal and Unicode escapes use uppercase letters, in strings (`unicorn/escape-case`) and in regular expressions (`regexp/letter-case`).

### Binary data

Use `Uint8Array` for binary data. The `Buffer` global (`no-restricted-globals`), imports from `buffer` and `node:buffer` (`no-restricted-imports`), the TypeScript `Buffer` type (`@typescript-eslint/no-restricted-types`), and `new Buffer()` (`no-restricted-syntax`) are reported with "Use Uint8Array instead." A type annotation offers an editor suggestion to use `Uint8Array`. Convert the rest by hand, keeping the encoding, the coercion, and any shared memory as they were.

### Size and complexity limits

The limits on size, complexity, parameters, and nesting warn, because they call for a judgment: among them `complexity` at 10, `max-depth` at 3, `max-lines` at 600, `max-lines-per-function` at 60, `max-nested-callbacks` at 3, and `max-params` at 4, besides the limits of SonarJS, Unicorn, and @html-eslint. ESLint exits with code 0 on warnings, but `--max-warnings 0` fails on them. `--quiet` alone skips the rules that warn; with `--max-warnings`, it runs them and hides their messages, but still counts them.

### Deprecated rules

The policy leaves deprecated rules out. A config of your own that turns one on, such as `no-return-await`, keeps it on, and it can conflict with `@typescript-eslint/return-await: ["error", "always"]`. Turn such a rule off in a later [user config](#user-configs).

## Rules that replace other rules

Where two rules check the same thing, one of them owns the check: it is on in its own rule map, and the others are off, each with a `Handled by` comment that names the owner. Turning the owner's feature off, or limiting it with `files` or `ignores`, does not turn the others back on, so the check is gone from those files unless you turn on another rule yourself, through its feature's `overrides` or a user config. A rule that is off has no options, so give them when you turn it on. Overrides of rules that need type information still apply only where typed linting does.

| Owner           | Rules that are off in other features                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `imports`       | `no-duplicate-imports`, `n/file-extension-in-import`, `n/no-extraneous-import`, `n/no-missing-import`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `perfectionist` | `sort-imports`, `sort-keys`, `import-x/first`, `import-x/order`, `@typescript-eslint/adjacent-overload-signatures`, `@typescript-eslint/member-ordering`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `regexp`        | `no-control-regex`, `no-empty-character-class`, `no-invalid-regexp`, `no-useless-backreference`, `@typescript-eslint/prefer-regexp-exec`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `unicorn`       | `no-negated-condition`, `no-warning-comments`, `functional/prefer-tacit`, `n/no-process-exit`, `n/prefer-node-protocol`                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `unusedImports` | `no-unused-vars`, `@typescript-eslint/no-unused-vars`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `functional`    | `@typescript-eslint/prefer-readonly-parameter-types`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `sonarjs`       | `unicorn/no-duplicate-if-branches`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `javascript`    | `@stylistic/implicit-arrow-linebreak`, `@stylistic/no-confusing-arrow`, `@stylistic/nonblock-statement-body-position`, `@stylistic/one-var-declaration-per-line`, `perfectionist/sort-variable-declarations`, `regexp/prefer-named-capture-group`, `security/detect-eval-with-expression`, `security/detect-new-buffer`, `unicorn/consistent-arrow-return-style`, `unicorn/logical-assignment-operators`, `unicorn/no-nested-ternary`, `unicorn/no-new-buffer`, `unicorn/no-typeof-undefined`, `unicorn/no-unnecessary-nested-ternary`, `unicorn/operator-assignment`, `unicorn/try-complexity` |

The table leaves out two larger groups. The SonarJS rules that repeat a check of another feature are off in the same way; see [SonarJS](#sonarjs). The typescript-eslint rules that extend core rules, such as `@typescript-eslint/no-shadow`, replace those rules in TypeScript files and Svelte scripts, and the core rules whose checks the TypeScript compiler makes are off there; see [tsconfig](#tsconfig).

Some owners are worth knowing:

- `eqeqeq` owns strict comparisons, `null` included, so `no-eq-null` is off.
- `no-eval` has `allowIndirect: false`, so it also reports optional and indirect calls, such as `eval?.(code)` and `(0, eval)(code)`.
- `no-nested-ternary` reports nested result branches, including those that `unicorn/no-unnecessary-nested-ternary` would simplify. Neither rule covers a ternary nested in the condition.
- `no-restricted-syntax` reports `new Buffer()` by the name of the callee, so it also reports a local class named `Buffer` and a binding named `Buffer` from a dynamic import, but not an alias or `globalThis.Buffer`. `unicorn/no-new-buffer` is off, because its fix produces `Buffer.alloc()` or `Buffer.from()`.
- `regexp/no-control-character` owns control characters. With `no-control-regex` off, a `RegExp` constructor may receive a string with escapes such as `"\t"` and `"\n"`.
- `@typescript-eslint/prefer-regexp-exec` is off for now, in both typed and untyped files, because its fix turns `text.match(new RegExp(source))` into `new RegExp(source).exec(text)`, which returns one match where `source` has the `g` flag. `regexp/prefer-regexp-exec` still reports `.match()` calls for a manual change, but not computed calls such as `text["match"](pattern)`.

These pairs both stay on, because each rule covers cases that the other misses:

| Rules                                                                                                       | What each covers                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-useless-escape` and `regexp/no-useless-escape`                                                          | Core checks strings, templates, and regular expression literals; RegExp checks literals and the patterns of `RegExp` constructors.                                                                                                                                            |
| `regexp/no-super-linear-backtracking` and `regexp/no-super-linear-move`, and `security/detect-unsafe-regex` | RegExp reports the patterns that it can prove to backtrack or move super-linearly; Security warns by a heuristic that also catches bounded nested repetition. A report asks for review and does not prove a vulnerability.                                                    |
| `unicorn/prefer-await` and `promise/prefer-await-to-then`                                                   | Unicorn covers awaited, yielded, constructor, top-level, and computed chains; Promise covers chains discarded with `void` in functions and goes by method names, with `strict: false`.                                                                                        |
| `unicorn/require-array-sort-compare` and `@typescript-eslint/require-array-sort-compare`                    | Unicorn covers string arrays, an explicit `undefined` comparator, and untyped files; TypeScript covers typed computed and optional calls, with `ignoreStringArrays: true`. Typed arrays may sort without a comparator.                                                        |
| `require-unicode-regexp` and `sonarjs/unicode-aware-regex`                                                  | Core requires the `u` or `v` flag on literals and constructors; SonarJS, with type information, covers string patterns passed to methods such as `match`.                                                                                                                     |
| `default-case` and `@typescript-eslint/switch-exhaustiveness-check`                                         | Core requires a `default` branch or a `// no default` comment; TypeScript, with type information, reports empty switches and missing union and enum cases, accepts only the exact lowercase `// no default`, and does not let a `default` branch excuse a missing union case. |

Fix these reports by hand with care: adding a Unicode flag can change what a pattern matches, turning a `.then()` chain into `await` changes when detached work runs and is not possible in a constructor, and a `.match()` call with a global pattern must keep returning every match.

## File-role exceptions

Some files break a rule by design. These rules are off in them:

| Files                                                              | Rules that are off                                                                                                                                   |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Config files: sources named `*.config.*`, such as `vite.config.ts` | `import-x/no-default-export` and `unicorn/no-top-level-side-effects`, because tools assemble their config at module load and read its default export |
| Test files: sources named `*.test.*` or `*.spec.*`                 | `functional/no-expression-statements` and `functional/no-return-void`, because tests and assertions are calls whose results go unused                |
| Svelte components                                                  | `functional/no-let`, `import-x/no-mutable-exports`, `import-x/unambiguous`, and `unicorn/no-top-level-assignment-in-function`; see [Svelte](#svelte) |

The two rules of test files need type information, so their exceptions matter only with typed linting. Other files in a test directory keep the rules of sources, and the SonarJS test rules and the Security warnings apply to tests as to any source. The exceptions come after every feature, so a feature's `overrides` cannot turn these rules back on in these files. A user config can:

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig(
  {},
  {
    files: ["**/*.config.ts"],
    rules: {
      "import-x/no-default-export": "error",
    },
  },
);
```

## User configs

`createConfig(options, ...userConfigs)` adds each user config after its own blocks, in the order given. A user config is a flat config object, so it can do what the options cannot: register more plugins, or set rules in some files only.

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig(
  { environments: ["node"] },
  {
    files: ["scripts/**/*.js"],
    rules: {
      "no-console": "off",
    },
  },
);
```

To add a plugin, import it in `eslint.config.js` and pass a config object that registers it under `plugins` and sets its rules, with `files` that limit it to the files it is meant for.

### Other file types

A feature's `files` cannot add a file type, such as `.markdown` files to `markdown`. To lint such files with the rules of a feature, copy the feature's block from the array that `createConfig()` resolves to, and give the copy its own `files`:

```js
import { createConfig } from "@cravingmaker/eslint-config";

const configs = await createConfig();
const markdownRules = configs.find(
  ({ name }) => name === "@cravingmaker/eslint-config/markdown/rules",
);

export default [...configs, { ...markdownRules, files: ["**/*.markdown"] }];
```

The copy keeps the language, the rules, and the `ignores` of the block. In the same way, a copy of `json/rules-jsonc` lints a JSON file with comments that has another name, such as `.babelrc`. Every block is named `@cravingmaker/eslint-config/<feature>/<part>`, and `configs.map(({ name }) => name)` lists the names.

## Monorepos

`projectRootDirectory` decides which `package.json` turns on the frameworks, and it is the default `tsconfigRootDir`. Its default is the working directory of ESLint, which can differ between the command line and an editor, and a relative path is resolved from it. `import.meta.dirname` ties it to the directory of the config file instead.

With one config at the root of a monorepo, a framework that only a workspace declares is not detected. Turn it on and limit it to the directory of that workspace with `files`:

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  express: { files: ["packages/api/**"] },
  projectRootDirectory: import.meta.dirname,
  react: { files: ["apps/web/**"] },
  typescript: {
    filesTypeAware: ["packages/api/**"],
  },
});
```

The TypeScript files of the API then read type information through the nearest tsconfig, the one of their workspace, and the other TypeScript files are linted without it. Alternatively, give each workspace its own `eslint.config.js` with `projectRootDirectory: import.meta.dirname`.

Import resolution starts at the tsconfig in `tsconfigRootDir` and follows its `references`; unlike typed linting, it does not find the tsconfig of each workspace. When a workspace defines `compilerOptions.paths` that the root tsconfig does not reference, `import-x/no-unresolved` reports the imports through those aliases. Add the workspace to the `references` of the root tsconfig, or pass a [user config](#user-configs) with `files` for that workspace, such as `packages/api/**`, that sets `settings["import-x/resolver-next"]` to an array with a resolver from `createTypeScriptImportResolver` of eslint-import-resolver-typescript, created with `alwaysTryTypes: true` and `project` set to the absolute path of the workspace's `tsconfig.json`. Add eslint-import-resolver-typescript to the dev dependencies of the project when the config imports it.

## Inspecting the config

To see the rules and options that apply to a file, print its resolved config:

```bash
npx eslint --print-config src/index.ts
```

To browse the whole config, with each block, its files, and its rules, run the [ESLint config inspector](https://github.com/eslint/config-inspector) in the project:

```bash
npx @eslint/config-inspector@latest
```

The names of the blocks, `@cravingmaker/eslint-config/<feature>/<part>`, tell which feature sets a rule, and so which feature's `overrides` change it.

## Limits

### JSX file extensions

JSX parses in `.jsx`, `.mjsx`, and `.tsx` files only. A `.js` file with JSX, such as a page in a JavaScript Next.js project, fails with `Parsing error: Unexpected token <`, even with `react: true`. Use `.jsx` or `.mjsx` for JavaScript with JSX.

The globs of the TypeScript and React features include `.mtsx`, but JSX does not parse in that extension: `<div />` fails with `Parsing error: '>' expected.`. Use `.tsx` for TypeScript with JSX.

### CommonJS

CommonJS is not supported, and `.cjs` and `.cts` files get no rules:

- ESLint still parses `.cjs` files, because its default config matches them. `eslint .` therefore reports syntax errors and unused disable directives in them, but nothing else.
- `eslint .` skips `.cts` files. A `.cts` path passed explicitly, as lint-staged and editors do, gets the warning "File ignored because no matching configuration was supplied."
- A feature's `files` does not bring them in. It only limits the feature's default files, and no CommonJS file is among them.

### Package debugging

The package ships `dist/index.mjs` and `dist/index.d.mts`, without source maps or the `src/` tree. Stack frames from this package point to its bundled JavaScript, and `--enable-source-maps` cannot map them back to its TypeScript. Lint results still point to your files.

### Known issues

- **TypeScript files that the TypeScript feature leaves out do not parse.** The JavaScript and code-quality features still lint them, but only the TypeScript feature sets a parser that reads TypeScript. With `typescript: false`, and for a file outside `typescript.files` or in `typescript.ignores`, ESLint reports `Parsing error: Unexpected token :`. Keep the TypeScript feature on for every TypeScript file that ESLint lints, and leave other TypeScript files out with the global `ignores`.
- **Typed linting reports some React handlers and effects.** `functional/no-return-void` reports event handlers and effects that call a state setter, and `functional/functional-parameters` reports handlers written inline in JSX. Leave React files out of typed linting with `ignoresTypeAware` when needed.
- **Private manifests still need package information.** `package-json/require-author`, `require-devDependencies`, `require-devEngines`, and `require-scripts` apply to private packages as well. JSON has no disable comments, so use `packageJson.overrides` when a project does not need those fields.
- **Five Markdown rules are off.** GFM autolinks without source positions make five rules of @eslint/markdown 8.0.3 crash ([eslint/markdown#619](https://github.com/eslint/markdown/issues/619)), so `markdown/no-bare-urls`, `markdown/no-invalid-label-refs`, `markdown/no-missing-label-refs`, `markdown/no-reference-like-urls`, and `markdown/no-space-in-emphasis` are off until it is fixed. Bare URLs, invalid or missing labels, reference-like URLs, and spaces in emphasis go unreported meanwhile. The other fourteen rules, GFM, YAML front matter, and math work as usual.
- **Legacy Svelte types.** In legacy mode, `unicorn/name-replacements` asks to rename the `$$Props` interface, which Svelte's tooling reads by that name, and `unused-imports/no-unused-vars` reports `$$Events` and `$$Slots`. `import-x/no-duplicates` reports `svelte/animate` and `svelte/transition` imported in one file, because both resolve to one declaration file.
- **Global declaration files.** A declaration file without imports or exports, such as the `vite-env.d.ts` that Vite generates, is reported by `import-x/unambiguous`, and its `/// <reference types="vite/client" />` by `@typescript-eslint/triple-slash-reference`. Add the types to `compilerOptions.types` in the tsconfig instead, and write declarations as a module, with `declare global` and `export {}`.
- **`npm audit` reports dependencies of two plugins.** In a project that installs this package, `npm audit` reports three high and three low findings and offers no fix: `deepmerge-ts` below 8.0.0, through eslint-plugin-functional ([GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), stack exhaustion when merging recursive object graphs), and `katex` below 0.18.2, through `micromark-extension-math` and @eslint/markdown ([GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7), existing prototype pollution can bypass trust restrictions), with the packages that depend on them, this one included. Both plugins are at their latest releases. Linting reaches neither problem: eslint-plugin-functional merges only its own schemas and rule options, and @eslint/markdown loads KaTeX without rendering anything. npm applies `overrides` from the root project only, so the ones that this repository runs its tests with do not reach your project. For a clean audit, add them to the `package.json` of your project:

  <!-- eslint-skip -->

  ```json
  {
    "overrides": {
      "deepmerge-ts": "8.0.2",
      "micromark-extension-math@3.1.0": {
        "katex": "0.18.2"
      }
    }
  }
  ```

## Versioning

Every release can change lint results, through a policy change or an updated plugin, so pin the exact version, as the [installation](#installation) command does, and update on purpose. The rule settings and option defaults are declared in this package rather than inherited from plugin presets, so they change only with a release of this package. Before 1.0.0, breaking changes come in minor versions.

The [changelog](https://github.com/cravingmaker/eslint-config/blob/main/CHANGELOG.md) and the [releases](https://github.com/cravingmaker/eslint-config/releases) describe each version. To upgrade from 0.1.0, follow the [0.2.0 release notes](https://github.com/cravingmaker/eslint-config/releases/tag/v0.2.0).

## Contributing and security

See [CONTRIBUTING.md](https://github.com/cravingmaker/eslint-config/blob/main/CONTRIBUTING.md) for contribution and pull request guidance, and follow the [Code of Conduct](https://github.com/cravingmaker/.github/blob/main/CODE_OF_CONDUCT.md) when participating in the project. Report vulnerabilities privately as described in the [security policy](https://github.com/cravingmaker/.github/blob/main/SECURITY.md).

## License

MIT © [cravingmaker](https://github.com/cravingmaker)
