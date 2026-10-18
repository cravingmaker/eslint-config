# Dependency compatibility review

Reviewed on 18 October 2026 against `main` at `d07b0366e7ceeae2d447b196bc50e9672423e038`.

Ran `npx --yes npm-check-updates` in the original checkout without `-u`. It found 16 updates after applying `.npmrc`'s seven-day minimum release age.

## Applied updates

Applied the nine approved updates on 18 October 2026. Each row marked **Updated** records its previous version, reviewed candidate, and installed version. The installed versions were checked against `package.json`, `package-lock.json`, and `node_modules` after `npm ci --ignore-scripts`.

This batch updates three runtime dependencies and six development dependencies. The other seven reviewed candidates remain unapplied. The Node 24 type patch alternative also remains outside this approved batch.

## Review results

| Dependency                                                                                                                      | Baseline → reviewed candidate | Installed version | Status        | Finding                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| [@eslint/json](https://github.com/eslint/json/releases/tag/json-v2.1.1)                                                         | 2.1.0 → 2.1.1                 | `2.1.1`           | Updated       | JSON parser and autofix fixes; rule inventory unchanged.                                               |
| [prettier](https://github.com/prettier/prettier/releases/tag/3.9.10)                                                            | 3.9.9 → 3.9.10                | `3.9.10`          | Updated       | Fixes Markdown table parsing performance; formatting check passed.                                     |
| [svelte](https://github.com/sveltejs/svelte/releases/tag/svelte%405.57.2)                                                       | 5.57.1 → 5.57.2               | `5.57.2`          | Updated       | Compiler/runtime fixes; Svelte integration checks compatible.                                          |
| [eslint](https://github.com/eslint/eslint/releases/tag/v10.12.0)                                                                | 10.11.0 → 10.12.0             | `10.12.0`         | Updated       | Core fixes and API additions; remains inside the published peer range.                                 |
| [eslint-plugin-n](https://github.com/eslint-community/eslint-plugin-n/releases/tag/v18.4.1)                                     | 18.3.0 → 18.4.1               | `18.4.1`          | Updated       | Resolver and Node rule fixes; no added or removed rules.                                               |
| [globals](https://github.com/sindresorhus/globals/releases/tag/v17.13.0)                                                        | 17.12.0 → 17.13.0             | `17.13.0`         | Updated       | Adds three browser speech-recognition globals; Node globals unchanged.                                 |
| [svelte-eslint-parser](https://github.com/sveltejs/svelte-eslint-parser/releases/tag/v1.9.0)                                    | 1.8.1 → 1.9.0                 | `1.9.0`           | Updated       | Improves JSDoc and template narrowing; published peer range still fits.                                |
| [@cravingmaker/prettier-config](https://github.com/cravingmaker/prettier-config/releases/tag/v0.3.2)                            | 0.3.1 → 0.3.2                 | `0.3.2`           | Updated       | Dependency maintenance; formatter options and peer requirements unchanged.                             |
| [tsdown](https://github.com/rolldown/tsdown/releases/tag/v0.23.1)                                                               | 0.23.0 → 0.23.1               | `0.23.1`          | Updated       | Build fixes; compatible with the Node and TypeScript versions in this repo.                            |
| [eslint-plugin-security](https://github.com/eslint-community/eslint-plugin-security/releases/tag/eslint-plugin-security-v4.1.0) | 4.0.1 → 4.2.0                 | `4.0.1`           | Needs changes | Classify security/detect-invisible-characters. Coverage fails until it has an explicit policy.         |
| [vitest](https://vitest.dev/guide/migration/)                                                                                   | 4.1.11 → 5.0.3                | `4.1.11`          | Needs changes | Migrate createVitest("test", …) in the watcher test; its deprecation fails zero-warning lint.          |
| [@vitest/ui](https://github.com/vitest-dev/vitest/releases/tag/v5.0.3)                                                          | 4.1.11 → 5.0.3                | `4.1.11`          | Needs changes | Upgrade together with Vitest: it requires exactly vitest@5.0.3.                                        |
| [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn/releases/tag/v77.0.0)                             | 74.0.0 → 77.0.0               | `74.0.0`          | Needs changes | Current JS config throws on require-frontmatter-fields. Also needs new-rule and option review.         |
| [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/releases/tag/v8.71.1)                                | 8.70.0 → 8.71.1               | `8.70.0`          | Keep current  | Reproduced false unused-variable reports and 20 fixture/formatting failures. Keep 8.70.0 for now.      |
| [typescript](https://registry.npmjs.org/typescript-eslint/8.71.1)                                                               | 6.0.3 → 7.0.2                 | `6.0.3`           | Keep current  | Peer resolution fails: typescript-eslint@8.71.1 supports TypeScript >=4.8.4 <6.1.0.                    |
| [@types/node](https://www.npmjs.com/package/@types/node/v/26.6.5)                                                               | 24.19.0 → 26.6.5              | `24.19.0`         | Keep current  | Typecheck passes, but 26.x types allow APIs beyond the Node 24 minimum. Prefer 24.19.2; it typechecks. |

## Validation

The nine recommended updates passed `npm run validate` on the exact supported minimum, Node 24.15.0: formatting, build, TypeScript checking, zero-warning ESLint, all 1,522 tests in 59 files, Publint, and Are the Types Wrong. No snapshots or source files were changed to make these checks pass.

A separately installed tarball also passed `npm ls --all` and the CI minimum-peer integration checks on Node 24.15.0, with ESLint 10.4.0 and all advertised minimum optional peer versions.

After applying this batch in the contributor checkout, `npm run validate` also passed on Node 24.22.0, including all 1,522 tests in 59 files. `npm audit --audit-level=low` reported zero vulnerabilities. The review document passed the repository formatting and Markdown lint checks.

## Deferred updates

TypeScript ESLint 8.71.1 caused 20 fixture/formatting test failures through false `unused-imports/no-unused-vars` reports on runtime-used variables. Reverting only `typescript-eslint` to 8.70.0 made all 235 tests in those two files pass. It also introduces `@typescript-eslint/no-unsafe-enum-assignment`, which needs an explicit policy entry before a future upgrade.

Unicorn 77.0.0 built and typechecked, but 30 of 50 focused policy and Unicorn tests failed. The main runtime error is that the existing `unicorn/require-frontmatter-fields` entry no longer supports `js/js`. The remaining checks also require review of new rules, deprecated rules, and newly available options. This is a migration, not a version-only update.

Vitest 5.0.3 and its UI installed, built, and typechecked. The watcher test's existing `createVitest("test", ...)` overload is deprecated in v5, so `@typescript-eslint/no-deprecated` makes the zero-warning lint check fail. Update the invocation to the new signature and keep both Vitest packages on exactly the same version.

Security 4.2.0 adds bundled TypeScript declarations; the intervening 4.1.0 release adds `security/detect-invisible-characters`. The latter must be explicitly classified in this repository's rule policy. The current coverage guard correctly rejects the unclassified rule.

TypeScript 7.0.2 failed a strict peer-resolution install with `ERESOLVE`, because `typescript-eslint@8.71.1` requires TypeScript `>=4.8.4 <6.1.0`. Keep TypeScript 6.0.3 until the lint stack supports TypeScript 7.

`@types/node@26.6.5` typechecked after a fresh build, but its API declarations target a newer major than this package's Node 24 minimum. `npx npm-check-updates --filter @types/node --target minor` instead proposes 24.19.2; that version passed typechecking on Node 24.15.0. This alternative was checked separately from the nine-update batch.

## Release cooldown

Cooldown-excluded releases: ESLint 10.13.0, TypeScript ESLint 8.71.2, Unicorn 78.0.0, and Vitest / @vitest/ui 5.0.5.

## Verification scope

The dependency review ran in temporary copies. The complete nine-update suite and advertised minimum-peer integrations passed locally on Node 24.15.0. The baseline also passed its checks on Node 26.12.0. Linux and the upgraded dependency set on Node 26 were not tested during the review; the pull request CI covers those environments.

The findings above record the versions available at review time. Rerun `npx npm-check-updates` and the compatibility checks before adopting any deferred version.
