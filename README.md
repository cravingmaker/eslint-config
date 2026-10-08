# @cravingmaker/eslint-config

Craving Maker's opinionated ESLint configuration. One call, `createConfig()`, returns a flat config that lints the JavaScript, TypeScript, React, Svelte, Express, HTML, JSON, `package.json`, and Markdown files of an ES module project.

The policy is strict. For most plugins, every rule that is not deprecated is on, apart from the rules that the policy turns off for a stated reason. Formatting is left to Prettier. Each part of the config is a feature that you can turn off, limit to some files, or adjust with rule overrides.

## Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Features](#features)
- [Frameworks](#frameworks)
- [TypeScript](#typescript)
- [Formatting with Prettier](#formatting-with-prettier)
- [Rules that replace other rules](#rules-that-replace-other-rules)
- [File-role exceptions](#file-role-exceptions)
- [User configs](#user-configs)
- [Monorepos](#monorepos)
- [Limits](#limits)
- [Migrating from 0.1.0](#migrating-from-010)
- [License](#license)

## Requirements

- Node.js 24.15.0 or later.
- ESLint 10.4.0 or later, below 11.
- ES modules. The package is ESM-only, so the config file must be an ES module: `eslint.config.js` in a package with `"type": "module"`, or `eslint.config.mjs`. JavaScript and TypeScript files are linted as ES modules, and CommonJS files get no rules (see [CommonJS](#commonjs)).

## Installation

```bash
npm install --save-dev --save-exact eslint @cravingmaker/eslint-config
```

Most features turn on every rule of their plugin, so a release that updates a plugin can report new problems in code that passed before. Pin the exact version, as `--save-exact` does, and update on purpose.

React, Svelte, and Express need plugins of their own; see [Peer dependencies](#peer-dependencies).

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

Every feature is on by default, apart from React, Svelte, and Express, which turn on when the `package.json` of the project declares them (see [Automatic detection](#automatic-detection)).

Only the built-in globals of ECMAScript are defined. In JavaScript files, `no-undef` therefore reports names such as `console`, `window`, and `process` until `environments` names the runtime. TypeScript files are not affected, because the compiler checks names there.

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  environments: ["browser"],
});
```

## Options

`createConfig(options, ...userConfigs)` takes one options object, whose properties are all optional, and any number of [user configs](#user-configs).

| Option                                                                                                                    | Default         | Description                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projectRootDirectory`                                                                                                    | `process.cwd()` | The directory whose `package.json` decides the `"auto"` features. It is also the default of `typescript.tsconfigRootDir`.                                                                   |
| `ignores`                                                                                                                 | `[]`            | Patterns of files that no feature lints, in addition to `**/dist/`, `**/build/`, and `**/coverage/`.                                                                                        |
| `environments`                                                                                                            | `[]`            | Runtimes whose globals are defined in JavaScript, TypeScript, and Svelte files, named as in the [globals](https://www.npmjs.com/package/globals) package: `"browser"`, `"node"`, and so on. |
| `globals`                                                                                                                 | `{}`            | More globals, or changes to those of `environments`, such as `{ MY_GLOBAL: "readonly" }`.                                                                                                   |
| `javascript`                                                                                                              | `{}`            | ESLint's core rules. Always on, so it takes only an object.                                                                                                                                 |
| `typescript`                                                                                                              | `true`          | typescript-eslint, with the options in [TypeScript](#typescript).                                                                                                                           |
| `comments`, `node`, `security`, `imports`, `unusedImports`, `promise`, `regexp`, `unicorn`, `functional`, `perfectionist` | `true`          | Code-quality plugins for JavaScript and TypeScript.                                                                                                                                         |
| `html`, `json`, `packageJson`, `markdown`                                                                                 | `true`          | File formats. `json` also takes `overridesJsonc` and `overridesJson5`.                                                                                                                      |
| `react`, `svelte`, `express`                                                                                              | `"auto"`        | Frameworks, described in [Frameworks](#frameworks).                                                                                                                                         |

### Feature values

Every option from `javascript` down is a feature, and takes one of these values:

- `false` turns the feature off, so none of its rules apply.
- `true` turns it on with its defaults.
- An object turns it on with these options:
  - `files`: patterns of the files to lint, instead of the feature's default files.
  - `ignores`: patterns of files that the feature leaves out. Other features still lint them.
  - `overrides`: rule settings applied after the feature's own rules, in the feature's files.
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

- **Give each `files` pattern an extension,** such as `src/**/*.ts`. A pattern without one, such as `src/**`, also matches the JSON and Markdown files there, and ESLint stops with an error such as `The following rules do not support the language "json/json"`. `ignores` patterns need no extension.
- **Override a rule in the feature that holds it:** a core rule in `javascript`, and a plugin's rule in the feature of that plugin, listed in [Features](#features). The blocks of each feature come after those of the features before it, so `javascript: { overrides: { "unicorn/no-null": "off" } }` changes nothing, while `unicorn: { overrides: { "unicorn/no-null": "off" } }` turns the rule off. To change a rule in some files only, use a [user config](#user-configs).
- **An override of a rule that needs type information applies only where typed linting does.** Such a rule stops ESLint in a file without type information, so an override that turns it on, also one that only changes its options, applies in the files that [typed linting](#typed-linting) covers. In the other files of the feature the rule stays off, and so it does in every file while `typeChecked` is `false`. An override that turns such a rule off applies in every file. These rules are the ones of typescript-eslint and eslint-plugin-functional that need type information, and `n/no-sync`. `n/no-sync` needs it only in TypeScript files and Svelte components, so in JavaScript files an override of it applies as any other does.

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
| `imports`       | [eslint-plugin-import-x](https://www.npmjs.com/package/eslint-plugin-import-x), with [eslint-import-resolver-typescript](https://www.npmjs.com/package/eslint-import-resolver-typescript)                                                                                          | Sources                                                                |
| `unusedImports` | [eslint-plugin-unused-imports](https://www.npmjs.com/package/eslint-plugin-unused-imports)                                                                                                                                                                                         | Sources                                                                |
| `promise`       | [eslint-plugin-promise](https://www.npmjs.com/package/eslint-plugin-promise)                                                                                                                                                                                                       | Sources                                                                |
| `regexp`        | [eslint-plugin-regexp](https://www.npmjs.com/package/eslint-plugin-regexp)                                                                                                                                                                                                         | Sources                                                                |
| `unicorn`       | [eslint-plugin-unicorn](https://www.npmjs.com/package/eslint-plugin-unicorn)                                                                                                                                                                                                       | Sources                                                                |
| `functional`    | [eslint-plugin-functional](https://www.npmjs.com/package/eslint-plugin-functional)                                                                                                                                                                                                 | Sources                                                                |
| `perfectionist` | [eslint-plugin-perfectionist](https://www.npmjs.com/package/eslint-plugin-perfectionist)                                                                                                                                                                                           | Sources                                                                |
| `react`         | [@html-eslint/eslint-plugin-react](https://www.npmjs.com/package/@html-eslint/eslint-plugin-react), [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks), [eslint-plugin-react-refresh](https://www.npmjs.com/package/eslint-plugin-react-refresh) | The hooks rules in sources, the others in `**/*.{jsx,mjsx,tsx,mtsx}`   |
| `svelte`        | [@html-eslint/eslint-plugin-svelte](https://www.npmjs.com/package/@html-eslint/eslint-plugin-svelte), with [svelte-eslint-parser](https://www.npmjs.com/package/svelte-eslint-parser)                                                                                              | `**/*.svelte`, and rune modules: `**/*.svelte.{js,mjs,ts,mts}`         |
| `express`       | [eslint-plugin-express-security](https://www.npmjs.com/package/eslint-plugin-express-security)                                                                                                                                                                                     | `**/*.{js,mjs,ts,mts}`                                                 |
| `html`          | [@html-eslint/eslint-plugin](https://www.npmjs.com/package/@html-eslint/eslint-plugin)                                                                                                                                                                                             | `**/*.html`                                                            |
| `json`          | [@eslint/json](https://www.npmjs.com/package/@eslint/json)                                                                                                                                                                                                                         | JSON, JSONC, and JSON5 files, below                                    |
| `packageJson`   | [eslint-plugin-package-json](https://www.npmjs.com/package/eslint-plugin-package-json), [eslint-enforce-package-type](https://www.npmjs.com/package/eslint-enforce-package-type)                                                                                                   | `**/package.json`                                                      |
| `markdown`      | [@eslint/markdown](https://www.npmjs.com/package/@eslint/markdown)                                                                                                                                                                                                                 | `**/*.md`, as GitHub Flavored Markdown with YAML front matter and math |

The `json` feature lints three languages:

- JSON: `**/*.json`, apart from `package.json` and `package-lock.json`.
- JSONC: `**/*.jsonc`, `**/tsconfig*.json`, `**/.vscode/*.json`, and `**/.devcontainer/*.json`.
- JSON5: `**/*.json5`.

`json.files` and `json.overrides` apply to JSON files only. JSONC and JSON5 files keep their patterns and take their overrides from `json.overridesJsonc` and `json.overridesJson5`. `json.ignores` applies to all three.

Nothing else is linted: not CommonJS files (see [CommonJS](#commonjs)), not the code blocks in Markdown files, and no other file type, such as CSS, YAML, Vue, or Astro.

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

The supported versions are the ranges in the `peerDependencies` of this package, which include React 19 and Svelte 5. When a feature is on, whether set or detected, and a package that it needs is missing, `createConfig()` rejects with a message that names the first missing package, and ESLint exits with code 2 before it lints anything:

```text
The "react" feature needs "@html-eslint/eslint-plugin-react", which is not installed. Install it, or set `react: false` to turn the feature off.
```

The packages that a peer loads itself are not checked. Without `svelte`, for example, the Svelte feature fails with Node's message `Cannot find package 'svelte'` instead.

### React

The `react` feature has three parts:

- **HTML in JSX.** Every rule of @html-eslint/eslint-plugin-react, in JSX and TSX files. The class name rules also check the arguments of `classnames`, `clsx`, `cn`, `cva`, `tw`, and `twMerge`.
- **Hooks.** The Rules of Hooks, `exhaustive-deps`, and the React Compiler rules of eslint-plugin-react-hooks, in every source, because custom hooks live in `.js` and `.ts` files too. The compiler rules analyze functions named like a component, with a capital letter, or like a hook, with `use` and a capital letter or digit.
- **React Refresh.** `react-refresh/only-export-components`, as a warning, in JSX and TSX files.

`react.files` replaces the files of all three parts. Overrides of `react-hooks/*` rules apply wherever the hooks rules do, and other overrides where the other two parts do.

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

The feature has no rules for JSX itself, such as those of eslint-plugin-react, and none for accessibility, such as those of eslint-plugin-jsx-a11y; add them with a [user config](#user-configs). Typed linting reports React components, as described in [Known issues](#known-issues).

### Svelte

The `svelte` feature lints components (`.svelte`) and rune modules (`.svelte.js` and `.svelte.ts`):

- **Markup.** Every rule of @html-eslint/eslint-plugin-svelte.
- **Scripts.** svelte-eslint-parser hands every script of a component to typescript-eslint's parser, with `lang="ts"` or without. The scripts therefore get the rules of TypeScript sources, apart from the React and Express rules, and without type information. Core rules that the TypeScript compiler checks, such as `no-undef`, are off in components as in TypeScript files. A project with no TypeScript files whose components are written in JavaScript can keep `no-undef` with `typescript: false`.
- **Rune modules** are sources by their extension, so they get the rules of JavaScript or TypeScript sources in full.

Four rules are off in components, because components break them by design:

- `functional/no-let` and `unicorn/no-top-level-assignment-in-function`: the instance script runs once per component instance, so its top-level variables are the instance's state, which Svelte updates through assignments, as in `let count = $state(0)` with `onclick={() => count++}`. `bind:` targets need `let` as well.
- `import-x/no-mutable-exports`: the props of legacy mode are `export let` declarations.
- `import-x/unambiguous`: svelte-eslint-parser puts the statements of a script below its element instead of the program, where the rule looks for them.

Rune modules keep all four: their top level is module state that every importer shares.

`svelte.files` and `svelte.ignores` also decide which components the other features lint. Only svelte-eslint-parser can read a component, so a component that the Svelte feature leaves out is not linted at all. Typed linting leaves components out too: they get neither type information nor the rules that need it.

Prettier formats `.svelte` files only with [prettier-plugin-svelte](https://www.npmjs.com/package/prettier-plugin-svelte).

### Express

The `express` feature turns on nine rules of eslint-plugin-express-security, such as `require-helmet` and `no-permissive-cors`, in `**/*.{js,mjs,ts,mts}`. The plugin's other rules are not turned on.

## TypeScript

TypeScript files are parsed by typescript-eslint. By default, the parser reads no type information, and the rules that need it are off.

| Option               | Default                  | Description                                                                                                                                                                                    |
| -------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typeChecked`        | `false`                  | Lint with type information.                                                                                                                                                                    |
| `filesTypeAware`     | The files of the feature | Files that the parser reads with type information and that get the rules that need it. They match only the TypeScript files that the feature lints, so a directory such as `src/**` is enough. |
| `ignoresTypeAware`   | `[]`                     | Files to lint without type information, such as scripts that no tsconfig includes.                                                                                                             |
| `overridesTypeAware` | `{}`                     | Rule settings for the files that typed linting covers, applied after the rules that need type information and after `overrides`.                                                               |
| `tsconfigRootDir`    | `projectRootDirectory`   | The directory that holds the root `tsconfig.json`, for typescript-eslint and the TypeScript import resolver.                                                                                   |

`files`, `ignores`, and `overrides` work as for every feature.

### Typed linting

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  typescript: {
    typeChecked: true,
  },
});
```

With `typeChecked: true`, typescript-eslint's project service reads the type information of each TypeScript file through the nearest `tsconfig.json`, and the rules of the `typescript`, `functional`, and `node` features that need type information turn on in the same files. A file that no tsconfig includes then fails with a parsing error that says it "was not found by the project service". Leave such files out of typed linting with `ignoresTypeAware`, or limit typed linting to your sources with `filesTypeAware`:

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  typescript: {
    // Linted without type information, because no tsconfig includes them
    ignoresTypeAware: ["scripts/**"],
    tsconfigRootDir: import.meta.dirname,
    typeChecked: true,
  },
});
```

`filesTypeAware` and `ignoresTypeAware` decide both where the parser reads type information and where the rules that need it apply, so no such rule runs without it. JavaScript files never get type information, and neither do Svelte components.

## Formatting with Prettier

The config leaves layout to Prettier, which runs as a separate step:

```bash
npx prettier --check . && npx eslint .
```

You do not need eslint-config-prettier: no rule that it turns off is on, apart from `unicorn/template-indent`, whose options leave out the templates that Prettier formats. These rules are off because Prettier owns what they check:

- `curly` and `no-unexpected-multiline`.
- `unicorn/empty-brace-spaces`, `unicorn/number-literal-case`, and `unicorn/no-nested-ternary`. Core `no-nested-ternary` is on instead: it reports every nested ternary, and it has no fix for Prettier to undo.
- The layout rules of @html-eslint: `attrs-newline`, `class-spacing`, `element-newline`, `indent`, `no-extra-spacing-tags`, `no-extra-spacing-text`, `no-multiple-empty-lines`, `no-trailing-spaces`, and `quotes`.

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

## Rules that replace other rules

Some plugins check what another plugin's rule also checks. For each such pair, one feature owns the check: while the owner is on, the rule it replaces is off in the files that both features lint.

| Owner           | Replaced rules                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `imports`       | `no-duplicate-imports`, `n/file-extension-in-import`, `n/no-extraneous-import`, `n/no-missing-import`                                                    |
| `perfectionist` | `sort-imports`, `sort-keys`, `import-x/first`, `import-x/order`, `@typescript-eslint/adjacent-overload-signatures`, `@typescript-eslint/member-ordering` |
| `regexp`        | `no-empty-character-class`, `no-invalid-regexp`, `no-useless-backreference`                                                                              |
| `unicorn`       | `no-negated-condition`, `no-warning-comments`, `n/no-process-exit`, `n/prefer-node-protocol`                                                             |
| `unusedImports` | `no-unused-vars`, `@typescript-eslint/no-unused-vars`                                                                                                    |

- Turning the owner off turns the rules it replaces back on.
- Limiting the owner with `files` or `ignores` turns them back on outside the owner's files.
- Setting a replaced rule in the overrides of the feature that holds it keeps it on, as `node: { overrides: { "n/no-process-exit": "error" } }` does. For `typescript`, that includes `overridesTypeAware`.

## File-role exceptions

Some files break a rule by design. These rules are off in them:

| Files                                                              | Rules that are off                                                                                                                                   |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Config files: sources named `*.config.*`, such as `vite.config.ts` | `import-x/no-default-export`, because tools read their config from the default export                                                                |
| Test files: sources named `*.test.*` or `*.spec.*`                 | `functional/no-expression-statements` and `functional/no-return-void`, because tests and assertions are calls whose results go unused                |
| Svelte components                                                  | `functional/no-let`, `import-x/no-mutable-exports`, `import-x/unambiguous`, and `unicorn/no-top-level-assignment-in-function`; see [Svelte](#svelte) |

The two rules of test files need type information, so they matter only with typed linting. The exceptions come after every feature, so a feature's `overrides` cannot turn these rules back on in these files. A user config can:

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

## Monorepos

`projectRootDirectory` decides which `package.json` turns on the frameworks, and it is the default `tsconfigRootDir`. Its default is the working directory of ESLint, which can differ between the command line and an editor. `import.meta.dirname` ties it to the directory of the config file instead.

With one config at the root of a monorepo, a framework that only a workspace declares is not detected. Turn it on and limit it to that workspace with `files`:

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  express: { files: ["packages/api/**/*.ts"] },
  projectRootDirectory: import.meta.dirname,
  react: { files: ["apps/web/**/*.{ts,tsx}"] },
  typescript: {
    filesTypeAware: ["packages/api/**"],
    typeChecked: true,
  },
});
```

The TypeScript files of the API then read type information through the nearest tsconfig, the one of their workspace, and the other TypeScript files are linted without it. Alternatively, give each workspace its own `eslint.config.js` with `projectRootDirectory: import.meta.dirname`.

## Limits

### CommonJS

CommonJS is not supported, and `.cjs` and `.cts` files get no rules:

- ESLint still parses `.cjs` files, because its default config matches them. `eslint .` therefore reports syntax errors and unused disable directives in them, but nothing else.
- `eslint .` skips `.cts` files. A `.cts` path passed explicitly, as lint-staged and editors do, gets the warning "File ignored because no matching configuration was supplied."

### Known issues

These are open, and each needs a decision in this package or a fix upstream:

- **TypeScript files that the TypeScript feature leaves out do not parse.** The JavaScript and code-quality features still lint them, but only the TypeScript feature sets a parser that reads TypeScript. With `typescript: false`, and for a file outside `typescript.files` or in `typescript.ignores`, ESLint reports `Parsing error: Unexpected token :`. Keep the TypeScript feature on for every TypeScript file that ESLint lints, and leave other TypeScript files out with the global `ignores`.
- **Typed linting reports React components.** `@typescript-eslint/naming-convention` allows only camelCase function names, `functional/no-return-void` reports event handlers and effects that call a state setter, and `functional/functional-parameters` reports handlers written inline in JSX. Leave React files out of typed linting with `ignoresTypeAware`.
- **An application's `package.json` cannot pass.** `package-json/require-peerDependenciesMeta` requires a field that only packages with peer dependencies have, and `require-author`, `require-devDependencies`, `require-devEngines`, and `require-scripts` apply to private packages as well. JSON has no disable comments, so turn such rules off with `packageJson.overrides`.
- **A URL in square brackets stops the run.** In a Markdown file, a URL or email address in square brackets, such as `[https://example.com]`, makes five rules of @eslint/markdown 8.0.3 throw "Custom getLoc() method must be implemented in the subclass", and ESLint stops. The rules are `no-bare-urls`, `no-invalid-label-refs`, `no-missing-label-refs`, `no-reference-like-urls`, and `no-space-in-emphasis`.
- **Custom elements become self-closing in HTML files.** `@html-eslint/require-closing-tags` fixes `<my-element></my-element>` to `<my-element />`, which browsers read as a start tag without an end. Keep explicit end tags with `html: { overrides: { "@html-eslint/require-closing-tags": ["warn", { selfClosing: "always", selfClosingCustomPatterns: [] }] } }`.
- **`.svelte.mjs` and `.svelte.mts` files do not parse.** The Svelte feature includes them, but svelte-eslint-parser reads them as components and fails with `Parsing error: Expected token }`. Name rune modules `.svelte.js` or `.svelte.ts`.
- **Legacy Svelte types.** In legacy mode, `unicorn/name-replacements` asks to rename the `$$Props` interface, which Svelte's tooling reads by that name, and `unused-imports/no-unused-vars` reports `$$Events` and `$$Slots`. `import-x/no-duplicates` reports `svelte/animate` and `svelte/transition` imported in one file, because both resolve to one declaration file.
- **Global declaration files.** A declaration file without imports or exports, such as the `vite-env.d.ts` that Vite generates, is reported by `import-x/unambiguous`, and its `/// <reference types="vite/client" />` by `@typescript-eslint/triple-slash-reference`. Add the types to `compilerOptions.types` in the tsconfig instead, and write declarations as a module, with `declare global` and `export {}`.
- **A paragraph break in a doc comment between functions.** `perfectionist/sort-modules` counts a blank line inside the doc comment of a function that follows another function as spacing between the two, and `eslint --fix` cannot remove it. Write such doc comments without an empty line.

## Migrating from 0.1.0

This version changes the options of 0.1.0 and several defaults. A lint run that passed with 0.1.0 can fail.

### Options

| 0.1.0                                                        | Now                                                                                                        |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `tsTypeChecked`                                              | `typescript.typeChecked`                                                                                   |
| `tsconfigRootDir`                                            | `typescript.tsconfigRootDir`                                                                               |
| `reactRefreshVariant`                                        | `react.refresh`                                                                                            |
| `rules.js`                                                   | `javascript.overrides` for core rules, and the `overrides` of each plugin's feature for the plugin's rules |
| `rules.ts`                                                   | `typescript.overrides` for typescript-eslint rules, and as for `rules.js` otherwise                        |
| `rules.react`, `rules.svelte`, `rules.express`, `rules.html` | `react.overrides`, `svelte.overrides`, `express.overrides`, `html.overrides`                               |
| `rules.json`, `rules.jsonc`, `rules.json5`                   | `json.overrides`, `json.overridesJsonc`, `json.overridesJson5`                                             |
| `rules.packageJson`, `rules.markdown`                        | `packageJson.overrides`, `markdown.overrides`                                                              |
| `plugins`                                                    | A [user config](#user-configs) that registers the plugin                                                   |
| `environments`, `globals`, `ignores`, `projectRootDirectory` | Unchanged                                                                                                  |

In 0.1.0, `rules.js` applied to every rule in JavaScript files, and `rules.ts` to every rule in TypeScript files. Now each feature's `overrides` apply to its own rules in its own files: `javascript.overrides` to the core rules in JavaScript and TypeScript files, `unicorn.overrides` to the unicorn rules, and so on. An override that should apply to one language only needs a user config with `files`. An override of a rule that needs type information, which `rules.ts` could hold, applies only in the files that typed linting covers; see [Feature values](#feature-values).

A config for 0.1.0:

<!-- eslint-skip -->

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  reactRefreshVariant: "vite",
  rules: {
    js: { "no-console": "off", "unicorn/no-null": "off" },
    markdown: { "markdown/no-html": "off" },
    ts: { "@typescript-eslint/no-explicit-any": "off" },
  },
  tsTypeChecked: true,
});
```

The same config now:

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  javascript: { overrides: { "no-console": "off" } },
  markdown: { overrides: { "markdown/no-html": "off" } },
  react: { refresh: "vite" },
  typescript: {
    overrides: { "@typescript-eslint/no-explicit-any": "off" },
    typeChecked: true,
  },
  unicorn: { overrides: { "unicorn/no-null": "off" } },
});
```

### Behavior

- **CommonJS.** 0.1.0 linted `.cjs` and `.cts` files as CommonJS with the full policy, although `import-x/no-commonjs` reported `require` and `module.exports` in them. Now they get no rules, as described in [CommonJS](#commonjs).
- **Framework detection.** In 0.1.0, a framework's rules were added when its plugins were installed: each React part when its own plugin was, Svelte when both of its packages were, and Express when its plugin was. Now the `package.json` in `projectRootDirectory` must declare `react`, `svelte`, or `express`. A project that installs the plugins without declaring the framework, such as a monorepo root, sets the feature to `true`, or points `projectRootDirectory` at the package that declares it.
- **Missing peers.** In 0.1.0, a missing React plugin left out only its own rules. Now a framework that is on fails with an install message when a package that it needs is missing: `react` needs both of its plugins, and the React Refresh plugin unless `refresh` is `false` or resolves to off.
- **React Refresh.** In 0.1.0, React Refresh used the generic variant without Next.js or Vite. Now it is off; `react: { refresh: "generic" }` turns it back on.
- **React hooks.** In 0.1.0, the hooks rules applied to JSX and TSX files only. Now they apply to every source, so a custom hook in a `.js` or `.ts` file is checked, and so is any function there whose name makes it a hook.
- **Svelte components.** In 0.1.0, components got only the rules of @html-eslint/eslint-plugin-svelte. Now their scripts get the rules of TypeScript sources, as described in [Svelte](#svelte).
- **Formatting.** The nine HTML layout rules and `unicorn/empty-brace-spaces`, `unicorn/number-literal-case`, and `unicorn/no-nested-ternary` are off. Core `no-nested-ternary` is on, and reports every nested ternary, also those that unicorn allowed with parentheses. `unicorn/template-indent` no longer checks `gql` and `html` templates, or those after an `/* HTML */` comment.
- **Exceptions.** The [file-role exceptions](#file-role-exceptions) are new.
- **Parameter immutability.** With typed linting, `functional/prefer-immutable-types` now requires parameters to be shallowly readonly instead of deeply readonly.
- **Block names.** The config is made of more blocks than before, named `@cravingmaker/eslint-config/<feature>/<part>`. Code that finds blocks in the returned array by name needs the new names.

A disable comment for a rule that is now off, such as `// eslint-disable-next-line import-x/no-default-export` in a config file or any rule in a `.cjs` file, becomes an "Unused eslint-disable directive" warning, which ESLint reports by default. With `--max-warnings 0`, the run fails. `eslint --fix` removes such comments, but can leave a line with only spaces, which Prettier then removes.

## License

MIT © [cravingmaker](https://github.com/cravingmaker)
