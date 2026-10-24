# Changelog

## [0.2.0](https://github.com/cravingmaker/eslint-config/compare/v0.1.0...v0.2.0) (2026-10-24)


### ⚠ BREAKING CHANGES

* align audit severity and explicit update policies ([#133](https://github.com/cravingmaker/eslint-config/issues/133))
* preserve HTML tags and correct Markdown/Svelte linting ([#132](https://github.com/cravingmaker/eslint-config/issues/132))
* align rule ownership and prevent unsafe autofixes ([#131](https://github.com/cravingmaker/eslint-config/issues/131))
* each declared peer needs metadata with an explicit `optional` boolean, including `optional: false` for required peers.
* require arrow functions and starred documentation ([#129](https://github.com/cravingmaker/eslint-config/issues/129))
* lint TypeScript with type information by default ([#124](https://github.com/cravingmaker/eslint-config/issues/124))
* narrow a feature's default files with files ([#91](https://github.com/cravingmaker/eslint-config/issues/91))
* bring back only the checks that an owner replaces ([#90](https://github.com/cravingmaker/eslint-config/issues/90))
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
* align audit severity and explicit update policies ([#133](https://github.com/cravingmaker/eslint-config/issues/133)) ([8273526](https://github.com/cravingmaker/eslint-config/commit/8273526416e19aa001fa73250e217aa1f8c971a1))
* align rule ownership and prevent unsafe autofixes ([#131](https://github.com/cravingmaker/eslint-config/issues/131)) ([ae66847](https://github.com/cravingmaker/eslint-config/commit/ae66847b3ceaa1da85100c1c0c444dc9fbf85a39))
* apply react-refresh overrides only while React Refresh is on ([#89](https://github.com/cravingmaker/eslint-config/issues/89)) ([737db5c](https://github.com/cravingmaker/eslint-config/commit/737db5c960fc33f0f9d8c34a0774d91db36b8474))
* apply the React hooks rules to .js and .ts files ([#70](https://github.com/cravingmaker/eslint-config/issues/70)) ([cf52688](https://github.com/cravingmaker/eslint-config/commit/cf52688e43099a799c3427fbb2a6fd58373de425))
* bring back only the checks that an owner replaces ([#90](https://github.com/cravingmaker/eslint-config/issues/90)) ([cef0f61](https://github.com/cravingmaker/eslint-config/commit/cef0f618464a815a6360c4dbc863a1e5225c35ee))
* check parameter immutability shallowly for stable results ([#64](https://github.com/cravingmaker/eslint-config/issues/64)) ([5bd8ab3](https://github.com/cravingmaker/eslint-config/commit/5bd8ab3330ca348ed7bb5b6f904ed338f356a349))
* converge escape casing and import spacing ([#128](https://github.com/cravingmaker/eslint-config/issues/128)) ([e432539](https://github.com/cravingmaker/eslint-config/commit/e4325397d3ee57c150114d523536da643afcb4f1))
* **deps:** bump typescript-eslint from 8.70.0 to 8.71.2 ([#153](https://github.com/cravingmaker/eslint-config/issues/153)) ([e2cb99a](https://github.com/cravingmaker/eslint-config/commit/e2cb99a5af615f569309de497e3f709e06332063))
* detect frameworks from the dependencies the project declares ([#69](https://github.com/cravingmaker/eslint-config/issues/69)) ([2ee07ee](https://github.com/cravingmaker/eslint-config/commit/2ee07eecd4030a76110b559a7de151a709611da3))
* exempt a replaced rule only where its override applies ([#80](https://github.com/cravingmaker/eslint-config/issues/80)) ([49f73c7](https://github.com/cravingmaker/eslint-config/commit/49f73c7a177da8b1a9031f46f6724aee27ab71a7))
* fail with an install message when an enabled feature's peer is missing ([#68](https://github.com/cravingmaker/eslint-config/issues/68)) ([188419a](https://github.com/cravingmaker/eslint-config/commit/188419a1dc41d8bc36c2a8cb1d876f07892490a8))
* keep json.overrides out of JSONC files ([#81](https://github.com/cravingmaker/eslint-config/issues/81)) ([0e6de0b](https://github.com/cravingmaker/eslint-config/commit/0e6de0ba80dcd3bdcc20fe8a3a8326dd2bc062ca))
* keep n/no-sync off in Svelte rune modules ([#156](https://github.com/cravingmaker/eslint-config/issues/156)) ([3751c0a](https://github.com/cravingmaker/eslint-config/commit/3751c0ab22619b128debb302917ad9bca2091f0c))
* keep overlap and resolver blocks within each feature's files ([#67](https://github.com/cravingmaker/eslint-config/issues/67)) ([cedf4ca](https://github.com/cravingmaker/eslint-config/commit/cedf4ca61cf3e16b6975f10bbefc716372ac587c))
* keep the policy's options for a severity-only override ([#158](https://github.com/cravingmaker/eslint-config/issues/158)) ([1a490ae](https://github.com/cravingmaker/eslint-config/commit/1a490ae791af509e8a9c64bc5f41a43139dadbab))
* keep the type-aware blocks inside the type-aware scope ([#78](https://github.com/cravingmaker/eslint-config/issues/78)) ([2117026](https://github.com/cravingmaker/eslint-config/commit/21170268a0d110e65c58733b98f8ca7dd10520a7))
* lint jsconfig and Dev Container files as JSONC ([#157](https://github.com/cravingmaker/eslint-config/issues/157)) ([0782224](https://github.com/cravingmaker/eslint-config/commit/0782224c45a07c6d835d2656c20eb474aef17ed3))
* lint the scripts of Svelte components with the JavaScript and TypeScript rules ([#73](https://github.com/cravingmaker/eslint-config/issues/73)) ([b227c9a](https://github.com/cravingmaker/eslint-config/commit/b227c9ab9d3d56fccef452e05bdd483794b8bfba))
* preserve HTML tags and correct Markdown/Svelte linting ([#132](https://github.com/cravingmaker/eslint-config/issues/132)) ([d1fb5e3](https://github.com/cravingmaker/eslint-config/commit/d1fb5e3edba78e918fb8e81871ebfc84c0010588))
* publish without source maps and patch Vitest ([#134](https://github.com/cravingmaker/eslint-config/issues/134)) ([e820001](https://github.com/cravingmaker/eslint-config/commit/e82000143424c9fb4a513d30b058ce530492fbcc))
* read type information only in the type-aware scope ([#71](https://github.com/cravingmaker/eslint-config/issues/71)) ([0f2a892](https://github.com/cravingmaker/eslint-config/commit/0f2a892c7e29b2fe50fc6a490e9fd1b6310e993c))
* reject options that createConfig does not know ([#82](https://github.com/cravingmaker/eslint-config/issues/82)) ([374d346](https://github.com/cravingmaker/eslint-config/commit/374d3465e9cbf8f5b62b3deadf7fbb371481ef5b))
* resolve projectRootDirectory and tsconfigRootDir to absolute paths ([#88](https://github.com/cravingmaker/eslint-config/issues/88)) ([e5ccd98](https://github.com/cravingmaker/eslint-config/commit/e5ccd9820f24ca6bfdea331010ce33e00daf9c0f))
* restore Svelte scopes and consolidate source builders ([#141](https://github.com/cravingmaker/eslint-config/issues/141)) ([10405a6](https://github.com/cravingmaker/eslint-config/commit/10405a60a3a9f6be868d72bc25a6af106b4bc5cc))
* support passing configs and conditional peer metadata ([#130](https://github.com/cravingmaker/eslint-config/issues/130)) ([90a360a](https://github.com/cravingmaker/eslint-config/commit/90a360aed94bd2b006b6b21463002cf611b830a4))
* turn off lint rules that duplicate or fight Prettier ([#72](https://github.com/cravingmaker/eslint-config/issues/72)) ([b6de43c](https://github.com/cravingmaker/eslint-config/commit/b6de43ca666ded58239417e40522097b10148e3a))


### Code Refactoring

* compose the config from feature builders with per-feature options ([#62](https://github.com/cravingmaker/eslint-config/issues/62)) ([c655717](https://github.com/cravingmaker/eslint-config/commit/c65571715c78016271e05a8b7e510d20325df442))

## [0.1.0](https://github.com/cravingmaker/eslint-config/compare/v0.0.10...v0.1.0) (2026-10-06)


### Features

* complete config API surface ([#41](https://github.com/cravingmaker/eslint-config/issues/41)) ([f268c33](https://github.com/cravingmaker/eslint-config/commit/f268c332954f9654785a04919dd9455ac9b8c076))
* update dependencies and add support for react-refresh and react-hooks ([edb163a](https://github.com/cravingmaker/eslint-config/commit/edb163ac8bfe971a7142f82a12e0d870ef67534a))
* update nextAllowExportNames to match the plugin config ([71f9aca](https://github.com/cravingmaker/eslint-config/commit/71f9aca99702f498c89c00e193a12bf08de58de6))


### Bug Fixes

* align createConfig option semantics ([#20](https://github.com/cravingmaker/eslint-config/issues/20)) ([ce41e76](https://github.com/cravingmaker/eslint-config/commit/ce41e7685efd09530ba6c627650a9ba749d89ba6))
* harden monorepo and CommonJS support ([#40](https://github.com/cravingmaker/eslint-config/issues/40)) ([151cccf](https://github.com/cravingmaker/eslint-config/commit/151cccf15d09601880c02b856996c5d7c5bf36c5))
* harden parser configuration ([#39](https://github.com/cravingmaker/eslint-config/issues/39)) ([c7a72f3](https://github.com/cravingmaker/eslint-config/commit/c7a72f355aec1be9081983a5e4bac9b188d317de))
