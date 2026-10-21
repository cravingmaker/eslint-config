# @cravingmaker/eslint-config

Craving Maker's opinionated, TypeScript-first ESLint configuration. One call, `createConfig()`, returns a flat config that lints the TypeScript, JavaScript, React, Svelte, Express, HTML, JSON, `package.json`, and Markdown files of an ES module project.

TypeScript first means that the defaults are made for TypeScript projects in strict mode. TypeScript files get typescript-eslint's strict and stylistic rules with type information, which typescript-eslint reads through the project's `tsconfig.json`, and the config expects that tsconfig to turn on `strict` (see [TypeScript](#typescript)).

The policy is strict. Every current non-deprecated rule has an explicit enabled or disabled setting, with its options declared in the owning rule map. New upstream rules stay unconfigured until the policy is reviewed. Formatting is left to Prettier. Each part of the config is a feature that you can turn off, limit to some files, or adjust with rule overrides.

The [coding principles](https://github.com/cravingmaker/eslint-config/blob/main/CODING_PRINCIPLES.md) define the priorities for code style, architecture, and decisions about linting, formatting, and scripts.

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
- For TypeScript files, a `tsconfig.json` that includes them, with the compiler options in [tsconfig](#tsconfig).
- TypeScript `>=4.8.4 <6.1.0`, the peer range of the installed typescript-eslint. npm installs a version in that range when the project has none. TypeScript 7 is not supported yet: npm can install it with an `ERESOLVE overriding peer dependency` warning, but ESLint then stops while loading the config, before linting any file, with `TypeError: Cannot read properties of undefined (reading 'Intrinsic')` from ts-api-utils.
- ES modules. The package is ESM-only, so the config file must be an ES module: `eslint.config.js` in a package with `"type": "module"`, or `eslint.config.mjs`. JavaScript and TypeScript files are linted as ES modules, and CommonJS files get no rules (see [CommonJS](#commonjs)).

## Installation

```bash
npm install --save-dev --save-exact eslint @cravingmaker/eslint-config
```

Rule settings and fixed option defaults are declared locally rather than inherited from plugin presets. A release can still change lint results through a reviewed policy change or an upstream bug fix. Pin the exact version, as `--save-exact` does, and update on purpose.

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

Every feature is on by default, apart from React, Svelte, and Express, which turn on when the `package.json` of the project declares them (see [Automatic detection](#automatic-detection)). TypeScript files are linted with type information by default (see [Typed linting](#typed-linting)).

For binary data, use `Uint8Array`. The defaults report the `Buffer` global, imports from `buffer` and `node:buffer`, and TypeScript `Buffer` types with "Use Uint8Array instead." Type annotations offer an editor suggestion to use `Uint8Array`.

Only the built-in globals of ECMAScript are defined. In JavaScript files, `no-undef` therefore reports names such as `console`, `window`, and `process` until `environments` names the runtime. TypeScript files are not affected, because the compiler checks names there.

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  environments: ["browser"],
});
```

## Options

`createConfig(options, ...userConfigs)` takes one options object, whose properties are all optional, and any number of [user configs](#user-configs). An option that it does not know is an error, at the top level and in the object of a feature: `createConfig()` rejects with a message that names every such option and the valid ones, and ESLint exits with code 2 before it lints anything.

| Option                                                                                                                                            | Default         | Description                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projectRootDirectory`                                                                                                                            | `process.cwd()` | The directory whose `package.json` decides the `"auto"` features. It is also the default of `typescript.tsconfigRootDir`. A relative path is resolved from the working directory.           |
| `ignores`                                                                                                                                         | `[]`            | Patterns of files that no feature lints, in addition to `**/dist/`, `**/build/`, and `**/coverage/`.                                                                                        |
| `environments`                                                                                                                                    | `[]`            | Runtimes whose globals are defined in JavaScript, TypeScript, and Svelte files, named as in the [globals](https://www.npmjs.com/package/globals) package: `"browser"`, `"node"`, and so on. |
| `globals`                                                                                                                                         | `{}`            | More globals, or changes to those of `environments`, such as `{ MY_GLOBAL: "readonly" }`.                                                                                                   |
| `javascript`                                                                                                                                      | `{}`            | ESLint's core rules. Always on, so it takes only an object.                                                                                                                                 |
| `typescript`                                                                                                                                      | `true`          | typescript-eslint, with type information by default and the options in [TypeScript](#typescript).                                                                                           |
| `comments`, `node`, `security`, `sonarjs`, `imports`, `unusedImports`, `promise`, `regexp`, `unicorn`, `functional`, `perfectionist`, `stylistic` | `true`          | Code-quality and style plugins for JavaScript and TypeScript.                                                                                                                               |
| `html`, `json`, `packageJson`, `markdown`                                                                                                         | `true`          | File formats. `json` also takes `overridesJsonc` and `overridesJson5`.                                                                                                                      |
| `react`, `svelte`, `express`                                                                                                                      | `"auto"`        | Frameworks, described in [Frameworks](#frameworks).                                                                                                                                         |

### Feature values

Every option from `javascript` down is a feature, and takes one of these values:

- `false` turns the feature off, so none of its rules apply.
- `true` turns it on with its defaults.
- An object turns it on with these options:
  - `files`: patterns that limit the feature to some of its default files, such as `src/**`. The feature lints a file that matches one of its default patterns and one of these.
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

- **`files` limits a feature and cannot extend it.** A directory is enough: with `files: ["src/**"]`, a feature for sources lints the sources and the Svelte components in `src/`, and leaves the JSON and Markdown files there to their own features. A pattern with an extension, such as `src/**/*.ts`, also leaves out every other file that the feature lints by default, Svelte components included. A pattern that matches none of the default files, such as `**/*.markdown` for `markdown`, matches nothing. To lint another file type, see [Other file types](#other-file-types).
- **Override a rule in the feature that holds it:** a core rule in `javascript`, and a plugin's rule in the feature of that plugin, listed in [Features](#features). The blocks of each feature come after those of the features before it, so `javascript: { overrides: { "unicorn/no-null": "off" } }` changes nothing, while `unicorn: { overrides: { "unicorn/no-null": "off" } }` turns the rule off. To change a rule in some files only, use a [user config](#user-configs).
- **An override of a rule that needs type information applies only where typed linting does.** Such a rule stops ESLint in a file without type information, so an override that turns it on, also one that only changes its options, applies in the files that [typed linting](#typed-linting) covers. In the other files of the feature the rule stays off, and so it does in every file while `typeChecked` is `false`. An override that turns such a rule off applies in every file. These rules are the ones of typescript-eslint, eslint-plugin-functional, and eslint-plugin-sonarjs that need type information, and `n/no-sync`. `n/no-sync` needs it only in TypeScript files and Svelte components, so in JavaScript files an override of it applies as any other does.

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
| `svelte`        | [@html-eslint/eslint-plugin-svelte](https://www.npmjs.com/package/@html-eslint/eslint-plugin-svelte), with [svelte-eslint-parser](https://www.npmjs.com/package/svelte-eslint-parser)                                                                                              | `**/*.svelte`, and rune modules: `**/*.svelte.{js,mjs,ts,mts}`         |
| `express`       | [eslint-plugin-express-security](https://www.npmjs.com/package/eslint-plugin-express-security)                                                                                                                                                                                     | `**/*.{js,mjs,ts,mts}`                                                 |
| `html`          | [@html-eslint/eslint-plugin](https://www.npmjs.com/package/@html-eslint/eslint-plugin)                                                                                                                                                                                             | `**/*.html`                                                            |
| `json`          | [@eslint/json](https://www.npmjs.com/package/@eslint/json)                                                                                                                                                                                                                         | JSON, JSONC, and JSON5 files, below                                    |
| `packageJson`   | [eslint-plugin-package-json](https://www.npmjs.com/package/eslint-plugin-package-json), [eslint-enforce-package-type](https://www.npmjs.com/package/eslint-enforce-package-type)                                                                                                   | `**/package.json`                                                      |
| `markdown`      | [@eslint/markdown](https://www.npmjs.com/package/@eslint/markdown)                                                                                                                                                                                                                 | `**/*.md`, as GitHub Flavored Markdown with YAML front matter and math |

SonarJS adds control-flow, security, accessibility, and test checks. Every exported rule has an explicit setting, including deprecated rules as `off`. Disabled overlaps name their owner in the policy. SonarJS owns duplicate-branch checks across conditionals and switches; the overlapping Unicorn rule is off. Checks that need human review, such as complexity thresholds and suspected hardcoded secrets, warn. Rules that require type information run with [typed linting](#typed-linting), which is on by default, within its scope and the SonarJS feature's own `files` and `ignores`.

The `packageJson` feature requires `type: "module"`. A package with `exports` or `publishConfig.exports` must also expose `"./package.json": "./package.json"`; use `packageJson.overrides` to change these rules.

Peer dependencies are optional. When `peerDependencies` is declared, every peer needs an entry in nonempty `peerDependenciesMeta` with an explicit boolean `optional`: `true` for an optional peer, `false` for a required peer. A package without peers can omit metadata; an explicitly empty object remains invalid. The bundled `@cravingmaker/require-peer-metadata` rule owns conditional completeness, while Package JSON's shape, relationship, and nonempty-field rules validate metadata that is present. Use `packageJson.overrides` to change this policy.

The `json` feature lints three languages:

- JSON: `**/*.json`, apart from `package.json`, `package-lock.json`, and the JSONC files below.
- JSONC: `**/*.jsonc`, `**/tsconfig*.json`, `**/.vscode/*.json`, and `**/.devcontainer/*.json`.
- JSON5: `**/*.json5`.

`json.files` and `json.ignores` apply to all three languages. `json.overrides` apply to JSON files only: JSONC and JSON5 files take their overrides from `json.overridesJsonc` and `json.overridesJson5`.

Nothing else is linted: not CommonJS files (see [CommonJS](#commonjs)), not the code blocks in Markdown files, and no other file type, such as CSS, YAML, Vue, or Astro.

## Frameworks

### Automatic detection

`react`, `svelte`, and `express` default to `"auto"`. The feature turns on when the `package.json` in `projectRootDirectory` declares the package `react`, `svelte`, or `express` in `dependencies`, `devDependencies`, or `peerDependencies`. Installed packages count for nothing, and neither do the plugins, declared or installed. A `package.json` that is missing or not valid JSON declares nothing.

`true`, `false`, or an object always wins over detection. A monorepo root that declares no framework therefore turns a framework on with `true` or an object; see [Monorepos](#monorepos).

### Peer dependencies

The plugins of each framework are optional peer dependencies. The explicit policy uses the rules and option fields supported by the installed peer version. Install the ones for the frameworks that you use:

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

The feature has no rules for JSX itself, such as those of eslint-plugin-react, and none for accessibility, such as those of eslint-plugin-jsx-a11y; add them with a [user config](#user-configs). Typed linting, which is on by default, reports React components, as described in [Known issues](#known-issues).

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

The config is TypeScript first. typescript-eslint parses TypeScript files, and its strict and stylistic rules apply to them, including the rules that need type information: [typed linting](#typed-linting) is on by default.

| Option               | Default                  | Description                                                                                                                                                                                           |
| -------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typeChecked`        | `true`                   | Lint with type information. `false` turns typed linting off.                                                                                                                                          |
| `filesTypeAware`     | The files of the feature | Files that the parser reads with type information and that get the rules that need it. They match only the TypeScript files that the feature lints, so a directory such as `src/**` is enough.        |
| `ignoresTypeAware`   | `[]`                     | Files to lint without type information, such as scripts that no tsconfig includes.                                                                                                                    |
| `overridesTypeAware` | `{}`                     | Rule settings for the files that typed linting covers, applied after the rules that need type information and after `overrides`.                                                                      |
| `tsconfigRootDir`    | `projectRootDirectory`   | The directory that holds the root `tsconfig.json`, for typescript-eslint and the TypeScript import resolver. A relative path is resolved from the working directory, not from `projectRootDirectory`. |

`files`, `ignores`, and `overrides` work as for every feature.

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
- `noImplicitReturns` and `allowUnreachableCode: false` make the compiler report a missing return value and unreachable code. In TypeScript files, the config leaves these checks to the compiler: `@typescript-eslint/consistent-return`, `sonarjs/no-inconsistent-returns`, and `no-unreachable` are off there. So is `no-useless-return`, because `noImplicitReturns` requires the `return;` that it would remove.

The core rules whose checks the compiler makes in any case, such as `no-undef`, are off in TypeScript files as well. ESLint does not report the errors of the compiler, so run `tsc --noEmit` too, for example in CI.

### Typed linting

Typed linting is on by default. typescript-eslint's project service reads the type information of each TypeScript file through the nearest `tsconfig.json`, and the rules of the `typescript`, `functional`, `node`, and `sonarjs` features that need type information turn on in the same files. A file that no tsconfig includes fails with a parsing error that says it "was not found by the project service". Leave such files out of typed linting with `ignoresTypeAware`, or limit typed linting to your sources with `filesTypeAware`:

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

In typed `.tsx` files, function-valued `const` bindings and function declarations may also use PascalCase, so arrow components such as `Greeting` pass naming checks. Ordinary data retains its existing naming formats, as do other extensions. This allowance identifies function types, not React components; function-style checks still require arrows where their semantic exceptions do not apply. Feature overrides and user configs can replace the naming policy.

`typeChecked: false` turns typed linting off, for a project without a tsconfig, for example. TypeScript files then get the rules that work without type information, and the rules that need it are off:

```js
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  typescript: { typeChecked: false },
});
```

## Formatting with Prettier

Prettier runs as a separate step. ESLint enforces compatible token spacing and
structural conventions, while Prettier chooses wrapping, indentation, quotes,
and semicolons:

```bash
npx prettier --check . && npx eslint .
```

You do not need eslint-config-prettier. Its disable list does not choose this
config's policy: `curly` stays on, and the `stylistic` feature explicitly
classifies all 97 bundled rules. Compatible rules enforce token spacing, spaced
comments, class member separation, PascalCase JSX components, self-closing JSX,
and consistent JSX expression braces. Logical and bitwise mixtures require
parentheses; ordinary arithmetic follows JavaScript precedence.

Rules with competing layout choices remain off for specific reasons documented
in their rule maps. These include Stylistic's indentation, wrapping, quote, and
semicolon rules, so consumers can choose Prettier options such as `useTabs`,
`printWidth`, `singleQuote`, and `semi`. Deprecated and experimental Stylistic
rules are explicitly off. Other disabled layout rules include:

- `no-unexpected-multiline`.
- `unicorn/empty-brace-spaces`, `unicorn/number-literal-case`, and `unicorn/no-nested-ternary`. Core `no-nested-ternary` reports directly nested result branches and has no fix for Prettier to undo. Conditional-position nesting is outside its coverage.
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

The core policy also requires braces around branches, arrow expressions with block bodies for ordinary functions,
and expanded assignments (`value = value + amount` and
`value = value || fallback`). Prettier preserves those syntax choices; it
continues to decide indentation, quotes, and wrapping. The formatter tests check
that its output agrees with the enabled Stylistic rules across supported layouts.

`@cravingmaker/prefer-arrow-functions` owns function style in the `javascript`
feature. It replaces `func-style` and `prefer-arrow-callback` so declarations,
initializers, assignments, return values, exports, and callbacks share one
diagnostic owner. Methods, accessors, generators, overload signatures and their
implementations, named recursive function expressions, and functions using their
own `this`, `arguments`, or `new.target` retain their semantics. Local constructor
uses through `new`, `extends`, `Reflect.construct`, and `.prototype` are preserved.
The rule reports without fixes or suggestions: review hoisting and function
identity when converting, and use a scoped override for constructor contracts
that are only visible outside the defining file.

Array callbacks explicitly forward their intended arguments through block-bodied arrows. `unicorn/no-array-callback-reference` stays enabled and `functional/prefer-tacit` stays off: passing a function directly to `map` also supplies the index and array, which can change the result of a function with optional parameters.

The `unicorn` feature enables `@cravingmaker/starred-documentation` for multiline
`/** ... */` comments. It preserves paragraph breaks and ordinary line/block
comments; `unicorn/no-asterisk-prefix-in-documentation-comments` stays off.
These rules are bundled internally and need no additional installation.
Stylistic requires a blank line after a direct function-valued variable
declaration, including named exports, multiple declarators, and transparent
TypeScript assertion wrappers, before a following statement and its leading
documentation. Ordinary data variables, object properties, closing braces, and
EOF gain no padding requirement. Perfectionist still orders module declarations,
but its module-member blank-line checks are disabled because the installed
fixer miscounts documentation paragraphs. Other Perfectionist spacing policies
are unchanged.

`@cravingmaker/svelte-function-variable-padding` complements Stylistic only
for top-level Svelte script statements, which the installed Stylistic rule skips.
Nested statements retain the Stylistic owner. The companion follows the
`stylistic` feature's files, ignores, and overrides; use its rule ID when
overriding top-level Svelte padding. It loads no optional peer itself.

Hexadecimal and Unicode escapes use uppercase letters in regular expressions and
strings. Comments do not partition import sorting groups:
`perfectionist/sort-imports` owns ordering and spacing within groups, while
`import-x/newline-after-import` checks the spacing before the next statement
without treating comments as import boundaries. These policies converge when
ESLint fixes and Prettier formatting run repeatedly.
The newline rule retains `count: 1` as a minimum and uses `exactCount: false`, so
multiline documentation after the imports is accepted.

## Rules that replace other rules

Each replacement has a fixed owner. The winning rule is enabled in its own
rule map, and its alternatives are explicitly `"off"`, with a `Handled by`
comment naming the winner. Reviewed complementary checks remain enabled when
their coverage differs, even where both report. There are no dynamic overlap
or fallback blocks.

| Winning feature | Rules left off in other features                                                                                                                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `imports`       | `no-duplicate-imports`, `n/file-extension-in-import`, `n/no-extraneous-import`, `n/no-missing-import`                                                                                                                                                    |
| `perfectionist` | `sort-imports`, `sort-keys`, `import-x/first`, `import-x/order`, `@typescript-eslint/adjacent-overload-signatures`, `@typescript-eslint/member-ordering`                                                                                                 |
| `regexp`        | `no-control-regex`, `no-empty-character-class`, `no-invalid-regexp`, `no-useless-backreference`                                                                                                                                                          |
| `unicorn`       | `no-negated-condition`, `no-warning-comments`, `n/no-process-exit`, `n/prefer-node-protocol`                                                                                                                                                             |
| `unusedImports` | `no-unused-vars`, `@typescript-eslint/no-unused-vars`                                                                                                                                                                                                    |
| `javascript`    | `perfectionist/sort-variable-declarations`, `regexp/prefer-named-capture-group`, `unicorn/consistent-arrow-return-style`, `unicorn/logical-assignment-operators`, `unicorn/no-typeof-undefined`, `unicorn/operator-assignment`, `unicorn/try-complexity` |

Disabling a winning feature, or limiting it with `files` or `ignores`, leaves
its alternatives off. The check is absent in those files unless a consumer
explicitly enables another rule through the owning feature's overrides or a
user config. Disabled rules do not need options; provide the desired options
when enabling one. Type-aware overrides still apply only in the typed scope.

Core `eqeqeq` owns strict comparisons, including null, so `no-eq-null` is off.
Core `no-eval` retains `allowIndirect: false`, including optional and indirect
eval calls; `security/detect-eval-with-expression` is off. Core
`no-nested-ternary` owns nested result branches, including irreducible ones;
`unicorn/no-unnecessary-nested-ternary` is off and its automatic simplification
is no longer offered. Neither rule covered every conditional-position nesting.

`no-restricted-syntax` rejects direct `new Buffer(...)` with `Use Uint8Array
instead.`, including nonliteral arguments and dynamically imported bindings named
`Buffer`. The global, static-import, TypeScript-type, and Node deprecation checks
remain enabled. Unicorn's constructor autofixes conflict with the Uint8Array
policy, so `unicorn/no-new-buffer` and `security/detect-new-buffer` are off.
The selector matches the callee name, including local classes; aliases and
global-property constructors are outside this selector. Convert manually to
preserve encoding, coercion, and shared-memory behavior.

These complementary checks retain their existing severities, options, and
typed scopes:

| Checks                                                          | Distinct coverage                                                                                                                                                                        |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core and RegExp `no-useless-escape`                             | Strings, templates, and additional literals complement RegExp constructor patterns.                                                                                                      |
| RegExp backtracking and movement; Security unsafe-regex warning | Specific analyses complement heuristic warnings, including bounded nested repetitions. A report is a review signal, not proof of vulnerability.                                          |
| Unicorn and Promise await preferences                           | Awaited, yielded, constructor, top-level, and computed chains complement void-discarded function chains and method-name heuristics. Promise keeps `strict: false`.                       |
| Unicorn and TypeScript sort comparators                         | String arrays, explicit undefined comparators, and untyped files complement typed computed and optional calls. TypeScript keeps `ignoreStringArrays: true`; typed arrays remain allowed. |
| Core Unicode flags and SonarJS Unicode analysis                 | General literal/constructor flag enforcement complements typed implicit string patterns. Either `u` or `v` is allowed.                                                                   |
| Core default branches and TypeScript exhaustiveness             | Untyped fallback intent complements typed empty switches, missing union/enum cases, and exact lowercase `no default` markers. A default does not excuse missing union cases.             |

RegExp owns control-character checking. Turning off core `no-control-regex`
intentionally permits constructor string escapes such as `"\t"` and `"\n"`;
the RegExp rule still reports disallowed control patterns and constant expressions.

`regexp/prefer-regexp-exec` remains active for manual review.
`@typescript-eslint/prefer-regexp-exec` is temporarily off in both typed and
untyped maps: its autofix can change all-match arrays when `new RegExp(source)`
inherits `g`. SonarJS's counterpart stays off. Computed-access preference reports
are intentionally lost until a corrected TypeScript rule is verified against
inherited flags, match/exec arrays, computed access, and repeated fixes. RegExp
can report unknown flags without a safe rewrite; preserve intentional global
matches. Await preferences also require review of detached work and constructor
initialization, and adding Unicode flags can change matching semantics.

TypeScript compiler checks and extension rules keep their language-specific
ownership in the TypeScript rule maps. These entries apply only in TypeScript
files and Svelte scripts, and typed replacements only where type information
is available. The compiler makes its checks with the options in
[tsconfig](#tsconfig).

## File-role exceptions

Some files break a rule by design. These rules are off in them:

| Files                                                              | Rules that are off                                                                                                                                   |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Config files: sources named `*.config.*`, such as `vite.config.ts` | `import-x/no-default-export` and `unicorn/no-top-level-side-effects`, because tools assemble their config at module load and read its default export |
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

Import resolution uses the tsconfig in `tsconfigRootDir` and follows its `references`; it does not discover each workspace's tsconfig as typed linting does. If a workspace defines `compilerOptions.paths` but the root tsconfig does not reference it, `import-x/no-unresolved` reports imports through those aliases, even when typed linting reads the workspace's tsconfig.

Add the workspace to the root tsconfig's `references`, or pass a [user config](#user-configs) scoped to that workspace, such as `files: ["packages/api/**"]`. In that config, set `settings["import-x/resolver-next"]` to an array containing a resolver created with `createTypeScriptImportResolver` from `eslint-import-resolver-typescript`. Give it `alwaysTryTypes: true` and `project` set to the absolute path of the workspace's `tsconfig.json`. Add the resolver package to the project's dev dependencies when importing it in the config.

## Limits

### JSX file extensions

JSX parses in `.jsx`, `.mjsx`, and `.tsx` files only. A `.js` file containing JSX, such as a page in a JavaScript Next.js project, fails with `Parsing error: Unexpected token <`, even with `react: true`. Use `.jsx` or `.mjsx` for JavaScript that contains JSX.

The TypeScript and React feature globs include `.mtsx`, but JSX does not parse in that extension: `<div />` fails with `Parsing error: '>' expected.`. Use `.tsx` for TypeScript that contains JSX.

### CommonJS

CommonJS is not supported, and `.cjs` and `.cts` files get no rules:

- ESLint still parses `.cjs` files, because its default config matches them. `eslint .` therefore reports syntax errors and unused disable directives in them, but nothing else.
- `eslint .` skips `.cts` files. A `.cts` path passed explicitly, as lint-staged and editors do, gets the warning "File ignored because no matching configuration was supplied."
- A feature's `files` does not bring them in. It only limits the feature's default files, and no CommonJS file is among them.

### Known issues

These are open, and each needs a decision in this package or a fix upstream:

- **TypeScript files that the TypeScript feature leaves out do not parse.** The JavaScript and code-quality features still lint them, but only the TypeScript feature sets a parser that reads TypeScript. With `typescript: false`, and for a file outside `typescript.files` or in `typescript.ignores`, ESLint reports `Parsing error: Unexpected token :`. Keep the TypeScript feature on for every TypeScript file that ESLint lints, and leave other TypeScript files out with the global `ignores`.
- **Typed linting reports some React handlers and effects.** `functional/no-return-void` reports event handlers and effects that call a state setter, and `functional/functional-parameters` reports handlers written inline in JSX. These checks remain independent of the typed TSX naming allowance. Leave React files out of typed linting with `ignoresTypeAware` when needed.
- **Private manifests still require package information.** `require-author`, `require-devDependencies`, `require-devEngines`, and `require-scripts` apply to private packages as well. JSON has no disable comments, so use `packageJson.overrides` when a project does not need those fields. Peer metadata is required only when peers are declared.
- **A URL in square brackets stops the run.** In a Markdown file, a URL or email address in square brackets, such as `[https://example.com]`, makes five rules of @eslint/markdown 8.0.3 throw "Custom getLoc() method must be implemented in the subclass", and ESLint stops. The rules are `no-bare-urls`, `no-invalid-label-refs`, `no-missing-label-refs`, `no-reference-like-urls`, and `no-space-in-emphasis`.
- **Custom elements become self-closing in HTML files.** `@html-eslint/require-closing-tags` fixes `<my-element></my-element>` to `<my-element />`, which browsers read as a start tag without an end. Keep explicit end tags with `html: { overrides: { "@html-eslint/require-closing-tags": ["warn", { selfClosing: "always", selfClosingCustomPatterns: [] }] } }`.
- **`.svelte.mjs` and `.svelte.mts` files do not parse.** The Svelte feature includes them, but svelte-eslint-parser reads them as components and fails with `Parsing error: Expected token }`. Name rune modules `.svelte.js` or `.svelte.ts`.
- **Legacy Svelte types.** In legacy mode, `unicorn/name-replacements` asks to rename the `$$Props` interface, which Svelte's tooling reads by that name, and `unused-imports/no-unused-vars` reports `$$Events` and `$$Slots`. `import-x/no-duplicates` reports `svelte/animate` and `svelte/transition` imported in one file, because both resolve to one declaration file.
- **Global declaration files.** A declaration file without imports or exports, such as the `vite-env.d.ts` that Vite generates, is reported by `import-x/unambiguous`, and its `/// <reference types="vite/client" />` by `@typescript-eslint/triple-slash-reference`. Add the types to `compilerOptions.types` in the tsconfig instead, and write declarations as a module, with `declare global` and `export {}`.

## Migrating from 0.1.0

This version changes the options of 0.1.0 and several defaults. A lint run that passed with 0.1.0 can fail.

### Options

| 0.1.0                                                        | Now                                                                                                        |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `tsTypeChecked`                                              | `typescript.typeChecked`, which is now `true` by default                                                   |
| `tsconfigRootDir`                                            | `typescript.tsconfigRootDir`                                                                               |
| `reactRefreshVariant`                                        | `react.refresh`                                                                                            |
| `rules.js`                                                   | `javascript.overrides` for core rules, and the `overrides` of each plugin's feature for the plugin's rules |
| `rules.ts`                                                   | `typescript.overrides` for typescript-eslint rules, and as for `rules.js` otherwise                        |
| `rules.react`, `rules.svelte`, `rules.express`, `rules.html` | `react.overrides`, `svelte.overrides`, `express.overrides`, `html.overrides`                               |
| `rules.json`, `rules.jsonc`, `rules.json5`                   | `json.overrides`, `json.overridesJsonc`, `json.overridesJson5`                                             |
| `rules.packageJson`, `rules.markdown`                        | `packageJson.overrides`, `markdown.overrides`                                                              |
| `plugins`                                                    | A [user config](#user-configs) that registers the plugin                                                   |
| `environments`, `globals`, `ignores`, `projectRootDirectory` | Unchanged                                                                                                  |

`createConfig()` rejects a config that still has `tsTypeChecked`, `tsconfigRootDir`, `reactRefreshVariant`, `rules`, or `plugins`, with a message that names what replaces each of them.

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
  },
  unicorn: { overrides: { "unicorn/no-null": "off" } },
});
```

### Behavior

- **Typed linting.** In 0.1.0, `tsTypeChecked` was `false` by default. Now typed linting is on by default, so each TypeScript file that ESLint lints needs a tsconfig that includes it, with the compiler options in [tsconfig](#tsconfig). `typescript: { typeChecked: false }` turns it off, as in 0.1.0.
- **Return statements.** `no-useless-return` is off in TypeScript files and Svelte components, where the compiler option `noImplicitReturns` requires the `return;` that it would remove.
- **CommonJS.** 0.1.0 linted `.cjs` and `.cts` files as CommonJS with the full policy, although `import-x/no-commonjs` reported `require` and `module.exports` in them. Now they get no rules, as described in [CommonJS](#commonjs).
- **Framework detection.** In 0.1.0, a framework's rules were added when its plugins were installed: each React part when its own plugin was, Svelte when both of its packages were, and Express when its plugin was. Now the `package.json` in `projectRootDirectory` must declare `react`, `svelte`, or `express`. A project that installs the plugins without declaring the framework, such as a monorepo root, sets the feature to `true`, or points `projectRootDirectory` at the package that declares it.
- **Missing peers.** In 0.1.0, a missing React plugin left out only its own rules. Now a framework that is on fails with an install message when a package that it needs is missing: `react` needs both of its plugins, and the React Refresh plugin unless `refresh` is `false` or resolves to off.
- **React Refresh.** In 0.1.0, React Refresh used the generic variant without Next.js or Vite. Now it is off; `react: { refresh: "generic" }` turns it back on.
- **React hooks.** In 0.1.0, the hooks rules applied to JSX and TSX files only. Now they apply to every source, so a custom hook in a `.js` or `.ts` file is checked, and so is any function there whose name makes it a hook.
- **Svelte components.** In 0.1.0, components got only the rules of @html-eslint/eslint-plugin-svelte. Now their scripts get the rules of TypeScript sources, as described in [Svelte](#svelte).
- **Formatting.** The nine HTML layout rules and `unicorn/empty-brace-spaces`, `unicorn/number-literal-case`, and `unicorn/no-nested-ternary` are off. Core `no-nested-ternary` reports directly nested result branches, including chained ternaries; it does not cover conditional-position nesting. `unicorn/template-indent` no longer checks `gql` and `html` templates, or those after an `/* HTML */` comment.
- **Exceptions.** The [file-role exceptions](#file-role-exceptions) are new.
- **Parameter immutability.** With typed linting, `functional/prefer-immutable-types` now requires parameters to be shallowly readonly instead of deeply readonly.
- **Block names.** The config is made of more blocks than before, named `@cravingmaker/eslint-config/<feature>/<part>`. Code that finds blocks in the returned array by name needs the new names.

A disable comment for a rule that is now off, such as `// eslint-disable-next-line import-x/no-default-export` in a config file or any rule in a `.cjs` file, becomes an "Unused eslint-disable directive" warning, which ESLint reports by default. With `--max-warnings 0`, the run fails. `eslint --fix` removes such comments, but can leave a line with only spaces, which Prettier then removes.

## Contributing and security

See [CONTRIBUTING.md](https://github.com/cravingmaker/eslint-config/blob/main/CONTRIBUTING.md)
for contribution and pull request guidance, and follow the
[Code of Conduct](https://github.com/cravingmaker/eslint-config/blob/main/CODE_OF_CONDUCT.md)
when participating in the project. Report vulnerabilities privately
as described in [SECURITY.md](https://github.com/cravingmaker/eslint-config/blob/main/SECURITY.md).

## License

MIT © [cravingmaker](https://github.com/cravingmaker)
