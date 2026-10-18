# Dependency compatibility review

Reviewed on 18 October 2026 against `main` at `d07b0366e7ceeae2d447b196bc50e9672423e038`.

This document tracks the remaining deferred candidates from the original `npx --yes npm-check-updates` review and the unresolved consumer audit findings. The review applied `.npmrc`'s seven-day minimum release age.

## Deferred candidates

| Dependency                                                                                       | Baseline → reviewed candidate | Installed version | Status       | Finding                                                                                                |
| ------------------------------------------------------------------------------------------------ | ----------------------------- | ----------------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/releases/tag/v8.71.1) | 8.70.0 → 8.71.1               | `8.70.0`          | Keep current | Reproduced false unused-variable reports and 20 fixture/formatting failures. Keep 8.70.0 for now.      |
| [typescript](https://registry.npmjs.org/typescript-eslint/8.71.1)                                | 6.0.3 → 7.0.2                 | `6.0.3`           | Keep current | Peer resolution fails: typescript-eslint@8.71.1 supports TypeScript >=4.8.4 <6.1.0.                    |
| [@types/node](https://www.npmjs.com/package/@types/node/v/26.6.5)                                | 24.19.0 → 26.6.5              | `24.19.0`         | Keep current | Typecheck passes, but 26.x types allow APIs beyond the Node 24 minimum. Prefer 24.19.2; it typechecks. |

## Compatibility findings

TypeScript ESLint 8.71.1 caused 20 fixture/formatting test failures through false `unused-imports/no-unused-vars` reports on runtime-used variables. Reverting only `typescript-eslint` to 8.70.0 made all 235 tests in those two files pass. It also introduces `@typescript-eslint/no-unsafe-enum-assignment`, which needs an explicit policy entry before a future upgrade.

TypeScript 7.0.2 failed a strict peer-resolution install with `ERESOLVE`, because `typescript-eslint@8.71.1` requires TypeScript `>=4.8.4 <6.1.0`. Keep TypeScript 6.0.3 until the lint stack supports TypeScript 7.

`@types/node@26.6.5` typechecked after a fresh build, but its API declarations target a newer major than this package's Node 24 minimum. `npx npm-check-updates --filter @types/node --target minor` instead proposes 24.19.2; that version passed typechecking on Node 24.15.0. This alternative was checked separately from the major-version candidate.

## Consumer audit findings

An independently installed minimum-peer tarball audited on 18 October 2026 on Node 24.15.0 reports seven vulnerable package entries: three high, one moderate, and three low, including propagated parent-package entries. Its graph resolves `deepmerge-ts@7.1.6` through `eslint-plugin-functional@10.0.1`, `katex@0.16.47` through `@eslint/markdown@8.0.3` / `micromark-extension-math@3.1.0`, and the deliberately installed Svelte 5.0.0 minimum. The [DeepmergeTS advisory](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) is patched in 8.0.0 and the [KaTeX advisory](https://github.com/advisories/GHSA-238p-pmpm-9mq7) in 0.18.2.

The repository forces DeepmergeTS 8.0.2 and KaTeX 0.18.2. [npm only applies overrides from the consuming project's root package](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides), so consumers do not inherit these repository overrides. Contributor audit success therefore does not establish a clean consumer audit. These findings remain open and require a separate dependency review.

## Release cooldown

The original review excluded TypeScript ESLint 8.71.2 under the seven-day minimum release age.

## Verification scope

The findings above record the versions and compatibility checks available at review time. Rerun `npx npm-check-updates` and the compatibility checks before adopting any deferred version.
