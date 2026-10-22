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

## Vitest security patch for Stage 8 CI

Reviewed on 22 October 2026 against PR #134 at
`fe5fa5243c9c70fc2a5533750492448a57bbd0ae`.

| Dependency   | Baseline → reviewed candidate | Installed version | Status  |
| ------------ | ----------------------------- | ----------------- | ------- |
| `vitest`     | 5.0.3 → 5.0.5                 | `5.0.5`           | Applied |
| `@vitest/ui` | 5.0.3 → 5.0.5                 | `5.0.5`           | Applied |

Both Node CI jobs stopped at `npm audit --audit-level=low`, before validation,
for [GHSA-p458-7748-mcp3](https://github.com/advisories/GHSA-p458-7748-mcp3).
The advisory identifies 5.0.5 as patched and requires updating Vitest together
with its UI's exact peer. The [5.0.5 release](https://github.com/vitest-dev/vitest/releases/tag/v5.0.5)
fixes the dev server's file-deny handling; the intervening
[5.0.4 release](https://github.com/vitest-dev/vitest/releases/tag/v5.0.4)
also changes watcher/module caching and assertion behavior, so compatibility is
checked through the existing watcher and full test suites.

The patch supports the project's Node 24.15.0 minimum and Node 26, retains
support for the locked Vite 8.3.4, and preserves the exact Vitest/UI peer pairing.
The four internal Vitest dependencies (`mocker`, `pretty-format`, `spy`, and
`utils`) move to 5.0.5 with them. Vitest's `obug` dependency moves from 2.2.1
to 3.0.0; existing build-tool copies of 3.0.0 are deduplicated. No other package
version, runtime dependency, peer range, linter rule, or snapshot is changed.

The patch was published on 15 October 2026 at 14:29 UTC (UI at 14:27 UTC),
and was still inside the seven-day cooldown when this fix was reviewed.
An ordinary candidate install reproduced `ETARGET` from the date cutoff.
This security remediation uses a one-time command-line
`min-release-age-exclude` for exactly `vitest`, `@vitest/ui`, `@vitest/mocker`,
`@vitest/pretty-format`, `@vitest/spy`, and `@vitest/utils` while selecting the
reviewed 5.0.5 pins. The project keeps `min-release-age=7` without persistent
exclusions. Fresh `npm ci --ignore-scripts` installations of the resulting
lockfile passed under Node 24.15.0/npm 11.12.1 and Node 26.12.0/npm 11.20.0
with zero audit findings and no cooldown override.

The original `release:check` audit failure was reproduced locally. The update
passes `npm run release:check` on Node 24.22.0: zero audit findings, 71 files /
2,715 tests, Publint, ATTW, and dry-run packing. Watcher and package-contract
regressions pass 8 tests on each of Node 24.15.0 and 26.12.0. An authenticated
UI probe serves the UI and denies synthetic `.env` and token files with HTTP 403. All 33 effective-policy snapshots are unchanged, and runtime/declaration
bundles match the prior build byte for byte. Detailed evidence is recorded
in the Stage 8 CI follow-up in
[the audit implementation guide](AUDIT_RESULT_FOLLOW_UP_IMPLEMENTATION.md).
The audit threshold, CI workflow, and git hooks remain unchanged.

## Consumer audit findings

An independently installed minimum-peer tarball audited on 18 October 2026 on Node 24.15.0 reports seven vulnerable package entries: three high, one moderate, and three low, including propagated parent-package entries. Its graph resolves `deepmerge-ts@7.1.6` through `eslint-plugin-functional@10.0.1`, `katex@0.16.47` through `@eslint/markdown@8.0.3` / `micromark-extension-math@3.1.0`, and the deliberately installed Svelte 5.0.0 minimum. The [DeepmergeTS advisory](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) is patched in 8.0.0 and the [KaTeX advisory](https://github.com/advisories/GHSA-238p-pmpm-9mq7) in 0.18.2.

The repository forces DeepmergeTS 8.0.2 and KaTeX 0.18.2. [npm only applies overrides from the consuming project's root package](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides), so consumers do not inherit these repository overrides. Contributor audit success therefore does not establish a clean consumer audit. These findings remain open and require a separate dependency review.

## Release cooldown

The original review excluded TypeScript ESLint 8.71.2 under the seven-day minimum release age.

## Verification scope

The findings above record the versions and compatibility checks available at review time. Rerun `npx npm-check-updates` and the compatibility checks before adopting any deferred version.
