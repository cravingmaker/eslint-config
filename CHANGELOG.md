# Changelog

## [0.2.0](https://github.com/cravingmaker/eslint-config/compare/v0.1.0...v0.2.0) (2026-10-09)


### ⚠ BREAKING CHANGES

* reject options that createConfig does not know ([#82](https://github.com/cravingmaker/eslint-config/issues/82))
* lint the scripts of Svelte components with the JavaScript and TypeScript rules ([#73](https://github.com/cravingmaker/eslint-config/issues/73))
* turn off lint rules that duplicate or fight Prettier ([#72](https://github.com/cravingmaker/eslint-config/issues/72))
* apply the React hooks rules to .js and .ts files ([#70](https://github.com/cravingmaker/eslint-config/issues/70))
* detect frameworks from the dependencies the project declares ([#69](https://github.com/cravingmaker/eslint-config/issues/69))
* fail with an install message when an enabled feature's peer is missing ([#68](https://github.com/cravingmaker/eslint-config/issues/68))
* remove .cjs and .cts support ([#66](https://github.com/cravingmaker/eslint-config/issues/66))
* compose the config from feature builders with per-feature options ([#62](https://github.com/cravingmaker/eslint-config/issues/62))

### Features

* remove .cjs and .cts support ([#66](https://github.com/cravingmaker/eslint-config/issues/66)) ([39e02f6](https://github.com/cravingmaker/eslint-config/commit/39e02f66ac4f731521306633e2269ec479b6fb79))


### Bug Fixes

* add file-role exceptions for test and config files ([#65](https://github.com/cravingmaker/eslint-config/issues/65)) ([e6f89db](https://github.com/cravingmaker/eslint-config/commit/e6f89db58508d40146e5114a7f6b5d4c9143d2d1))
* apply the React hooks rules to .js and .ts files ([#70](https://github.com/cravingmaker/eslint-config/issues/70)) ([cf52688](https://github.com/cravingmaker/eslint-config/commit/cf52688e43099a799c3427fbb2a6fd58373de425))
* check parameter immutability shallowly for stable results ([#64](https://github.com/cravingmaker/eslint-config/issues/64)) ([5bd8ab3](https://github.com/cravingmaker/eslint-config/commit/5bd8ab3330ca348ed7bb5b6f904ed338f356a349))
* detect frameworks from the dependencies the project declares ([#69](https://github.com/cravingmaker/eslint-config/issues/69)) ([2ee07ee](https://github.com/cravingmaker/eslint-config/commit/2ee07eecd4030a76110b559a7de151a709611da3))
* exempt a replaced rule only where its override applies ([#80](https://github.com/cravingmaker/eslint-config/issues/80)) ([49f73c7](https://github.com/cravingmaker/eslint-config/commit/49f73c7a177da8b1a9031f46f6724aee27ab71a7))
* fail with an install message when an enabled feature's peer is missing ([#68](https://github.com/cravingmaker/eslint-config/issues/68)) ([188419a](https://github.com/cravingmaker/eslint-config/commit/188419a1dc41d8bc36c2a8cb1d876f07892490a8))
* keep json.overrides out of JSONC files ([#81](https://github.com/cravingmaker/eslint-config/issues/81)) ([0e6de0b](https://github.com/cravingmaker/eslint-config/commit/0e6de0ba80dcd3bdcc20fe8a3a8326dd2bc062ca))
* keep overlap and resolver blocks within each feature's files ([#67](https://github.com/cravingmaker/eslint-config/issues/67)) ([cedf4ca](https://github.com/cravingmaker/eslint-config/commit/cedf4ca61cf3e16b6975f10bbefc716372ac587c))
* keep the type-aware blocks inside the type-aware scope ([#78](https://github.com/cravingmaker/eslint-config/issues/78)) ([2117026](https://github.com/cravingmaker/eslint-config/commit/21170268a0d110e65c58733b98f8ca7dd10520a7))
* lint the scripts of Svelte components with the JavaScript and TypeScript rules ([#73](https://github.com/cravingmaker/eslint-config/issues/73)) ([b227c9a](https://github.com/cravingmaker/eslint-config/commit/b227c9ab9d3d56fccef452e05bdd483794b8bfba))
* read type information only in the type-aware scope ([#71](https://github.com/cravingmaker/eslint-config/issues/71)) ([0f2a892](https://github.com/cravingmaker/eslint-config/commit/0f2a892c7e29b2fe50fc6a490e9fd1b6310e993c))
* reject options that createConfig does not know ([#82](https://github.com/cravingmaker/eslint-config/issues/82)) ([374d346](https://github.com/cravingmaker/eslint-config/commit/374d3465e9cbf8f5b62b3deadf7fbb371481ef5b))
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
