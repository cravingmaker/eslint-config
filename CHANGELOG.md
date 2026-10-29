# Changelog

## [0.3.0](https://github.com/cravingmaker/eslint-config/compare/v0.2.0...v0.3.0) (2026-10-29)


### ⚠ BREAKING CHANGES

* lint Vitest tests in projects that declare vitest ([#169](https://github.com/cravingmaker/eslint-config/issues/169))

### Features

* add an option for TypeScript files imported by their source extension ([#168](https://github.com/cravingmaker/eslint-config/issues/168)) ([79555eb](https://github.com/cravingmaker/eslint-config/commit/79555eb9406d503fa649492584de9e6fece81229))
* lint Vitest tests in projects that declare vitest ([#169](https://github.com/cravingmaker/eslint-config/issues/169)) ([e5b705f](https://github.com/cravingmaker/eslint-config/commit/e5b705fc4cbbb826834392e47b1390a2f3e4177c))
* report unused disable directives and inline configs as errors ([#167](https://github.com/cravingmaker/eslint-config/issues/167)) ([3e700d5](https://github.com/cravingmaker/eslint-config/commit/3e700d5c201aded69653dab7270838368a198c89))


### Bug Fixes

* sort only declared lists of literals in perfectionist/sort-arrays ([#166](https://github.com/cravingmaker/eslint-config/issues/166)) ([aed4564](https://github.com/cravingmaker/eslint-config/commit/aed456407b9f291cb5245faed7a842df4d76b547))

## [0.2.0](https://github.com/cravingmaker/eslint-config/compare/v0.1.0...v0.2.0) (2026-10-26)

This release rebuilds the config around one option per feature, lints TypeScript with type information by default, and revises most of the rule policy. A project that passes with 0.1.0 can fail with 0.2.0: read [Migrating from 0.1.0](https://github.com/cravingmaker/eslint-config/blob/v0.2.0/README.md#migrating-from-010) before upgrading, and keep the version pinned. The requirements are unchanged: Node.js 24.15.0 or later, ESLint 10.4.0 or later and below 11, and TypeScript below 6.1.

### Upgrading from 0.1.0

* **Options.** Each feature takes `false`, `true`, or an object with `files`, `ignores`, and `overrides`, and some take options of their own, such as `typescript.typeChecked` and `react.refresh`. `tsTypeChecked`, `tsconfigRootDir`, `reactRefreshVariant`, `rules`, and `plugins` are gone: `createConfig()` rejects them, and any other unknown option, with a message that names what replaces them ([#62](https://github.com/cravingmaker/eslint-config/issues/62), [#82](https://github.com/cravingmaker/eslint-config/issues/82)).
* **Overrides.** A feature's `overrides` merge as the rules of a later config object do: a severity alone, such as `"warn"`, keeps the options that the policy gives the rule, and an entry with options replaces them. In 0.1.0, an entry in `rules` replaced the whole entry of the policy ([#158](https://github.com/cravingmaker/eslint-config/issues/158)).
* **Typed linting is on by default.** Every TypeScript file that ESLint lints needs a `tsconfig.json` that includes it and sets `strict`, `noImplicitReturns`, and `allowUnreachableCode: false`. `typescript: { typeChecked: false }` turns typed linting off, as in 0.1.0 ([#124](https://github.com/cravingmaker/eslint-config/issues/124)).
* **Frameworks** turn on when the root `package.json` declares `react`, `svelte`, or `express`, not when their plugins are installed. A framework that is on fails with an install message when a plugin that it needs is missing ([#68](https://github.com/cravingmaker/eslint-config/issues/68), [#69](https://github.com/cravingmaker/eslint-config/issues/69)).
* **React.** React Refresh is off unless the project declares `next` or `vite` ([#69](https://github.com/cravingmaker/eslint-config/issues/69)), and the hooks rules lint `.js` and `.ts` files as well ([#70](https://github.com/cravingmaker/eslint-config/issues/70)). In typed `.tsx` files, components may have PascalCase names ([#130](https://github.com/cravingmaker/eslint-config/issues/130)).
* **Svelte.** The scripts of components get the JavaScript and TypeScript rules ([#73](https://github.com/cravingmaker/eslint-config/issues/73)). `.svelte.mjs` and `.svelte.mts` files are linted as ordinary modules ([#132](https://github.com/cravingmaker/eslint-config/issues/132)). In the `.svelte.js` rune modules that the Svelte feature lints, `n/no-sync` is off, as in TypeScript files without type information ([#156](https://github.com/cravingmaker/eslint-config/issues/156)).
* **CommonJS.** `.cjs` and `.cts` files get no rules ([#66](https://github.com/cravingmaker/eslint-config/issues/66)).
* **JSON with comments.** `jsconfig.json`, `.devcontainer.json`, and `.devcontainer/<name>/devcontainer.json` are linted as JSONC, so they may have comments, and `json.overridesJsonc` applies to them instead of `json.overrides` ([#157](https://github.com/cravingmaker/eslint-config/issues/157)).
* **Two new features**, on by default: `stylistic`, with @stylistic/eslint-plugin, and `sonarjs`, with eslint-plugin-sonarjs ([#119](https://github.com/cravingmaker/eslint-config/issues/119), [#120](https://github.com/cravingmaker/eslint-config/issues/120)).
* **Functions** are arrow functions with block bodies. `@cravingmaker/prefer-arrow-functions` and `arrow-body-style: "always"` replace 0.1.0's free choice between declarations and expressions and its concise bodies (`"as-needed"`). Methods, accessors, constructors, generators, and functions that use their own `this`, `arguments`, or `new.target` keep their form, and the bundled rule reports without fixing ([#111](https://github.com/cravingmaker/eslint-config/issues/111), [#129](https://github.com/cravingmaker/eslint-config/issues/129)).
* **Assignments** are explicit: `count = count + 1`, not `count += 1` or `count++`. 0.1.0 required compound assignments; now `operator-assignment` and `logical-assignment-operators` are `"never"`, and `no-plusplus` is on, in `for` loops too ([#111](https://github.com/cravingmaker/eslint-config/issues/111), [#133](https://github.com/cravingmaker/eslint-config/issues/133)).
* **Comments and layout.** Multiline documentation comments keep a leading `*` on each line (`@cravingmaker/starred-documentation`), and a blank line follows a function-valued variable declaration. Escapes in regular expressions are uppercase, as in strings ([#128](https://github.com/cravingmaker/eslint-config/issues/128), [#129](https://github.com/cravingmaker/eslint-config/issues/129)).
* **Limits** on size, complexity, parameters, and nesting are stricter than in 0.1.0, and they warn instead of erroring ([#111](https://github.com/cravingmaker/eslint-config/issues/111), [#133](https://github.com/cravingmaker/eslint-config/issues/133)).
* **Binary data** uses `Uint8Array`: the `Buffer` global, imports from `buffer` and `node:buffer`, the `Buffer` type, and `new Buffer()` are reported ([#83](https://github.com/cravingmaker/eslint-config/issues/83), [#131](https://github.com/cravingmaker/eslint-config/issues/131)).
* **One owner per check.** Where two rules reported the same code, one of them is now off; "Rules that replace other rules" in the README names each owner. Fixes that could change behavior are off: `@typescript-eslint/prefer-regexp-exec`, and in HTML, the fix that made custom elements self-closing ([#111](https://github.com/cravingmaker/eslint-config/issues/111), [#131](https://github.com/cravingmaker/eslint-config/issues/131), [#132](https://github.com/cravingmaker/eslint-config/issues/132)).
* **`package.json`.** A manifest with `exports` must also export `./package.json`, and a manifest that declares `peerDependencies` needs `peerDependenciesMeta` with an explicit `optional` for each peer (`@cravingmaker/require-peer-metadata`) ([#113](https://github.com/cravingmaker/eslint-config/issues/113), [#130](https://github.com/cravingmaker/eslint-config/issues/130)).
* **File roles.** Config files, named `*.config.*`, may default-export a config built at load time, and test files may call functions for their effects ([#65](https://github.com/cravingmaker/eslint-config/issues/65), [#130](https://github.com/cravingmaker/eslint-config/issues/130)). A disable comment for a rule that is now off becomes an "Unused eslint-disable directive" warning.
* **Ignored by default:** `.next/` and `.svelte-kit/` at any depth, besides `dist/`, `build/`, and `coverage/` ([#133](https://github.com/cravingmaker/eslint-config/issues/133)).
* **Package.** The tarball has no source maps ([#134](https://github.com/cravingmaker/eslint-config/issues/134)).

The bundled rules have the `@cravingmaker/` prefix and need no installation. Override each one in the feature that holds it: `prefer-arrow-functions` in `javascript`, `starred-documentation` in `unicorn`, `svelte-function-variable-padding` in `stylistic`, and `require-peer-metadata` in `packageJson`.

### Known issues

* `npm audit` in a project that installs this package reports `deepmerge-ts` through `eslint-plugin-functional`, and `katex` through `@eslint/markdown`. Linting reaches neither problem, and those plugins have no fixed releases yet. [Known issues](https://github.com/cravingmaker/eslint-config/blob/v0.2.0/README.md#known-issues) in the README gives the `overrides` that clear the findings.
* TypeScript 7 is not supported yet: typescript-eslint supports TypeScript below 6.1.
* Five Markdown rules are off until [eslint/markdown#619](https://github.com/eslint/markdown/issues/619) is fixed.

### ⚠ BREAKING CHANGES

* warn on size and complexity limits, omit deprecated rules, ignore `.next/` and `.svelte-kit/`, and reject `++`, `--`, and compound assignments ([#133](https://github.com/cravingmaker/eslint-config/issues/133))
* preserve HTML tags and correct Markdown/Svelte linting ([#132](https://github.com/cravingmaker/eslint-config/issues/132))
* align rule ownership and prevent unsafe autofixes ([#131](https://github.com/cravingmaker/eslint-config/issues/131))
* require `peerDependenciesMeta` with an explicit `optional` for every declared peer ([#130](https://github.com/cravingmaker/eslint-config/issues/130))
* require arrow functions and starred documentation ([#129](https://github.com/cravingmaker/eslint-config/issues/129))
* lint TypeScript with type information by default ([#124](https://github.com/cravingmaker/eslint-config/issues/124))
* narrow a feature's default files with files ([#91](https://github.com/cravingmaker/eslint-config/issues/91))
* prefer Uint8Array over Node.js Buffer ([#83](https://github.com/cravingmaker/eslint-config/issues/83))
* reject options that createConfig does not know ([#82](https://github.com/cravingmaker/eslint-config/issues/82))
* lint the scripts of Svelte components with the JavaScript and TypeScript rules ([#73](https://github.com/cravingmaker/eslint-config/issues/73))
* turn off lint rules that duplicate or fight Prettier ([#72](https://github.com/cravingmaker/eslint-config/issues/72))
* apply the React hooks rules to .js and .ts files ([#70](https://github.com/cravingmaker/eslint-config/issues/70))
* detect frameworks from the dependencies the project declares ([#69](https://github.com/cravingmaker/eslint-config/issues/69))
* fail with an install message when an enabled feature's peer is missing ([#68](https://github.com/cravingmaker/eslint-config/issues/68))
* remove .cjs and .cts support ([#66](https://github.com/cravingmaker/eslint-config/issues/66))
* compose the config from feature builders with per-feature options ([#62](https://github.com/cravingmaker/eslint-config/issues/62))

### Features

* add explicit SonarJS rule policy ([#120](https://github.com/cravingmaker/eslint-config/issues/120)) ([f584f74](https://github.com/cravingmaker/eslint-config/commit/f584f746eb7df53b5d213dbca0169b13b5bad6b9))
* add explicit Stylistic rule policy ([#119](https://github.com/cravingmaker/eslint-config/issues/119)) ([59f616a](https://github.com/cravingmaker/eslint-config/commit/59f616a492853d9e1a1231eaa5b791fe78195b22))
* adopt revised core policy and static rule ownership ([#111](https://github.com/cravingmaker/eslint-config/issues/111)) ([cb36447](https://github.com/cravingmaker/eslint-config/commit/cb364473099ac0d1663e5f64a596aa253a6d2c2a))
* lint TypeScript with type information by default ([#124](https://github.com/cravingmaker/eslint-config/issues/124)) ([e9a9192](https://github.com/cravingmaker/eslint-config/commit/e9a9192902d11d2af0dba9241e5db59fc64b201b))
* narrow a feature's default files with files ([#91](https://github.com/cravingmaker/eslint-config/issues/91)) ([b4c947f](https://github.com/cravingmaker/eslint-config/commit/b4c947f1f35e6b2be6112b29489088f802b40a1d))
* prefer Uint8Array over Node.js Buffer ([#83](https://github.com/cravingmaker/eslint-config/issues/83)) ([4d981f2](https://github.com/cravingmaker/eslint-config/commit/4d981f2ba6e21dab26f0277128e34f125430e829))
* remove .cjs and .cts support ([#66](https://github.com/cravingmaker/eslint-config/issues/66)) ([39e02f6](https://github.com/cravingmaker/eslint-config/commit/39e02f66ac4f731521306633e2269ec479b6fb79))
* require arrow functions and starred documentation ([#129](https://github.com/cravingmaker/eslint-config/issues/129)) ([311598b](https://github.com/cravingmaker/eslint-config/commit/311598b92d56630842fa0b4056f0b6741ae77dc0))
* require package.json exports and organize plugin rules ([#113](https://github.com/cravingmaker/eslint-config/issues/113)) ([96b291a](https://github.com/cravingmaker/eslint-config/commit/96b291a6d614561f1e1aefe603cbc2f34ff33105))


### Bug Fixes

* add file-role exceptions for test and config files ([#65](https://github.com/cravingmaker/eslint-config/issues/65)) ([e6f89db](https://github.com/cravingmaker/eslint-config/commit/e6f89db58508d40146e5114a7f6b5d4c9143d2d1))
* align rule ownership and prevent unsafe autofixes ([#131](https://github.com/cravingmaker/eslint-config/issues/131)) ([ae66847](https://github.com/cravingmaker/eslint-config/commit/ae66847b3ceaa1da85100c1c0c444dc9fbf85a39))
* apply react-refresh overrides only while React Refresh is on ([#89](https://github.com/cravingmaker/eslint-config/issues/89)) ([737db5c](https://github.com/cravingmaker/eslint-config/commit/737db5c960fc33f0f9d8c34a0774d91db36b8474))
* apply the React hooks rules to .js and .ts files ([#70](https://github.com/cravingmaker/eslint-config/issues/70)) ([cf52688](https://github.com/cravingmaker/eslint-config/commit/cf52688e43099a799c3427fbb2a6fd58373de425))
* check parameter immutability shallowly for stable results ([#64](https://github.com/cravingmaker/eslint-config/issues/64)) ([5bd8ab3](https://github.com/cravingmaker/eslint-config/commit/5bd8ab3330ca348ed7bb5b6f904ed338f356a349))
* converge escape casing and import spacing ([#128](https://github.com/cravingmaker/eslint-config/issues/128)) ([e432539](https://github.com/cravingmaker/eslint-config/commit/e4325397d3ee57c150114d523536da643afcb4f1))
* **deps:** bump typescript-eslint from 8.70.0 to 8.71.2 ([#153](https://github.com/cravingmaker/eslint-config/issues/153)) ([e2cb99a](https://github.com/cravingmaker/eslint-config/commit/e2cb99a5af615f569309de497e3f709e06332063))
* detect frameworks from the dependencies the project declares ([#69](https://github.com/cravingmaker/eslint-config/issues/69)) ([2ee07ee](https://github.com/cravingmaker/eslint-config/commit/2ee07eecd4030a76110b559a7de151a709611da3))
* fail with an install message when an enabled feature's peer is missing ([#68](https://github.com/cravingmaker/eslint-config/issues/68)) ([188419a](https://github.com/cravingmaker/eslint-config/commit/188419a1dc41d8bc36c2a8cb1d876f07892490a8))
* keep json.overrides out of JSONC files ([#81](https://github.com/cravingmaker/eslint-config/issues/81)) ([0e6de0b](https://github.com/cravingmaker/eslint-config/commit/0e6de0ba80dcd3bdcc20fe8a3a8326dd2bc062ca))
* keep n/no-sync off in Svelte rune modules ([#156](https://github.com/cravingmaker/eslint-config/issues/156)) ([3751c0a](https://github.com/cravingmaker/eslint-config/commit/3751c0ab22619b128debb302917ad9bca2091f0c))
* keep the import resolver within the files of the imports feature ([#67](https://github.com/cravingmaker/eslint-config/issues/67)) ([cedf4ca](https://github.com/cravingmaker/eslint-config/commit/cedf4ca61cf3e16b6975f10bbefc716372ac587c))
* keep the policy's options for a severity-only override ([#158](https://github.com/cravingmaker/eslint-config/issues/158)) ([1a490ae](https://github.com/cravingmaker/eslint-config/commit/1a490ae791af509e8a9c64bc5f41a43139dadbab))
* keep the type-aware blocks inside the type-aware scope ([#78](https://github.com/cravingmaker/eslint-config/issues/78)) ([2117026](https://github.com/cravingmaker/eslint-config/commit/21170268a0d110e65c58733b98f8ca7dd10520a7))
* lint jsconfig and Dev Container files as JSONC ([#157](https://github.com/cravingmaker/eslint-config/issues/157)) ([0782224](https://github.com/cravingmaker/eslint-config/commit/0782224c45a07c6d835d2656c20eb474aef17ed3))
* lint the scripts of Svelte components with the JavaScript and TypeScript rules ([#73](https://github.com/cravingmaker/eslint-config/issues/73)) ([b227c9a](https://github.com/cravingmaker/eslint-config/commit/b227c9ab9d3d56fccef452e05bdd483794b8bfba))
* preserve HTML tags and correct Markdown/Svelte linting ([#132](https://github.com/cravingmaker/eslint-config/issues/132)) ([d1fb5e3](https://github.com/cravingmaker/eslint-config/commit/d1fb5e3edba78e918fb8e81871ebfc84c0010588))
* publish without source maps ([#134](https://github.com/cravingmaker/eslint-config/issues/134)) ([e820001](https://github.com/cravingmaker/eslint-config/commit/e82000143424c9fb4a513d30b058ce530492fbcc))
* read type information only in the type-aware scope ([#71](https://github.com/cravingmaker/eslint-config/issues/71)) ([0f2a892](https://github.com/cravingmaker/eslint-config/commit/0f2a892c7e29b2fe50fc6a490e9fd1b6310e993c))
* reject options that createConfig does not know ([#82](https://github.com/cravingmaker/eslint-config/issues/82)) ([374d346](https://github.com/cravingmaker/eslint-config/commit/374d3465e9cbf8f5b62b3deadf7fbb371481ef5b))
* resolve projectRootDirectory and tsconfigRootDir to absolute paths ([#88](https://github.com/cravingmaker/eslint-config/issues/88)) ([e5ccd98](https://github.com/cravingmaker/eslint-config/commit/e5ccd9820f24ca6bfdea331010ce33e00daf9c0f))
* restore Svelte scopes and consolidate source builders ([#141](https://github.com/cravingmaker/eslint-config/issues/141)) ([10405a6](https://github.com/cravingmaker/eslint-config/commit/10405a60a3a9f6be868d72bc25a6af106b4bc5cc))
* support passing configs and conditional peer metadata ([#130](https://github.com/cravingmaker/eslint-config/issues/130)) ([90a360a](https://github.com/cravingmaker/eslint-config/commit/90a360aed94bd2b006b6b21463002cf611b830a4))
* turn off lint rules that duplicate or fight Prettier ([#72](https://github.com/cravingmaker/eslint-config/issues/72)) ([b6de43c](https://github.com/cravingmaker/eslint-config/commit/b6de43ca666ded58239417e40522097b10148e3a))
* warn on size and complexity limits, omit deprecated rules, ignore `.next/` and `.svelte-kit/`, and reject `++`, `--`, and compound assignments ([#133](https://github.com/cravingmaker/eslint-config/issues/133)) ([8273526](https://github.com/cravingmaker/eslint-config/commit/8273526416e19aa001fa73250e217aa1f8c971a1))


### Code Refactoring

* compose the config from feature builders with per-feature options ([#62](https://github.com/cravingmaker/eslint-config/issues/62)) ([c655717](https://github.com/cravingmaker/eslint-config/commit/c65571715c78016271e05a8b7e510d20325df442))

### Dependencies

* add `@stylistic/eslint-plugin` 5.10.0
* add `eslint-plugin-sonarjs` 4.2.2
* update `@eslint/json` from 2.1.0 to 2.1.1
* update `eslint-plugin-n` from 18.3.0 to 18.4.1
* update `eslint-plugin-package-json` from 1.9.0 to 1.10.1
* update `eslint-plugin-perfectionist` from 5.11.1 to 5.12.1
* update `eslint-plugin-regexp` from 3.2.0 to 3.3.1
* update `eslint-plugin-security` from 4.0.1 to 4.2.0
* update `eslint-plugin-unicorn` from 74.0.0 to 77.0.0
* update `globals` from 17.12.0 to 17.13.0
* update `typescript-eslint` from 8.70.0 to 8.71.2

Peer dependency ranges and `engines` are unchanged.

## [0.1.0](https://github.com/cravingmaker/eslint-config/compare/v0.0.10...v0.1.0) (2026-10-06)


### Features

* complete config API surface ([#41](https://github.com/cravingmaker/eslint-config/issues/41)) ([f268c33](https://github.com/cravingmaker/eslint-config/commit/f268c332954f9654785a04919dd9455ac9b8c076))
* update dependencies and add support for react-refresh and react-hooks ([edb163a](https://github.com/cravingmaker/eslint-config/commit/edb163ac8bfe971a7142f82a12e0d870ef67534a))
* update nextAllowExportNames to match the plugin config ([71f9aca](https://github.com/cravingmaker/eslint-config/commit/71f9aca99702f498c89c00e193a12bf08de58de6))


### Bug Fixes

* align createConfig option semantics ([#20](https://github.com/cravingmaker/eslint-config/issues/20)) ([ce41e76](https://github.com/cravingmaker/eslint-config/commit/ce41e7685efd09530ba6c627650a9ba749d89ba6))
* harden monorepo and CommonJS support ([#40](https://github.com/cravingmaker/eslint-config/issues/40)) ([151cccf](https://github.com/cravingmaker/eslint-config/commit/151cccf15d09601880c02b856996c5d7c5bf36c5))
* harden parser configuration ([#39](https://github.com/cravingmaker/eslint-config/issues/39)) ([c7a72f3](https://github.com/cravingmaker/eslint-config/commit/c7a72f355aec1be9081983a5e4bac9b188d317de))
