# Audit result

An audit of `@cravingmaker/eslint-config` against [the coding principles](CODING_PRINCIPLES.md), at commit `e9a9192`, which was `origin/main` on 20 October 2026. It covers two things:

1. **The policy that consumer projects get:** what `createConfig()` reports and fixes in a project that uses it.
2. **This repository:** its own code, files, folders, scripts, and documents.

Every finding names the principles that it touches by their number in the priority order: 1 deterministic and consistent, 2 readable and maintainable, 3 secure, 4 performant, 5 non-obsolete, 6 non-deprecated, 7 non-redundant, 8 modern, 9 elegant and concise. A finding marked **Decision** needs a choice by the maintainer; the [decisions](#decisions-for-the-maintainer) table lists them with a recommendation. Each finding was checked against the build or the files of `e9a9192`, with Node.js 24.22.0; [Method](#method) describes how.

The audit changed no file but this one.

## Summary

| Area                             | Findings                                               | Highest principle at stake |
| -------------------------------- | ------------------------------------------------------ | -------------------------- |
| `eslint --fix` does not converge | 3 rule interactions, in 23% of sampled files           | 1                          |
| Rules with no passing form       | 4                                                      | 1                          |
| Two rules report one problem     | 12 rule pairs                                          | 7, and 1 by the README     |
| Reports that are wrong           | 3 rules                                                | 1, 2                       |
| Open known issues                | 3 that change code or stop runs, each with a small fix | 1, 3                       |
| Inconsistent conventions         | Severities, deprecated rules, generated output         | 1, 6                       |
| Rules that cannot report         | 36 SonarJS rules, about 15% of the rule time           | 4                          |
| This repository                  | Duplicated logic, dead entries, scripts, drift         | 1, 2, 7                    |

Act on these first:

1. **Make `eslint --fix` converge** ([P1](#p1-eslint---fix-does-not-converge)). In 34 of 150 ES modules taken from the installed packages, ESLint stops with "Circular fixes detected". Three option changes end all of them.
2. **Give every rule a passing form** ([P2](#p2-rules-with-no-passing-form)). The README's own three-line `eslint.config.js` fails the config, and so does every `package.json` without peer dependencies.
3. **Give each check one owner** ([P3](#p3-two-rules-report-one-problem)). The README promises a fixed owner for every overlap, but twelve pairs report the same code twice.
4. **Resolve the known issues that change or stop code** ([P5](#p5-open-issues-that-break-code-or-runs)) instead of documenting them.
5. **Add a test that fixes code with many problems at once** ([Guard](#a-guard-against-regressions)). The current tests fix only the fixtures, which pass the policy, and samples of one rule, so none of the above can fail a test.

## What already follows the principles

These are strengths to keep, not findings:

- **Explicit policy.** Every non-deprecated rule has a setting in one owning rule map, and the effective-policy snapshots make any change visible (1, 2).
- **One owner per feature.** Rule IDs map to features through one table in `CONTRIBUTING.md`, and file-role exceptions live in one module (1, 2).
- **Tooling for evidence.** `npm run policy:diff` and the snapshot tests let a refactor prove that it changes nothing (1).
- **Strict input checking.** Unknown options are rejected with a message that names the valid ones (1, 3).
- **Supply chain.** Exact versions, a seven-day release age, pinned GitHub Actions, and trusted publishing (3).
- **Modern platform.** ESM only, Node.js 24, flat config, and erasable TypeScript: `tsc --noEmit --erasableSyntaxOnly` passes as it is (5, 8).

## Part 1: the policy that consumer projects get

### P1: `eslint --fix` does not converge

**Principles:** 1. **Decision:** D1, D2, D3.

The audit linted 150 ES modules taken from the installed packages with `fix: true` and every feature but the frameworks (see [Method](#method)). Most of them are bundled code rather than hand-written sources, so the share matters less than the causes, and a small hand-written file reproduces each cause. ESLint reported "Circular fixes detected … It is likely that you have conflicting rules in your configuration" for 34 files. A pass-by-pass replay attributes the loops to three causes:

| Cause                                                                                                                                                                                                                                                                                    | Files | Minimal reproduction                                                                                             | Option change that ends it                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `perfectionist/sort-modules` counts an empty line inside a doc comment as spacing between two members and reports "Extra spacing", with a fix that changes nothing. `unicorn/no-asterisk-prefix-in-documentation-comments` turns every paragraph break of a doc comment into such a line | 28    | A doc comment with a paragraph break above a function that follows another function                              | `perfectionist/sort-modules` with `newlinesBetween: "ignore"`: no loop in any of the 150 files. Turning the asterisk rule off instead leaves 1 of the 28, a comment that never had asterisks |
| `perfectionist/sort-imports` (`newlinesInside: 0`, `partitionByComment: false`) removes the blank line between imports, and `import-x/newline-after-import` (`considerComments: true`) adds it back before a comment                                                                     | 4     | Two imports out of order, each below a section comment, such as `// First section.`                              | `considerComments: false`, the upstream default: no loop in the 5 files                                                                                                                      |
| `unicorn/escape-case` (`"uppercase"`) and `regexp/letter-case` (`hexadecimalEscape` and `unicodeEscape` `"lowercase"`) want opposite cases for the same escape in a regular expression                                                                                                   | 3     | `/\u{e9}/u` is reported by `unicorn/escape-case`, and `/\u{E9}/u` by `regexp/letter-case`; `--fix` swaps the two | `regexp/letter-case` with `hexadecimalEscape: "uppercase"` and `unicodeEscape: "uppercase"`, as strings already are: no loop and no report left                                              |

With the three changes together, no file loops, and every file reaches a state that `--fix` no longer changes. Nine of them need two to four runs, because ESLint stops after ten fix passes per run and these bundles start far from the policy; none of them repeats a state.

The first cause is the known issue "A paragraph break in a doc comment between functions" in the README, which asks users not to write paragraph breaks in doc comments. The sample shows how common it is: 19% of the files. The bug is in `perfectionist/sort-modules`, and 5.12.1, the installed version, is the latest release; reporting it upstream is worth doing in any case. Until it is fixed, each way out costs one owner: `newlinesBetween: "ignore"` stops checking blank lines between module members, which `@stylistic/padding-line-between-statements` leaves to `sort-modules`; turning the asterisk rule off leaves doc comments without a style owner, because `@stylistic/multiline-comment-style` leaves stars to that rule. Both keep principle 1 for fixes and give it up for one layout choice, so D3 asks which layout matters more.

The other two causes are plain contradictions between two explicit settings of this package, and each has an option change that keeps the intent of both rules.

### P2: rules with no passing form

**Principles:** 1, 2. **Decision:** D4, D5, D6, D7.

Each of these reports every form that the code can take, so a consumer can only pass with a disable comment or an override:

- **The README's `eslint.config.js` fails.** The three lines under "Usage" report `unicorn/no-top-level-side-effects` on `export default createConfig();`. The same holds for any tool config written as `export default defineConfig(...)`, such as `vite.config.ts` or `vitest.config.ts`. This repository turns the rule off for its own tool configs in a user config named `repository/tool-configuration` (`eslint.config.js:25-30`), but the published `config-files` role turns off only `import-x/no-default-export` (`src/configs/exceptions/rules.ts:33-36`). The repository's own config is the evidence that the decisions require for a new exception. `tests/package/readme.test.ts` lints the fixtures with each example, but not the example itself.
- **A `package.json` without peer dependencies cannot pass.** Without `peerDependenciesMeta`, `package-json/require-peerDependenciesMeta` reports it; with an empty one, `package-json/no-empty-fields` does. `package-json/require-peerDependencies` is off as "Prefer to be optional", so the map asks for the metadata of a field that it lets the package leave out. This is in the record's open questions; it affects every application and every library without peers.
- **A callback that calls a named function.** `values.map((value) => double(value))` is reported by `functional/prefer-tacit`, and `values.map(double)` by `unicorn/no-array-callback-reference`. The repository disables the first in `src/utilities/plugin-policy.ts:32`. `unicorn/no-array-callback-reference` guards against a real hazard, a callback that receives the index and the array as extra arguments, so principle 3 outranks the concision (9) of `functional/prefer-tacit`.
- **A React component with typed linting.** In a `.tsx` file, `const Greeting = ({ name }: GreetingProperties) => { return <p>Hello, {name}</p>; };` is reported by `@typescript-eslint/naming-convention`, which allows only camelCase and UPPER_CASE variables. The record lists this; since typed linting became the default on 19 October 2026, every React project with TypeScript meets it without setting an option. The README's workaround, `ignoresTypeAware` for React files, gives up every type-aware check in them (3). A `naming-convention` entry for `.tsx` files that also allows PascalCase for functions and function-valued variables would follow the convention of the React feature that the config itself turns on.

### P3: two rules report one problem

**Principles:** 7, and 1 because the README promises one owner. **Decision:** D8.

"Rules that replace other rules" in the README says: "Each overlapping check has a fixed owner." These pairs report the same code at the same place, each from its own rule map, and no map names the other rule as the owner:

| Code                                                | Rules that report it                                                                                                                      | Where                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `value == null`                                     | `eqeqeq` (`null: "always"`), `no-eq-null`                                                                                                 | Every source           |
| `eval(input)`                                       | `no-eval`, `security/detect-eval-with-expression`                                                                                         | Every source           |
| `kind > 0 ? (kind > 1 ? "big" : "small") : "small"` | `no-nested-ternary`, `unicorn/no-unnecessary-nested-ternary`                                                                              | Every source           |
| `/\x1f/u`                                           | `no-control-regex`, `regexp/no-control-character`                                                                                         | Every source           |
| `/\a/`                                              | `no-useless-escape`, `regexp/no-useless-escape`                                                                                           | Every source           |
| `/(a+)+$/u`                                         | `regexp/no-super-linear-backtracking`, `security/detect-unsafe-regex`, and `regexp/no-super-linear-move`                                  | Every source           |
| `new Buffer(10)`                                    | `no-restricted-globals` ("Use Uint8Array instead."), `unicorn/no-new-buffer` (suggests `Buffer.alloc`, which the first rule then reports) | Every source           |
| `load().then((value) => { … })` inside a function   | `promise/prefer-await-to-then`, `unicorn/prefer-await`                                                                                    | Every source           |
| `[...numbers].sort()`                               | `@typescript-eslint/require-array-sort-compare`, `unicorn/require-array-sort-compare`                                                     | Typed TypeScript files |
| `input.match(/ab/u)`                                | `@typescript-eslint/prefer-regexp-exec`, `regexp/prefer-regexp-exec`                                                                      | Typed TypeScript files |
| `/\p{L}/`                                           | `require-unicode-regexp`, `sonarjs/unicode-aware-regex`                                                                                   | Typed TypeScript files |
| A `switch` over a `number` without `default`        | `default-case`, `@typescript-eslint/switch-exhaustiveness-check` (`requireDefaultForNonUnion: true`)                                      | Typed TypeScript files |

In the corpus, `promise/prefer-await-to-then` reported nothing that `unicorn/prefer-await` did not also report (45 of 45). `tests/policy/overlaps.test.ts` checks the overlaps that the maps declare, so it cannot find one that they do not. A recommendation for each owner is under [D8](#decisions-for-the-maintainer).

### P4: reports that are wrong

**Principles:** 1, 2. **Decision:** D9, D10.

- **`@typescript-eslint/promise-function-async` with `allowAny: false`** (`src/configs/plugins/typescript/rules-type-aware.ts:223-233`). Checked non-async functions whose return type is `unknown` or `any` are reported with "Functions that return promises must be async.", including synchronous boundaries such as `const parse = (raw: string): unknown => { return JSON.parse(raw); };`. The original audit also observed reports on components in a React project without `@types/react`. The repository has a targeted suppression in `src/utilities/plugin-policy.ts` for opaque synchronous rule-option values. The upstream default, `allowAny: true`, avoids inferring a Promise contract from these opaque types while retaining reports on recognized Promise return types. It can also miss a real Promise hidden behind an `any` or `unknown` return annotation. `@typescript-eslint/no-unsafe-return` checks unsafe returns independently and intentionally permits an `any` value returned through an explicit `unknown` boundary; it does not fully replace the additional uncertainty-based reports. See D9's focused verification below.
- **`security/detect-non-literal-fs-filename` and `security/detect-object-injection`.** These are heuristic review signals, not proof of unsafe input. The pinned Security 4.2.0 filesystem rule accepts recognized static expressions, including unchanged literal-valued variables and static `path.join` calls; it still reports reviewed temporary-directory paths and some module-relative URL constructions. The object rule reports computed member access whose key node is an identifier; it does not report every non-literal key expression. A refreshed source-only count, excluding snapshots, found 28 unique suppression comments: 25 name the filesystem rule and 4 the object rule, with one comment naming both. Eighteen unique comments disable rules for whole files, all under `tests/`. Seventeen whole-file comments name the filesystem rule, but only sixteen files match the current `*.test.*`/`*.spec.*` test role; `tests/package/consumers.ts` is a helper outside that role. The repeated fixture suppressions support considering a role exception, but they do not establish that every filesystem path in every consumer's test file is trusted. See D10.1 for the verified coverage trade-off; object-injection policy is a separate D10.2 question.

### P5: open issues that break code or runs

**Principles:** 1, 3. **Decision:** D11.

The README lists these as known issues and the record as open questions. Each one either changes what code does or stops ESLint, and each has a small fix in this package, so documenting them works against principles 1 and 3:

- **Custom elements become self-closing.** `@html-eslint/require-closing-tags` with `selfClosingCustomPatterns: ["-"]` fixes `<my-element></my-element>` to `<my-element />`, which a browser reads as a start tag, so the content that follows can move inside the element. The fix changes the page. `selfClosingCustomPatterns: []` keeps valid explicit end tags and reports an already self-closing custom element, but the pinned rule does not automatically repair that invalid form. Prettier keeps either form. D11.1 verifies the fix, resulting HTML tree, and formatter interaction.
- **A bracketed URL stops the run.** `[https://example.com]` in a Markdown file makes five rules of `@eslint/markdown` 8.0.3 throw, interrupting the lint run. Focused D11.2 verification reproduced both `getLoc()` and `getRange()` exceptions and confirmed that turning off those five rules preserves the other fourteen active Markdown rules on the tested inputs. This workaround loses unique diagnostics and fixes from the disabled rules; re-enable them only after verifying an upstream fix with the consumer dependency combination.
- **`.svelte.mjs` and `.svelte.mts` use the wrong parser mode.** `svelteFiles` matches them, but svelte-eslint-parser 1.9.0 recognizes only `.svelte.js` and `.svelte.ts` as rune modules and reads other filenames as components. Module code can produce parsing errors or be accepted as component text while JavaScript checks are missed. D11.3 verifies that removing only the two extra suffixes from `svelteFiles` restores ordinary JavaScript/TypeScript parsing and representative diagnostics; it does not add rune-module support for those suffixes.

### P6: severities follow no single rule

**Principles:** 1. **Decision:** D12.

The README says of SonarJS: "Checks that need human review, such as complexity thresholds and suspected hardcoded secrets, warn." The original audit highlighted `complexity` and `@typescript-eslint/max-params` as errors among warning-level limits. D12's refreshed inventory also identifies the JavaScript `max-params` owner, `unicorn/max-nested-calls`, and `@html-eslint/max-element-depth` as error-level quantitative readability limits. Five active owner entries are errors and seven are warnings in the twelve-entry size/complexity/nesting family listed in D12. Equivalent review metrics should have a documented severity convention in `CONTRIBUTING.md`, preserving their existing numeric limits, options, scopes, and replacement ownership. This is not a request to infer severity from the presence of a numeric option in every rule.

### P7: deprecated rules and options

**Principles:** 6, 1. **Decision:** D13.

`CONTRIBUTING.md` gives two conventions. "Update a plugin" says "Remove a rule that becomes deprecated from its map", while the Stylistic and SonarJS paragraphs keep deprecated rules as `"off"`. The maps follow both:

| Rule maps                                                  | Deprecated rules listed | Deprecated rules left out |
| ---------------------------------------------------------- | ----------------------- | ------------------------- |
| SonarJS                                                    | 13                      | 0                         |
| Stylistic                                                  | 3                       | 0                         |
| ESLint core                                                | 1, `no-return-await`    | 92                        |
| Unicorn, typescript-eslint, express-security, and 6 others | 0                       | 39                        |

An `"off"` entry for a rule that upstream later removes passes without a message, as `CONTRIBUTING.md` notes, so listed deprecated rules can go stale unnoticed. `src/configs/plugins/typescript/replacements.ts:74` also sets the deprecated option `maximum` of `@typescript-eslint/max-params` (to `undefined`), which the core map does not do for the same option and which `tests/policy/rule-options.test.ts` does not require when `max` is set.

D13.1 additionally verifies that omission and explicit `off` are not equivalent when a preceding consumer config enables the deprecated rule: removing `no-return-await: "off"` lets that earlier rule conflict with the chosen TypeScript await convention. The maintainer chose to omit all deprecated rule entries, including `off`, accepting that inheritance effect. The current deprecated-rule test rejects only enabled plugin entries; it skips disabled entries and has no core-rule or deprecated-option check. Extend authored-policy guards to reject deprecated core/plugin rule keys at every severity, before compatibility filtering. D13.2 confirms removing the redundant `maximum: undefined` alias separately, preserving supported extension options and the intentional annotation-spacing compatibility guard.

### P8: generated framework output is linted

**Principles:** 4, 1. **Decision:** D14.

The global ignores are `**/dist/`, `**/build/`, and `**/coverage/` (`src/configs/ignores/index.ts:9`). The config detects React, Next.js, Vite, and Svelte, but `eslint .` lints `.next/` and `.svelte-kit/`: `isPathIgnored` is `false` for `.next/server/page.js` and `.svelte-kit/generated/root.js`. Results then depend on whether a build ran (1), and a run lints generated bundles (4). The previous audit listed this under "Not planned".

### P9: rules that run where they cannot report

**Principles:** 4. **Decision:** D16, D17.

Linting this repository, 169 typed source files, took 10.0 seconds of rule time in one run with `TIMING=all`. SonarJS took 2.2 seconds of it, and two groups of its rules cannot report anything in most of the files where they run:

- **18 AWS CDK rules,** such as `sonarjs/aws-s3-bucket-insecure-http`, are errors in every source and took 0.77 seconds (7.7%) in a repository that does not use AWS CDK. They report only code that builds AWS CDK resources.
- **18 test rules,** such as `sonarjs/assertions-in-tests`, `no-skipped-tests`, and `no-duplicate-test-title`, run in every source and took 0.72 seconds (7.2%). They report only test code, and the test-files role already names those files.

Turning the AWS rules on only when the manifest declares `aws-cdk-lib`, as the frameworks are detected, and scoping the test rules to the test files would save about 15% of the rule time in a project like this one, and more in a project with fewer tests.

**D16 evidence refinement:** The percentages above describe the original measured workload, not a refreshed performance benchmark or a guarantee that dependency gating preserves reports. D16 reproduces an AWS security report in a workspace package even though the root manifest does not declare `aws-cdk-lib`; the current dependency reader also excludes `optionalDependencies`. A root-manifest gate suppresses that report. D16 therefore recommends retaining the AWS checks independently of root dependency detection, prioritizing the demonstrated security boundary over that proposed optimization. D17 still requires its own scope decision and evidence.

**D17 evidence refinement:** The current `test-files` role matches only `**/*.{test,spec}.*` within supported source extensions. It does not cover every test location supported by the runners. D17 reproduces lost exclusive-test and typed missing-assertion reports in `__tests__/` and `test/` when applying the proposed role restriction. Its refreshed, explicitly listed inventory contains twenty active test-named entries; the original timing paragraph did not list its eighteen individual IDs, so those older timing totals are not treated as a measurement of the refreshed group. D17 recommends preserving current rule scopes instead of inferring that non-role files cannot contain tests.

### P10: the tsconfig that the README asks for

**Principles:** 1, 3. A question, not a finding.

The README asks for `strict`, `noImplicitReturns`, and `allowUnreachableCode: false`, and turns off the rules whose checks those options make. The same reasoning could motivate reviewing more compiler options: `noFallthroughCasesInSwitch` overlaps `no-fallthrough`, and `verbatimModuleSyntax` overlaps `@typescript-eslint/consistent-type-imports`. Independently, `noUncheckedIndexedAccess` adds possible `undefined` to unchecked indexed reads; it does not validate a key's trustworthiness or replace `security/detect-object-injection`. D10.2 verifies typed read and write cases that compile with this option while still receiving the Security warning. Any new compiler requirement would change what consumers must set, so this remains for the maintainer to weigh.

### P11: counter updates use a different assignment convention

**Principles:** 1, 2. **Decision:** D19. Added at the maintainer's request on 20 October 2026.

`operator-assignment: ["error", "never"]` already forbids arithmetic and bitwise compound assignments, and `logical-assignment-operators: ["error", "never"]` already forbids logical compound assignments. However, `no-plusplus` is explicitly off in `src/configs/core/rules/suggestions.ts`, with a comment preferring increment and decrement operators. Consequently, `count += 1` is rejected while `count++` is allowed.

The maintainer requires an explicit assignment convention for both: write `count = count + 1` or `count = count - 1`. Enable `no-plusplus: ["error", { allowForLoopAfterthoughts: false }]`, covering prefix and postfix updates and the update clause of a `for` loop. Retain the two existing `"never"` policies. The current comment preferring increment and decrement operators must be removed when the rule is moved into an enabled group. See the confirmed [D19 policy](#d19-explicit-updates-and-assignment-expressions) for scope and migration requirements.

## Part 2: this repository

### R1: duplicated logic

**Principles:** 7, 1.

- **`isRecord`** is defined six times with the same body: `src/context.ts:61`, `src/utilities/plugin-policy.ts:5`, `scripts/policy-diff/compare.ts:138`, `tests/package/readme.test.ts:116`, `tests/policy/effective-config.ts:24`, and `tests/policy/rule-options.test.ts:40`.
- **`negateIgnores`** in `src/utilities/file-scope.ts:27` is repeated inline in `resolveSvelteComponents` (`src/options.ts:146-152`). The copy drops negated patterns, which is the open question "A negated pattern in `svelte.ignores`". `withoutIgnores(narrowFiles(svelteComponentFiles, files), ignores)` would remove the copy and close that question, so that `svelte.ignores` behaves as every other ignore list (1).
- **`exceptions()`** repeats one condition per feature (`src/configs/exceptions/index.ts:14-24`). A loop over the role's features would keep the type `ExceptionFeature` as the only place to add one.

### R2: builders repeat one shape

**Principles:** 7, 1, 2.

The builders of `comments`, `security`, `unusedImports`, `promise`, `regexp`, `unicorn`, `perfectionist`, and `stylistic` are the same 20 lines with another plugin: a `setup` block, and a `rules` block over `withSvelteComponents(sourceFiles, svelteComponents)` narrowed by `files`. `node`, `sonarjs`, `functional`, and `imports` add one or two blocks to that shape. `CONTRIBUTING.md` asks every new source block to use `withSvelteComponents`; a shared builder for source plugins would guarantee it by construction (1) and remove more than 100 lines (7). The block names, order, and snapshots would stay the same, which `npm run policy:diff` can prove.

Plugin registration also differs within one feature: `packageJson` registers `package-json` in a `setup` block for every file, and `enforce-package-type` in its rules block only.

### R3: lists maintained next to their source

**Principles:** 7, 2.

- `typescriptTypeAwareRulesOff` (`src/configs/plugins/typescript/rules-type-aware.ts:258-322`) repeats the 62 rule IDs of `typescriptTypeAwareRules` and of the typescript-eslint rules in `typeAwareReplacementRules`, each with its fixability comment. `functional` and `sonarjs` have the same kind of list. Deriving the `"off"` entries from the maps keeps the explicit classification and leaves one place to add a rule.
- `scripts/typegen.ts` lists every plugin under the name that `createConfig` registers. `tests/typegen.test.ts` guards the result, so this one is safe, but it is a second list of the plugins.

### R4: test helpers

**Principles:** 1, 2, 7.

- **30 identical casts.** 30 casts of `eslint.calculateConfigForFile()`, in 26 files, carry a disable comment of `@typescript-eslint/no-unsafe-type-assertion`: 29 say "ESLint types the calculated config as `any`.", one says it in other words. The method is called 45 times in 29 files; one typed helper would hold the cast once.
- **Three helpers for one job.** `tests/utilities.ts`, `tests/configs/describe-file.ts`, and `tests/policy/effective-config.ts` each wrap ESLint for a resolved configuration.
- **The vocabulary of 0.1.0.** `tests/utilities.ts:7-15` names its options `tsTypeChecked` and `reactRefreshVariant`, the option names that 0.1.0 had and that `createConfig` now rejects. `tsTypeChecked` defaults to `false`, while the package defaults to typed linting.
- **An example that fails.** The `@example` of `expectLintError` (`tests/utilities.ts:67-68`) expects `no-unused-vars`, which is off, so the example would fail.

### R5: suppressions

**Principles:** 2.

- `tests/package/contract.test.ts:1` turns eight rules off for the whole file: `@typescript-eslint/no-unnecessary-condition`, `@typescript-eslint/no-unsafe-type-assertion`, `functional/prefer-immutable-types`, three `perfectionist` sort rules, and two `security` rules. Every other module disables one or two rules, most of them for one line.
- 18 file-wide `security` disables in `tests/`, see [P4](#p4-reports-that-are-wrong).

### R6: dead entries

**Principles:** 7.

| Entry                                                                                              | Why it does nothing                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"**/yarn.lock"` in `jsonIgnores` (`src/globs.ts:31`)                                              | The JSON block matches `**/*.json` only                                                                                                                                                       |
| `tsconfigRootDir ? { project: tsconfigRootDir } : {}` (`src/configs/plugins/import-x/index.ts:24`) | `Context.tsconfigRootDir` is always an absolute path                                                                                                                                          |
| `maximum: undefined` (`src/configs/plugins/typescript/replacements.ts:74`)                         | A deprecated option, see [P7](#p7-deprecated-rules-and-options)                                                                                                                               |
| `"no-unused-vars": "off"` in `replacementRules` (`replacements.ts:102`)                            | The core map turns it off in every file already, as `["off"]`, the only off entry in array form (`possible-problems.ts:89`)                                                                   |
| `"no-return-await": "off"` (`replacements.ts:159`)                                                 | A deprecated core rule that no map turns on                                                                                                                                                   |
| `"prepublishOnly": "npm run release:check"` (`package.json`)                                       | `.npmrc` sets `ignore-scripts=true`, so npm skips lifecycle scripts, as `npm pack` skips a `prepack` script under the same setting; the publish workflow runs `release:check` as its own step |
| `"test:coverage": "vitest run --coverage"` (`package.json`)                                        | `@vitest/coverage-v8` is not installed: the script exits with "MISSING DEPENDENCY"                                                                                                            |

### R7: the published package

**Principles:** 4, 7. **Decision:** D15.

The tarball holds `dist/index.d.mts.map` (79 KB) and `dist/index.mjs.map` (448 KB), a third of its 1.58 MB unpacked. The declaration map points to `../src/typegen.d.ts`, `../src/types.ts`, and `../src/factory.ts`, which are not published and are not embedded, so it resolves nothing for consumers. Both maps come from `declarationMap: true` in `tsconfig.json`: rolldown-plugin-dts takes its `sourcemap` default from that option and also turns on the JavaScript map. A build with `declarationMap: false` emits only `index.mjs` and `index.d.mts`, and the bundle differs only in its last line, the `sourceMappingURL` comment. If the JavaScript map is wanted, `sourcemap: true` in `tsdown.config.ts` states it where the build is configured.

### R8: scripts and hooks

**Principles:** 1, 7, and "Scripts" in the principles: keep local and automated tasks consistent.

- **The pre-commit hook covers fewer files than CI.** lint-staged runs Prettier and ESLint on `*.{ts,mts,tsx,js,mjs,jsx}`, `package.json`, and `*.md`, with the same two commands repeated three times. `npm run validate` and CI also check JSON, JSON5, YAML, HTML, and Svelte files, so a formatting slip in `tsconfig.json` or a workflow passes the hook and fails CI.
- **Generation runs twice in `validate`.** `build` and `typecheck` each run `npm run gen`.
- **`check:commit`** only runs `lint:staged`; the hook could call `lint:staged`.

### R9: documentation drift

**Principles:** 1, 2.

| Where                                                   | What it says                                                    | What is true                                                                          |
| ------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `CONTRIBUTING.md:59`, cloud setup script                | `NODE_VERSION=24.21.0`, "Keep in sync with .nvmrc."             | `.nvmrc` is `24.22.0`                                                                 |
| `CONTRIBUTING.md:535` and `:216-227`                    | Remove deprecated rules; keep deprecated rules as `"off"`       | Both, see [P7](#p7-deprecated-rules-and-options)                                      |
| `README.md:383`                                         | "Each overlapping check has a fixed owner."                     | 12 pairs have none, see [P3](#p3-two-rules-report-one-problem)                        |
| `README.md:159`                                         | Complexity thresholds warn                                      | Two of them are errors, see [P6](#p6-severities-follow-no-single-rule)                |
| `eslint.config.js:14-15`                                | The `naming-convention` override is for "Rule definition files" | `overridesTypeAware` applies to every typed file of the repository                    |
| `docs/rewrite/record.md`, step 9 of the audit follow-up | "a replaced check comes back where its owner does not lint"     | The core policy follow-up of 17 October removed those blocks; the row does not say so |
| `CLAUDE.md` and `CONTRIBUTING.md`                       | `npx husky`, and `npm run prepare`                              | Both work; one command in both places is easier to follow                             |

### R10: comment and layout conventions

**Principles:** 1.

- **Doc comments or line comments.** Builders describe themselves with `//` comments in most modules and with `/** */` doc comments in `typescript/index.ts` and `typescript/parser.ts`; `unused-imports/index.ts` has none. tsdown keeps doc comments in the bundle and drops line comments, so the choice is visible in `dist/`.
- **Final periods.** `CONTRIBUTING.md` asks every comment to end with a period; `src/types/eslint-plugin-promise.d.ts:1`, `scripts/typegen.ts:33` and `:48`, `tests/utilities.ts:41`, and `tests/policy/rule-coverage.test.ts:47` do not.
- **Reasons for `"off"`.** `@typescript-eslint/no-dupe-class-members`, `no-invalid-this`, and `no-redeclare` say "Not recommended to enable this in new TypeScript projects.", while `compilerCheckedRules` gives the same kind of rule "Handled by the TypeScript compiler (`ts(…)`)".
- **Blank lines inside option objects.** 31 option objects in the rule maps split their keys with a blank line, such as `count: 1,` and `considerComments: true,` in `import-x/newline-after-import` (`src/configs/plugins/import-x/rules/style-guide.ts:61-63`). `perfectionist/sort-objects` has `partitionByNewLine: true` (`src/configs/plugins/perfectionist/rules.ts:13-16`), so the keys on each side are sorted separately. Most of these put unset keys first or object values last, but no document states the rule, so a contributor cannot tell where a new key goes. `#114` introduced them without describing them.
- **Mixed widths of doc comments** in `src/types.ts`: some are wrapped at 100 columns, others are one line.
- **Option objects in `src/configs/shared-options.ts`**: five use `satisfies RuleOptionOf<…>`, six use `as const` alone. The shared options of a core rule and its replacement can satisfy both types with an intersection.

### R11: file and folder layout

**Principles:** 1, 2. **Decision:** D18.

`CONTRIBUTING.md` says that "`tests/configs/` has a file for each module of `src/configs/`" and that a feature's tests are "in the file named after its module". The layout follows a rule in most places, and these are the exceptions:

| Where                                                                                | What differs                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/configs/plugins/import-x/`                                                      | Named after the plugin since #113, while its feature, its block names, and its test file (`tests/configs/imports.test.ts`) say `imports`; the other folders use the feature name, apart from `enforce-package-type/`, the documented second builder of `packageJson` |
| `src/configs/plugins/react/rules/html-best-practice.ts` and `html-best-practices.ts` | Two modules with almost one name, because upstream labels 8 rules "Best Practice" and 1 rule "Best Practices"; D18.3 reviews treating those spellings as one local category, without assuming upstream has confirmed a typo                                          |
| `src/configs/plugins/unicorn/rules/other.ts` and `package-json/rules/other-rules.ts` | Two names for the module of uncategorized rules                                                                                                                                                                                                                      |
| `src/configs/plugins/node/rules.ts`                                                  | Exports `typeAwareRules` itself, while `functional`, `sonarjs`, and `typescript` keep those rules in `rules-type-aware.ts`                                                                                                                                           |
| `src/configs/plugins/comments/` and `src/configs/ignores/`                           | No test file of their own: `tests/configs/code-quality.test.ts` covers `comments`, and the snapshots of `dist/generated.js` cover the global ignores                                                                                                                 |
| Tests of `src/utilities/`                                                            | In three places: `tests/configs/file-scope.test.ts` and `type-aware-scope.test.ts`, `tests/factory/import-peer.test.ts`, and `tests/plugin-policy.test.ts` at the top                                                                                                |
| `src/types.ts` and `src/types/eslint-plugin-promise.d.ts`                            | A module and a folder with one name, for public types and for an ambient declaration                                                                                                                                                                                 |

A rule written in `CONTRIBUTING.md`, such as "folders, block names, and test files use the feature name; tests mirror the path of the module they test", would decide each case, and a test could check it, as `tests/factory/factory.test.ts` already checks the block names.

## Recommendations

### Decisions for the maintainer

The table records the original audit proposals; the later maintainer decision log records verified revisions and confirmed choices and takes precedence. Each recommendation follows the priority order; the last column says which principle decides it.

| ID  | Question                                                         | Recommendation                                                                                                                               | Decided by       |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| D1  | Escape case in regular expressions                               | Uppercase, as `unicorn/escape-case` gives strings: `regexp/letter-case` with `hexadecimalEscape` and `unicodeEscape` `"uppercase"`           | 1                |
| D2  | Blank lines after imports before a comment                       | `import-x/newline-after-import` with `considerComments: false`, so that `perfectionist/sort-imports` owns blank lines among imports          | 1                |
| D3  | `perfectionist/sort-modules` and empty lines inside doc comments | Report the bug upstream, and choose an interim setting, below                                                                                | 1, then 2        |
| D4  | Tool configs and `unicorn/no-top-level-side-effects`             | Add the rule to the `config-files` role, and drop the repository's own block                                                                 | 1                |
| D5  | `package-json/require-peerDependenciesMeta`                      | Off, "Prefer to be optional" like `require-peerDependencies`; `valid-peerDependenciesMeta-relationship` still checks the field               | 1                |
| D6  | Tacit callbacks                                                  | Keep `unicorn/no-array-callback-reference`, and turn off `functional/prefer-tacit` with a `Handled by` comment                               | 1, then 3 over 9 |
| D7  | React components with typed linting                              | A `naming-convention` entry for `.tsx` files that also allows PascalCase for functions and function-valued `const` variables                 | 1, then 3        |
| D8  | Owners of the twelve pairs                                       | The rule that works in every file, so that ownership stays static, below                                                                     | 7, 1             |
| D9  | `allowAny` of `@typescript-eslint/promise-function-async`        | `true`, the upstream default                                                                                                                 | 1                |
| D10 | The two noisy `security` rules                                   | Add `security/detect-non-literal-fs-filename` to the test-files role; weigh `security/detect-object-injection` the same way                  | 2 over 3         |
| D11 | The three known issues of P5                                     | `selfClosingCustomPatterns: []`; the five Markdown rules off until upstream fixes them; `.svelte.mjs` and `.svelte.mts` out of `svelteFiles` | 1, 3             |
| D12 | Severity of thresholds                                           | All thresholds warn, as the README says, and `CONTRIBUTING.md` states the rule                                                               | 1                |
| D13 | Deprecated rules                                                 | None in the maps, and `tests/policy/deprecated-rules.test.ts` fails on a deprecated rule or option at any severity                           | 6, 7             |
| D14 | Generated output                                                 | `**/.next/`, `**/.svelte-kit/`, and the output folders of the other detected tools in the global ignores                                     | 1, 4             |
| D15 | Source maps in the package                                       | None: `declarationMap: false`; or the JavaScript map only, with `sourcemap: true` in `tsdown.config.ts`                                      | 7, 4             |
| D16 | SonarJS's AWS CDK rules                                          | On only when the manifest declares `aws-cdk-lib`                                                                                             | 4                |
| D17 | SonarJS's test rules                                             | Only in the files of the test-files role                                                                                                     | 4                |
| D18 | Naming of folders and test files                                 | The feature name everywhere, with `import-x/` back to `imports/`, one name for uncategorized rules, and tests that mirror the source path    | 1, then 2        |
| D19 | Explicit updates and assignment expressions                      | Enable `no-plusplus` with no `for`-loop exception; retain `operator-assignment: "never"` and `logical-assignment-operators: "never"`         | 1, 2 over 9      |

**D3, interim setting.** Either costs one layout check, and both keep fixes deterministic:

- `newlinesBetween: "ignore"` for `perfectionist/sort-modules` ends every loop of the sample, and stops checking blank lines between module members, which no other rule checks. Recommended, because it keeps doc comments readable with paragraphs (2) and keeps their style owner.
- Turning `unicorn/no-asterisk-prefix-in-documentation-comments` off ends 27 of the 28 loops, and leaves doc comments without a style owner, so both styles pass.

**D8, owners.** Each winner keeps its options, and each alternative is `"off"` with a `Handled by` comment:

| Winner                                         | Turned off                                                                                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `eqeqeq`                                       | `no-eq-null`                                                                                                                |
| `no-eval`                                      | `security/detect-eval-with-expression`                                                                                      |
| `no-nested-ternary`                            | `unicorn/no-unnecessary-nested-ternary`                                                                                     |
| `no-useless-escape`, which also checks strings | `regexp/no-useless-escape`                                                                                                  |
| `regexp/no-control-character`                  | `no-control-regex`                                                                                                          |
| `regexp/no-super-linear-backtracking`          | `security/detect-unsafe-regex`                                                                                              |
| `no-restricted-globals`                        | `unicorn/no-new-buffer`, whose suggestion the winner reports                                                                |
| `unicorn/prefer-await`                         | `promise/prefer-await-to-then`                                                                                              |
| `unicorn/require-array-sort-compare`           | `@typescript-eslint/require-array-sort-compare`                                                                             |
| `regexp/prefer-regexp-exec`                    | `@typescript-eslint/prefer-regexp-exec`                                                                                     |
| `require-unicode-regexp`                       | `sonarjs/unicode-aware-regex`                                                                                               |
| `default-case`                                 | No rule: `@typescript-eslint/switch-exhaustiveness-check` gets `requireDefaultForNonUnion: false` and keeps checking unions |

### Proposed steps

Each step is one pull request, as in the previous audit follow-up. Steps 1 to 6 change the policy, so they update the snapshots and the README; steps 7 to 10 must leave every snapshot unchanged, which `npm run policy:diff -- --base origin/main` shows.

1. **A test that fixes code with many problems at once** ([below](#a-guard-against-regressions)). It comes first so that steps 2 to 4 each turn a failing case into a passing one.
2. **Fix loops:** D1, D2, D3.
3. **Rules with no passing form:** D4, D5, D6, D7.
4. **One owner per check:** D8, with the README table extended.
5. **Wrong reports and the known issues:** D9, D10, D11.
6. **Conventions and cost:** D12, D13, D14, D16, D17, D19, with the matching `CONTRIBUTING.md` sections.
7. **Duplicated logic:** R1 and R2. The `svelte.ignores` change of R1 changes behavior for negated patterns only; it belongs in step 6 if the maintainer sees it as a policy change.
8. **Hand-maintained lists and test helpers:** R3, R4, R5.
9. **Dead entries, package, and scripts:** R6, R7 (D15), R8.
10. **Documentation, conventions, and layout:** R9, R10, and R11 (D18). Renaming a folder changes no snapshot line; `npm run policy:diff` shows it.

### A guard against regressions

The tests that run fixes use the fixtures, which pass the policy with every feature on, or samples written for one rule, and no test compares the reports of two rules on one sample. A conflict between two rules shows only in code that both rules report, so no current test can fail on P1 to P3. A test in `tests/policy/` could lint a set of samples with problems, with `fix: true`, and assert:

- no "Circular fixes detected" warning, and that a second `--fix` run changes nothing;
- no two rules of different maps report the same range, apart from a short reviewed list of pairs with different concerns, such as `import-x/exports-last` and `import-x/group-exports`;
- no fix produces a file that another enabled rule reports, for the pairs that P3 resolves.

The samples can start with the reproductions of this audit. This turns principle 1 for fixes and principle 7 for reports into checks that tools enforce, as the principles ask.

## Method

All commands ran in a worktree at `e9a9192`, after `npm ci` and `npm run build`, with Node.js 24.22.0 and ESLint 10.12.0. Scratch files lived under `node_modules/.cache/`, which Git, Prettier, and ESLint ignore.

- **Rule maps and code** were read in full for `src/`, the builders, the shared utilities, the scripts, the test helpers, and the policy tests.
- **Overlaps and contradictions** were found by linting small samples with `createConfig({ express: false, react: false, svelte: false })` in a temporary project with the tsconfig of the README, as `.ts` with typed linting and as `.js`, and grouping the messages by line and column. Every pair in P2 and P3 comes from such a sample.
- **The corpus** was one ES module of 1.5 to 20 KB from each of 150 installed packages, linted as JavaScript with `environments: ["node", "browser"]` and `fix: true`, in 39 seconds. A replay applied the fixes of each pass in order of position, skipping overlapping ones as ESLint does, and recorded the rules whose fixes repeated a state. Rule pairs that reported the same range in more than half of one rule's reports were checked by hand; the meaningful ones are in P3.
- **Consumer checks** used a project whose `node_modules` linked this package and declared it with ESLint as dev dependencies: the README's `eslint.config.js`, a React component in a `.tsx` file, `.next/` and `.svelte-kit/` output, and two application manifests.
- **Package contents** came from `npm pack --dry-run --json`, and a second build with a tsconfig that extends the repository's and sets `declarationMap: false`.
- **Rule time** came from `TIMING=all npx eslint src scripts tests` in this repository, one run at a load average of about 4, so the shares are indicative.
- **Counts** of disable comments, call sites, and definitions came from `grep` over `src/`, `scripts/`, and `tests/`, without the snapshots.

## Maintainer decision log

Decision discussion started on 20 October 2026. Confirmed choices and their rationale will be recorded here in English.

**Status:** D1, D2, D4, D6, and D7 are confirmed (A for each). D3 is confirmed with a custom policy. D5 is confirmed (B — conditional, explicit peer metadata). The D7 AST-name follow-up is confirmed (B — retain targeted inline suppressions). D8.1, D8.2, and D8.3 are confirmed (A for each — eqeqeq owns strict comparisons, including null; no-eval owns the eval prohibition; no-nested-ternary owns nested result branches). D8.4 is confirmed (A — retain both escape rules because their coverage differs). D8.5 is confirmed (A — use the RegExp control-character rule and allow intentional constructor control escapes). D8.6 is confirmed (B — retain all three regex-performance rules with complementary-coverage comments). D8.7 is confirmed (A for the API policy and constructor ownership — retain the Uint8Array preference and replace the two direct-constructor checks with a native syntax restriction, including explanatory comments). D8.8 is confirmed (A — retain both await-preference rules with complementary-coverage comments). D8.9 is confirmed (A — retain both array-sort comparator rules with complementary-coverage comments). D8.10 is confirmed (A — retain RegExp and temporarily disable TypeScript's execution-preference rule because its autofix can change global-match results, with explanatory comments). D8.11 is confirmed (A — retain core and SonarJS Unicode rules with complementary-coverage comments). D8.12 is confirmed (A — retain both switch rules and TypeScript's non-union default requirement with complementary-coverage comments). D9 is confirmed (B — retain opaque-return async review with `allowAny: false` and an explanatory comment). D19 is confirmed (explicit updates; no increment, decrement, or compound assignment operators). D10.1 is confirmed (B — retain filesystem-path warnings in test files and prefer justified operation-level suppressions). D10.2 is confirmed (B — retain object-injection warnings in test files and prefer justified local exceptions). D11.1 is confirmed (A — preserve explicit custom-element end tags in HTML with an explanatory comment). D11.2 is confirmed (A — temporarily disable five crashing Markdown rules with cause/upstream comments and verified restoration criteria). D11.3 is confirmed (A — restrict Svelte parsing to supported suffixes and retain ordinary module parsing for .mjs/.mts). D12 is confirmed (A — use warnings consistently for the twelve quantitative maintainability limits, preserving their values and the zero-warning gate). D13.1 is confirmed (A — omit every deprecated rule entry, including off, accepting the documented inherited-config effect). D13.2 is confirmed (A — remove the redundant maximum alias while preserving supported options and the formatter compatibility guard). D14 is confirmed (A — globally ignore .next and .svelte-kit directories at any depth, preserving caller patterns). D15 is confirmed (A — publish no source maps, limiting original-source disclosure and removing unused artifacts). D16 is confirmed (B — retain all eighteen AWS CDK security checks without a root-manifest gate, with English reason comments). D17 is confirmed (B — preserve current test-rule scopes and typed guards, with an English reason comment). D18.1 is confirmed (A — rename the internal import feature folder to imports, preserving the import-x namespace). D18.2 is confirmed (A — use other.ts consistently for remaining-rule modules). D18.3 is confirmed (A — normalize the two React HTML category spellings into html-best-practice.ts). D18.4 is confirmed (A — extract Node's TypeScript-specific maps into rules-type-aware.ts). D18.5 is confirmed (A — organize tests by source ownership, with explicit integration/support groups). D18.6 is confirmed (A — move the authored ambient dependency declaration to src/ambient/, preserving public and generated types).

**Decision review completed:** 21 October 2026. Every listed D1–D19 topic, including the recorded subdecisions and follow-ups, now has a confirmed maintainer choice. The upstream-fix restoration conditions in D8.10 and D11.2 remain follow-up conditions rather than undecided choices. Behavioral changes, structural migrations, regression tests, and full validation remain implementation work; only the retained-policy explanation comments explicitly recorded above were applied during this discussion. This completes the decision review, not the audit implementation.

**Implementation guide:** [AUDIT_RESULT_FOLLOW_UP_IMPLEMENTATION.md](AUDIT_RESULT_FOLLOW_UP_IMPLEMENTATION.md) defines fourteen ordered stages for future AI execution, including scope, regressions, exit criteria, coverage, and stage handoffs. It supersedes the original proposed execution order while preserving the final choices below. Preparing the guide does not execute any implementation stage.

### Decision criteria

The maintainer requires [the coding principles](CODING_PRINCIPLES.md) to serve as both the end goals and the guardrails for every decision. This applies to this repository's code, files, folders, project architecture, configuration, and scripts, as well as the coding patterns and behavior enforced in consumer projects. Evaluate alternatives in the documented priority order and explain any trade-off.

Every subsequent decision question must include a recommendation, the principles supporting it, and code examples comparing the outcomes of the available choices. Questions are discussed in Indonesian; the decision record remains in English.

For overlapping rules, the maintainer additionally directs the agent to verify which rule has broader coverage, select that rule, and disable the narrower rule with an ownership comment. Apply this criterion using actual diagnostic coverage rather than rule names or automatic-fix availability. If each rule detects cases the other misses, report that boundary rather than claim that one fully replaces the other.

The D8.6 clarification requires retaining complementary checks when a proposed replacement does not fully cover the other rule's diagnostics. Do not infer that more precise or broader analysis in some cases authorizes removing unique heuristic warnings. Document retained complementary coverage with `Complemented by` comments that name the other rules and their roles. Approved exceptions remain explicit individual decisions: D8.5 accepts intentional constructor control escapes, D8.10 accepts lost computed-access preference reports to avoid a verified behavior-changing autofix, and D11.2 temporarily accepts lost Markdown diagnostics/fixes to avoid reproduced lint exceptions until an upstream correction is verified.

### D1: escape case in regular expressions

**Recommendation:** A — use uppercase hexadecimal and Unicode escape values in both regular expressions and strings. Set `hexadecimalEscape` and `unicodeEscape` to `"uppercase"` in `regexp/letter-case`, retaining its other options and the existing uppercase setting of `unicorn/escape-case`.

**Rationale:** Principle 1 requires consistent preferred forms and deterministic fixes. Either uniformly uppercase or uniformly lowercase escapes can meet that goal; uppercase aligns regex policy with the existing string policy and resolves the contradiction documented in P1. Keeping the same convention across both kinds of literals also makes the policy easier to understand and maintain (principle 2). Capitalization does not change the represented character, and the principles do not intrinsically require uppercase over lowercase.

**Maintainer choice:** A — uppercase. Confirmed by the maintainer on 20 October 2026.

### D2: blank lines after imports before a comment

**Recommendation:** A — set `considerComments: false` in `import-x/newline-after-import`, retaining its other options and the current `perfectionist/sort-imports` policy. The import sorter owns ordering and spacing within the import groups; the newline rule keeps the separation between the final import and the following statement.

**Alternative:** B — retain `considerComments: true` and set `partitionByComment: true` in `perfectionist/sort-imports`. Comments then divide imports into independent sections. Imports are sorted within each section, but are not reordered across its comment boundary; the newline rule requires a blank line before the next section's comment.

**Rationale:** A resolves the contradiction documented in P1 while preserving consistent ordering within the configured import groups (principle 1). A clear division of responsibility also makes the policy easier to maintain (principle 2) and avoids conflicting spacing checks (principle 7). B supports manually arranged, comment-separated sections, at the cost of allowing comments to prevent sorting across those sections.

**Example check:** The two alternatives were checked on a small import sample with only the two affected rules enabled. Both produced no diagnostics and no changes on a second fix run. This check covers the interaction shown in the examples.

**Maintainer choice:** A — set `considerComments: false` in `import-x/newline-after-import` and retain the current `perfectionist/sort-imports` policy. Confirmed by the maintainer on 20 October 2026.

**Implementation follow-up:** On 21 October 2026, the maintainer also approved
`exactCount: false` after Stage 2 reproduced a conflict: with
`considerComments: false`, the retained `exactCount: true` counts multiline
documentation as excess import-to-statement spacing, while
`unicorn/single-line-block-comment-style` requires multiline documentation.
Retain `count: 1` as the minimum and leave Perfectionist's ordering, grouping,
and `partitionByComment: false` unchanged. This explicit instruction supersedes
Stage 2's earlier requirement to retain the exact-count setting; documentation
comments keep their original content and placement.

### D3: module spacing and paragraphs in documentation comments

**Initial recommendation, before the discussion below:** A — temporarily set `newlinesBetween: "ignore"` in `perfectionist/sort-modules`, retaining its other options and `unicorn/no-asterisk-prefix-in-documentation-comments`. Declaration ordering remains enforced, and documentation comments retain their existing style owner and paragraph breaks.

**Trade-off:** A stops enforcing blank-line spacing between module declarations, including within groups because `newlinesInside` inherits `newlinesBetween`. No other enabled rule currently owns this spacing. Revisit this temporary setting after the upstream bug is fixed, with regression coverage for documentation paragraphs before restoring a spacing requirement.

**Alternative:** B — turn off `unicorn/no-asterisk-prefix-in-documentation-comments` and retain the existing module-spacing policy. Documentation comments with and without leading asterisks are then allowed. This removes the documentation-style owner and is an incomplete workaround: the audit reports that it resolves 27 of 28 related loops, leaving one involving a comment that already lacked asterisks.

**Rationale:** Principle 1 makes deterministic fixes the primary requirement. The audit reports that A resolves every loop attributed to this interaction, whereas B leaves a known failure. A also preserves readable documentation paragraphs (principle 2) and a consistent documentation-comment style. The loss of enforced declaration spacing is explicit and temporary.

**Example check:** A documentation comment with a paragraph break above a second function was checked with only the two affected rules enabled. A removed the leading asterisks; B retained them. Both were stable on that example. The broader loop counts above come from the audit, not from this example check.

**Maintainer feedback:** The maintainer finds documentation comments with leading `*` more familiar and asked for examples of established projects using the alternative. This expresses a readability preference; it is not a confirmed choice of B.

**External examples checked:** Documentation without leading asterisks appears repeatedly in [Chalk's API declarations](https://github.com/chalk/chalk/blob/main/source/index.d.ts), [Got's options and hooks](https://github.com/sindresorhus/got/blob/main/source/core/options.ts), and [Type-Fest's `PartialDeep` declarations](https://github.com/sindresorhus/type-fest/blob/main/source/partial-deep.d.ts). These examples establish actual use, not prevalence across JavaScript and TypeScript projects. Starred documentation also appears in [Node.js's EventEmitter implementation](https://github.com/nodejs/node/blob/main/lib/events.js) and [the official JSDoc examples](https://jsdoc.app/about-getting-started).

**Revised guidance:** Separate the preferred documentation style from the spacing bug workaround. Neither style is intrinsically more readable under the coding principles. The maintainer's familiarity supports consistently starred documentation for this project under principle 2, provided the policy also satisfies principle 1 through a clear style owner and stable fixes. The original B only permits asterisks; it neither requires them nor fixes every documented loop. A complete starred-style proposal therefore needs an appropriate style owner and a separately verified solution to the remaining spacing failure. The exact rule policy remains open for discussion.

**Agreed custom outcome:** Require arrow functions with block bodies for ordinary functions, preserve starred documentation comments, and require a blank line after a variable declaration that directly initializes a function, before the next statement and its leading documentation comment. Ordinary non-function `const` and `let` declarations must not acquire a blank-line requirement from this policy. This replaces the original A/B framing for the desired behavior; implementation must satisfy the scope and guardrails below.

The corrected syntax and intended layout are:

```js
const first = () => {
  return 1;
};

/**
 * Describe the second function.
 *
 * Explain a detail.
 */
const second = () => {
  return 2;
};

const maxAttempts = 3;
let attempts = 0;
attempts += 1;
```

**Feasibility verified:** The pinned `@stylistic/eslint-plugin` 5.10.0 supports AST-selector objects in `@stylistic/padding-line-between-statements`. A focused configuration can match function-valued variable declarations, including named exports, instead of matching all `const` or `let` declarations. No new plugin or custom rule is required for this spacing requirement. The rule requires at least one blank line when a following statement exists; it does not require an extra blank line before a closing brace or at the end of the file. See [the rule documentation](https://eslint.style/rules/padding-line-between-statements) and [the source at the pinned version](https://github.com/eslint-stylistic/eslint-stylistic/blob/v5.10.0/packages/eslint-plugin/rules/padding-line-between-statements/padding-line-between-statements.ts).

The tested selector options were:

```js
{
  blankLine: "always",
  prev: [
    {
      selector:
        'VariableDeclaration:matches([declarations.0.init.type="ArrowFunctionExpression"], [declarations.0.init.type="FunctionExpression"])',
    },
    {
      selector:
        'ExportNamedDeclaration:matches([declaration.declarations.0.init.type="ArrowFunctionExpression"], [declaration.declarations.0.init.type="FunctionExpression"])',
    },
  ],
  next: "*",
}
```

**Current function-style policy verified:** `src/configs/core/rules/suggestions.ts` sets `func-style` to `"expression"` and `arrow-body-style` to `"always"`; the effective-policy snapshots retain both settings. Ordinary and named-exported function declarations are reported. Both arrow functions and named `function` expressions assigned to variables are allowed by the checked function-style rules. The config does not enforce arrow-only functions. `allowArrowFunctions: false` does not prohibit arrows in expression mode. Methods, default-exported function declarations, and TypeScript overload declarations have separate treatment; `func-style` does not make every function in every syntactic position an expression. See [the official `func-style` documentation](https://eslint.org/docs/latest/rules/func-style).

**Additional maintainer request:** Require arrow functions for ordinary functions, strengthening the current expression-only policy. An ordinary `const first = function first() { return 1; };` must be reported, with `const first = () => { return 1; };` as the preferred form. This is a requested policy change, not a description of the current config.

**Agreed scope:** Require arrows for ordinary standalone functions and callbacks wherever the intended behavior is compatible with an arrow. Keep object/class methods, accessors, constructors, generators, and functions that require their own dynamic `this` or `arguments` as explicit semantic exceptions. Arrows cannot be generators or constructors and do not have their own `this` or `arguments`; automatic conversion must not change those behaviors. The maintainer accepted this scope together with the custom layout on 20 October 2026. See [the JavaScript arrow-function reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions).

**Arrow-policy feasibility check:** With ESLint 10.12.0, the existing `func-style` and `prefer-arrow-callback` rules were combined with a focused `no-restricted-syntax` selector, `VariableDeclarator > FunctionExpression.init[generator=false]`. Nine isolated probes confirmed that ordinary arrow and async-arrow initializers pass, a traditional function initializer is reported by the new restriction, an ordinary declaration is reported by `func-style`, a traditional callback is reported by `prefer-arrow-callback`, and methods, getters, class constructors, and generator expressions remain outside that focused restriction. No new dependency was needed for this proof. A complete implementation must review other expression positions, typed declarations and overloads, semantic exceptions, and ownership so the same function is not reported twice. The syntax restriction reports a diagnostic; it does not automatically rewrite the function. See [the ESLint syntax-restriction documentation](https://eslint.org/docs/latest/rules/no-restricted-syntax).

**Verification scope:** With ESLint 10.12.0, focused probes confirmed the function-style reports above. Eight spacing examples covered an arrow before starred documentation, ordinary variables, an object containing an arrow callback, a function variable nested inside an object method, an exported arrow, a named function expression, an async arrow, and a final declaration in a block. All eight had no remaining spacing diagnostics and no changes on a second fix run; ordinary variables and their surrounding spacing stayed unaffected. These were isolated rule checks, not a full validation of the published config. The selector examples match direct initializers; TypeScript assertion wrappers and other indirect function-valued expressions need separate consideration during implementation.

**Implementation guardrails:** Turn off the Unicorn rule that removes documentation asterisks before adopting the starred style. Give the function-variable spacing check one owner, since the current `perfectionist/sort-modules` implementation skips variable declarations. Resolve the original module-spacing loop as well; the new spacing check alone does not fix it. Decide how to enforce starred documentation without silently changing the policy for ordinary grouped line comments: `multiline-comment-style: "starred-block"` also converts those comments to blocks. Preserve paragraph breaks and keep both ESLint fixes and the formatter stable.

**Recommendation:** Follow the requested custom layout and strengthen expression mode with the requested arrow-function policy, using the semantic exceptions described above. Use the existing selector-based spacing rule rather than applying padding to every variable declaration. This distinguishes code roles consistently (principle 1), preserves familiar documentation and readable function boundaries (principle 2), and uses existing rules for the checked spacing and arrow-policy cases (principle 7). Treat arrow enforcement as a policy change and verify behavior-sensitive cases before adding any automatic conversion.

**Maintainer choice:** Confirmed custom policy — require arrows with block bodies for ordinary functions and compatible callbacks, retain the agreed semantic exceptions, use starred documentation, and require separation after function-valued variable declarations without imposing it on ordinary variables. Confirmed by the maintainer on 20 October 2026. Rule integration and complete regression validation belong to implementation; no runtime configuration has been changed in this decision discussion.

### D4: tool configuration files and top-level side effects

**Question:** Should the published config account for tool configuration modules that assemble and export their configuration when loaded, or should each consumer add its own exception?

**Recommendation:** A — add `unicorn/no-top-level-side-effects` to the existing `config-files` exception role and remove the repository-only `repository/tool-configuration` block once the shared role replaces it. Keep the exception within the role's existing JavaScript/TypeScript source scope and only emit it when the Unicorn feature is enabled. The README's `export default createConfig();` and tool patterns such as `export default defineConfig(...)` then work without a consumer-specific override for this rule.

**Alternative:** B — retain the current published policy and require each consumer to add a scoped override for its own tool configuration files. This lets each project select the exception files explicitly but repeats the policy already needed by this repository and the README's usage example.

**Rationale:** Equivalent tool configuration modules should receive the same policy in this repository and consumer projects (principle 1). A shared, role-based exception is easier to maintain (principle 2) and removes duplicated local overrides (principle 7). The rule remains enabled for ordinary application source files.

**Example check:** With ESLint 10.12.0 and the rule and adapter from the pinned Unicorn 77.0.0 package, the README-style export reports the rule in `eslint.config.js`. A scoped config-file override removes that report, while the same call in `src/application.js` is still reported. This was an isolated rule check, not a full consumer validation.

**Maintainer choice:** A — add `unicorn/no-top-level-side-effects` to the shared `config-files` exception role and remove the redundant repository-only block after the shared exception is in place. Confirmed by the maintainer on 20 October 2026.

### D5: whether peer dependency metadata is required

**Question:** Should peer dependency metadata remain optional, or should packages declaring peers explicitly describe them in metadata?

**Recommendation:** A — turn off `package-json/require-peerDependenciesMeta` with the reason "Prefer to be optional", matching the existing optional status of `require-peerDependencies`. Keep `valid-peerDependenciesMeta`, `valid-peerDependenciesMeta-relationship`, and `no-empty-fields` enabled. Packages may omit metadata when it adds no information; metadata that is present must still be valid.

**Alternative:** B — require nonempty metadata when `peerDependencies` is present, with explicit optionality for the declared peers. Packages without peers must still be allowed to omit the field. This is a conditional policy proposal, not the current unconditional requirement, and requires additional conditional validation. For a required peer, the comparison example explicitly writes `"optional": false` instead of relying on the default required status.

**Rationale:** The published policy must provide a passing form for applications and libraries without peers (principle 1). A also avoids metadata that merely repeats the default required status (principle 7) and reduces manifest maintenance (principle 2). B makes peer optionality explicit, at the cost of additional declarations and conditional validation. Neither choice should require an empty metadata object when no peers exist.

**Evidence:** The current rule maps require `peerDependenciesMeta` even though `peerDependencies` is optional, while `no-empty-fields` rejects an empty metadata object; P2 documents that contradiction. The [npm manifest documentation](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#peerdependenciesmeta) describes metadata as additional information for peers, including `optional: true` for optional peers. The question's snippets compare only the peer-related fields, not a complete manifest validation.

**Maintainer choice:** B — when a package declares peer dependencies, require nonempty `peerDependenciesMeta` with an explicit `optional` boolean for each declared peer. Packages without peer dependencies may omit the metadata field. Confirmed by the maintainer on 20 October 2026.

**Accepted trade-off and implementation requirement:** Keep explicit peer optionality even when it repeats the default required status. Add conditional validation so the policy covers each declared peer without recreating the impossible requirement for packages without peers. Retain the existing metadata-shape, peer-relationship, and nonempty-field checks, and give the conditional requirement a single owner. The existing unconditional requirement alone does not implement this decision.

### D6: explicit array callbacks or direct function references

**Question:** Should array callbacks explicitly forward their intended arguments, or should a forwarding callback be replaced by a direct function reference?

**Recommendation:** A — keep `unicorn/no-array-callback-reference` and turn off `functional/prefer-tacit`, documenting the conflict and the array-callback owner. For example, prefer `values.map((value) => { return double(value); })` over `values.map(double)`. Use block bodies as agreed in D3. The wrapper chooses the arguments forwarded to `double`.

**Alternative:** B — turn off `unicorn/no-array-callback-reference` and retain `functional/prefer-tacit` in its type-aware scope. Prefer `values.map(double)` for this forwarding pattern. This removes a wrapper, but the referenced function receives the array method's full callback argument list; reviewers must account for its signature and any future changes.

**Rationale:** Both choices remove the contradictory reports documented in P2 and give the example a passing form (principle 1). A makes argument forwarding explicit and protects against accidental interpretation of the callback's index or array as another parameter (principles 1 and 3). B favors concision (principle 9). D3 controls the syntax used to define ordinary functions; it does not by itself distinguish between passing an already-defined arrow by reference and invoking it through a forwarding arrow.

**Behavioral example:** For `multiply(value, factor = 2)`, mapping `[1, 2, 3]` through a wrapper that passes only `value` produces `[2, 4, 6]`; passing `multiply` directly produces `[0, 2, 6]` because the index becomes `factor`. These runtime results were checked directly. The [JavaScript `map` reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map#using_parseint_with_map) documents the callback's value, index, and array arguments and the analogous `parseInt` pitfall.

**Maintainer choice:** A — retain `unicorn/no-array-callback-reference` and turn off `functional/prefer-tacit`, documenting the conflict and ownership. Prefer explicit forwarding arrows with block bodies for the array-callback pattern shown above. Confirmed by the maintainer on 20 October 2026.

### D7: PascalCase names in typed JSX files

**Question:** How narrowly should PascalCase be allowed in `.tsx` files so React components can follow their naming convention?

**Recommendation:** A — extend `@typescript-eslint/naming-convention` in the `.tsx` type-aware scope to also allow PascalCase for function-valued `const` variables and the relevant function declarations. Preserve the existing allowed formats and naming checks for other variables and other files. The accepted D3 arrow policy still governs ordinary function definitions; this naming allowance does not re-enable prohibited declarations.

**Alternative:** B — also allow PascalCase for every variable in `.tsx`, regardless of whether its value is a function. For example, both a `Greeting` component and a numeric `RetryCount` variable would be allowed by the naming rule. Other files and type-aware checks retain their existing scope. This uses a broader naming convention within JSX files instead of distinguishing function-valued variables from ordinary data.

**Rationale:** A supports the component role while preserving the naming distinction for ordinary data (principle 1), helping readers identify code roles consistently (principle 2). B is a simpler, broader allowance but also permits PascalCase for non-component data. Both options keep type-aware linting active; disabling it for React files is not part of either proposal (principle 3).

**Evidence and scope:** The existing shared naming options allow variables only camelCase or UPPER_CASE, and P2 records the resulting report on a PascalCase arrow component. [React's documentation](https://react.dev/learn/your-first-component#defining-a-component) requires component names to start with a capital letter. [The naming rule documentation](https://typescript-eslint.io/rules/naming-convention/#types) supports the `function` type filter for variable selectors. Such a filter identifies function-valued variables; it does not prove that every matched function is a React component. D7 resolves the naming conflict; the separate React handler and effect findings in the README still need their own treatment.

**Maintainer choice:** A — allow PascalCase for function-valued `const` variables and the relevant function declarations in typed `.tsx` files, preserving the existing naming rules for ordinary data and other files. Keep type-aware linting active and retain the accepted D3 function-style policy. Confirmed by the maintainer on 20 October 2026.

### D7 follow-up: AST node names used as object keys

**Maintainer request:** Check whether keys such as `ImportAttribute` and `Property` can be accepted automatically when they represent AST node names, removing repeated naming-rule suppression comments. Verify the capability before making a policy change; an unavailable automatic solution is acceptable.

**Verified capability:** In typescript-eslint 8.70.0, both keys are canonical `AST_NODE_TYPES` names. A naming-convention entry with `selector: "objectLiteralProperty"`, a name filter derived from that enum, and `format: ["PascalCase"]` accepts these keys without inline suppressions. This can be limited to repository rule-definition files through a flat-config override, keeping the ordinary naming policy on application sources. The two current evidence files are `src/configs/plugins/stylistic/rules.ts` and `src/configs/shared-options.ts`.

**Verified limitation:** The native `naming-convention` schema does not accept arbitrary AST selectors or contextual record types. Its `filter` checks the identifier text; its optional type filters cover primitive categories. A name-based exception therefore cannot establish that a property is actually being used as an AST-node key. Even within a scoped rule-definition file, an unrelated `const data = { Property: true };` would receive the same exception. Applying the filter globally would also allow this ordinary data key in consumer application code. Exact contextual recognition requires additional custom rule logic. See [the naming-rule filter documentation](https://typescript-eslint.io/rules/naming-convention/#filter) and [supported selector and type options](https://typescript-eslint.io/rules/naming-convention/#allowed-selectors-modifiers-and-types).

**Focused verification:** Using ESLint 10.12.0, the installed typescript-eslint parser and plugin at 8.70.0, and the locally available `@typescript-eslint/types` enum at 8.70.1, six examples checked the original reports, accepted AST keys under a file-scoped exception, a rejected unknown node name, unchanged application-file reports, the same-name limitation inside a rule-definition file, and the overly broad effect of a global name exception. An additional schema check rejected an arbitrary AST selector. These checks verify name-based matching and its boundaries; they do not demonstrate semantic AST-context detection. Implementation must select the canonical enum source explicitly rather than rely on an undeclared transitive dependency.

**Recommendation:** A — use a centralized, name-based exception derived from canonical AST node names, limited to the known repository rule-definition files. Keep other names and application sources under the existing naming policy. This gives the file role a documented convention (principle 1), removes repeated suppressions (principle 2), and uses the existing rule configuration (principle 7). Accept this option only with the name-based limitation above; it is not a global consumer exception or full semantic detection.

**Alternative:** B — retain the targeted inline suppression comments. Each comment marks an actual external AST-name contract at the point of use, with no broader name-based allowance. Prefer this if exact use-site precision is required over reducing the comments.

**Maintainer choice:** B — retain the targeted inline suppression comments at actual AST-name contract sites. Confirmed by the maintainer on 20 October 2026. Do not add a centralized AST-name whitelist or a custom semantic detector for this follow-up. This accepts repeated comments in exchange for precise use-site exceptions without allowing unrelated properties with the same names. No naming exceptions or source suppression comments have been changed.

### D8: owners of overlapping checks

Review the twelve overlap cases individually. The recommendations in the original D8 table are proposals, not confirmed maintainer decisions.

#### D8.1: equality comparisons with null

**Current behavior:** `eqeqeq: ["error", "always", { null: "always" }]` and `no-eq-null: "error"` both report `value == null` and `value != null`.

**Recommendation:** A — retain the current `eqeqeq` options and set `no-eq-null: "off"`, with a `Handled by eqeqeq` comment. One rule owns strict equality for both null and other values. This preserves the accepted coding patterns and removes duplicate reports.

**Alternative:** B — use `eqeqeq: ["error", "always", { null: "ignore" }]` together with `no-eq-null: "error"`. This also removes duplicate reports and preserves strict equality, but assigns null comparisons to a separate rule. Both alternatives reject `value == null`, accept `value === null`, and continue rejecting `status == "ready"` through `eqeqeq`.

**Rationale:** A gives equivalent comparisons a consistent diagnostic owner (principle 1), keeps the policy easier to maintain (principle 2), and avoids a separate rule for a check already covered by that owner (principle 7). B offers a dedicated rule identifier for null comparisons. The [ESLint equality rule documentation](https://eslint.org/docs/latest/rules/eqeqeq#always) supports both null options, and the [no-eq-null documentation](https://eslint.org/docs/latest/rules/no-eq-null#when-not-to-use-it) recommends `eqeqeq` for enforcing strict comparisons generally.

**Maintainer clarification:** Strict equality must apply to null comparisons as well as other comparisons: use `===` and `!==`. Removing a duplicate report must not permit `== null` or `!= null`. The maintainer noted that two reports are not inherently incorrect, then selected A because `eqeqeq` already enforces the null requirement.

**Maintainer choice:** A — retain `eqeqeq: ["error", "always", { null: "always" }]` and set `no-eq-null: "off"`, documenting that `eqeqeq` owns the check. Confirmed by the maintainer on 20 October 2026. This decision removes the duplicate rule report without relaxing strict comparisons. The source configuration has not yet been changed.

#### D8.2: eval calls

**Current behavior:** `no-eval: ["error", { allowIndirect: false }]` rejects direct and supported indirect uses of `eval`. `security/detect-eval-with-expression: "warn"` additionally reports direct calls whose first argument is not a literal. Consequently, `eval(input)` produces both an error and a warning for the same call.

**Recommendation:** A — retain the current `no-eval` options and set `security/detect-eval-with-expression: "off"`, with a `Handled by no-eval` comment. Keep the broader prohibition on eval rather than depending on the narrower expression check.

**Alternative:** B — retain both rules at their current severities. `eval(input)` continues to produce an error and a warning; `eval("1 + 1")` and `(0, eval)(input)` each produce only the `no-eval` error. The warning separately identifies a nonliteral argument but does not prohibit additional eval forms beyond the retained core rule.

**Rationale:** A assigns the eval prohibition a consistent owner (principle 1), makes reports easier to act on (principle 2), retains the broader error-level security check (principle 3), and removes duplicate diagnostics (principle 7). See the [ESLint no-eval documentation](https://eslint.org/docs/latest/rules/no-eval) and the [Security rule documentation](https://github.com/eslint-community/eslint-plugin-security/blob/main/docs/rules/detect-eval-with-expression.md).

**Focused verification:** Eight isolated checks used ESLint 10.12.0 and the exact `detect-eval-with-expression` rule from the official `eslint-plugin-security` 4.2.0 npm archive. Both proposed configurations rejected direct dynamic, direct literal, and indirect eval calls through `no-eval`; only B added a warning for the direct dynamic case. Neither eval rule reported `JSON.parse(input)`. The temporary archive extraction was removed. These checks compare this pair only; they are not full consumer-policy validation.

**Maintainer follow-up:** Verify whether the Security check is fully covered, specifically searching for code that receives a `security/detect-eval-with-expression` report without a `no-eval` report. This is a coverage question, not approval of either D8.2 option.

**Counterexample search:** A further 84 isolated checks used ESLint 10.12.0, the exact Security 4.2.0 rule, Espree, and typescript-eslint parser 8.70.0. The corpus contained 38 JavaScript cases through each parser and eight additional TypeScript cases. It covered dynamic arguments, templates, spread arguments, literal and absent arguments, parentheses, optional calls, indirect calls, aliases, global-object access, local bindings named `eval` in non-strict sources, escaped identifiers, JSX, generic calls, assertions, and non-null expressions. All cases parsed successfully. Security reported 45 cases; every one also received a `no-eval` report. No Security-only counterexample was found with the repository's `allowIndirect: false` setting.

**Coverage reasoning:** The pinned Security implementation reports a `CallExpression` whose callee is named `eval`, with at least one argument and a nonliteral first argument. For ordinary ESTree call targets produced by the supported JavaScript and TypeScript parsers, this is an identifier named `eval`. With `allowIndirect: false`, the core rule reports every call with that identifier, without restricting the argument count, argument type, or whether the identifier is locally bound. Its predicate therefore covers the Security check in this scope. This conclusion combines source inspection with the targeted cases; it does not claim that either rule detects every possible form of dynamic code execution. For example, the tested aliased-global-object call was reported by neither rule.

**Configuration boundary:** A Security-only report does occur if `no-eval` is changed to `["error", { allowIndirect: true }]`: `eval?.(input)` is then allowed by the core rule and reported by Security. The same call receives both reports under the current explicit `false` option and the shorthand `no-eval: "error"`, whose default is `false`. A separate control confirmed that explicitly suppressing only `no-eval` also leaves the Security report. These are configuration or suppression differences, not an uncovered call under the current active rule pair. Repository searches found no existing override or inline suppression that disables only `no-eval`. Retain `allowIndirect: false` explicitly if A is selected. See the [core rule option documentation](https://eslint.org/docs/latest/rules/no-eval#allowindirect).

**Maintainer choice:** A — retain `no-eval: ["error", { allowIndirect: false }]` and set `security/detect-eval-with-expression: "off"`. Confirmed by the maintainer on 20 October 2026. The maintainer explicitly requires an ownership comment on the disabled Security rule. The implementation must include:

```ts
"security/detect-eval-with-expression": "off", // Handled by `no-eval`.
```

The source configuration has not yet been changed; this records the approved decision and its required comment for implementation.

#### D8.3: nested ternary expressions

**Current behavior:** `no-nested-ternary: "error"` rejects directly nested conditional expressions in result branches. `unicorn/no-unnecessary-nested-ternary: "error"` additionally reports reducible cases with a repeated branch expression and can automatically combine their conditions. For example, `isEnabled ? (isReady ? "ready" : "waiting") : "waiting"` receives two reports.

**Recommendation:** A — retain `no-nested-ternary: "error"` and set `unicorn/no-unnecessary-nested-ternary: "off"`, with a `Handled by no-nested-ternary` comment. Preserve the existing prohibition and give the overlapping check one owner. The core rule reports the problem but does not supply Unicorn's automatic simplification.

**Alternative:** B — retain both rules at their current error severity. Accept duplicate reports on the overlapping cases in exchange for retaining Unicorn's automatic simplification. Both alternatives keep rejecting nested result branches that cannot be simplified by this Unicorn rule; B does not relax the core prohibition.

**Example outcome:** Both alternatives accept `const label = isEnabled && isReady ? "ready" : "waiting";`. Starting from `const label = isEnabled ? (isReady ? "ready" : "waiting") : "waiting";`, A produces one report and requires a manual rewrite; B initially produces two reports, then `--fix` produces the flat expression automatically. An irreducible expression such as `isEnabled ? (isReady ? "ready" : "loading") : "disabled"` receives only the core report under either alternative.

**Rationale:** A preserves a single diagnostic owner regardless of whether the optional Unicorn feature is active (principle 1), keeps the rule policy and reports easier to maintain (principle 2), and removes overlapping diagnostics (principle 7). B retains a useful automatic fix, so this is a real capability trade-off rather than an assertion that the rules have identical behavior. See the [core rule documentation](https://eslint.org/docs/latest/rules/no-nested-ternary) and the [Unicorn rule documentation](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-unnecessary-nested-ternary.md).

**Focused verification:** Eight diagnostic comparisons and two fix runs used ESLint 10.12.0 and the exact Unicorn 77.0.0 rule with its official adapter, loaded from the npm archive in a temporary directory. The cases covered reducible and irreducible nested result branches, the flat replacement, and a conditional expression inside the condition. The last case was reported by neither rule, so the core prohibition must not be described as covering every syntactic nesting position. A supplied no automatic fix; B generated the flat replacement with no remaining reports, and a second fix run was stable. The temporary extraction was removed. These checks compare this pair only.

**Reverse-coverage follow-up:** The maintainer asked whether disabling the core rule would preserve its checks through Unicorn. It would not. An additional nine diagnostic comparisons used ESLint 10.12.0 and Unicorn 77.0.0 across core-only, both-rules, and Unicorn-only configurations. Distinct-branch nesting and a multiway status conditional were reported by the core rule but not by Unicorn. Repeated-branch nesting was reported by both. Under Unicorn-only configuration, the distinct-branch case received no report or fix, while the repeated-branch case was simplified automatically. The temporary extraction was removed.

**Coverage conclusion:** The pinned source confirms strict containment for the diagnostics: the core rule reports when either result branch is a `ConditionalExpression`; each Unicorn reporting branch requires that same condition plus equality of two branch expressions. Every Unicorn finding in this pair is therefore covered by the core predicate, while the distinct-branch counterexamples demonstrate the reverse is false. Unicorn's automatic simplification is an additional capability, not broader diagnostic coverage.

**Maintainer choice:** A — retain `no-nested-ternary: "error"` and set `unicorn/no-unnecessary-nested-ternary: "off"`. Confirmed on 20 October 2026 by the maintainer's instruction to select the rule with broader coverage and disable the other. Retain the broader diagnostic coverage and accept the loss of Unicorn's automatic simplification. The implementation must include:

```ts
"unicorn/no-unnecessary-nested-ternary": "off", // Handled by `no-nested-ternary`.
```

The source configuration has not yet been changed; this records the approved decision for implementation.

#### D8.4: unnecessary escapes in strings and regular expressions

**Coverage finding:** Neither rule fully covers the other. The core `no-useless-escape` rule checks ordinary strings, template literals, and regex literals. `regexp/no-useless-escape` checks regex patterns, including statically understood constructor patterns that the core rule does not analyze as regexes. They overlap on some regex literals but each also has unique reports. The original D8 table's proposal to disable the RegExp rule therefore loses coverage; checking ordinary strings does not by itself make the core rule a full replacement.

**Verified counterexamples with both rules enabled:**

```js
const text = "\a";
// Reported only by no-useless-escape.

const pattern = new RegExp("[\\[]", "u");
// Reported only by regexp/no-useless-escape.

const sharedPattern = /\a/;
// Reported by both rules.
```

**Recommendation:** A — retain both rules with their existing options and error severities, documenting the partial overlap and the unique coverage. Treat overlapping regex-literal reports as an intentional exception to a single-owner policy unless a supported configuration can separate the responsibilities without losing checks. Do not describe either rule as fully handled by the other.

**Alternative:** B — retain only the core rule, as the original table proposed. This keeps ordinary string and regex-literal checks but loses the demonstrated constructor-pattern report and the RegExp rule's automatic fixes.

**Additional alternative:** C — retain only the RegExp rule. This keeps its regex analysis and automatic fixes but loses ordinary string escape checks and some additional core reports. With the current options, `/[a\-]/u` is another verified core-only report; the RegExp rule does not report it.

**Rationale:** A preserves checks for equivalent regex patterns expressed through different syntax (principle 1) and useful diagnostics for ordinary string literals (principle 2). Principle 7 supports removing checks that are fully duplicated, but these counterexamples demonstrate that neither complete rule is redundant. The maintainer's broader-coverage criterion cannot select a full replacement here because the coverage sets are not contained in one another. See the [core rule documentation](https://eslint.org/docs/latest/rules/no-useless-escape) and the [RegExp rule documentation](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-useless-escape.html).

**Focused verification:** Fifteen isolated diagnostic comparisons used ESLint 10.12.0 and eslint-plugin-regexp 3.3.1, matching the repository's pinned versions. Five cases were checked under core-only, both-rules, and RegExp-only configurations: an ordinary string escape, a shared regex-literal escape, a Unicode constructor-pattern escape, an escaped hyphen in a Unicode regex literal, and a plain string. All assertions passed. This verifies the displayed coverage differences, not the complete consumer configuration.

**Maintainer choice:** A — retain `no-useless-escape` with its existing `allowRegexCharacters: []` option and `regexp/no-useless-escape`, both at error severity. Confirmed by the maintainer on 20 October 2026. Preserve their unique coverage and document the intentional partial overlap. Do not mark either complete rule as handled by the other. The rule settings remain unchanged.

**Applied comment follow-up:** At the maintainer's explicit request, add reciprocal `Complemented by` comments to both source entries. This wording describes complementary coverage without implying full replacement. The comments name the other rule and its additional scope; existing inline fixability comments are retained.

In `src/configs/core/rules/suggestions.ts`:

```ts
// Complemented by `regexp/no-useless-escape` for RegExp constructor patterns.
```

In `src/configs/plugins/regexp/rules/stylistic-issues.ts`:

```ts
// Complemented by `no-useless-escape` for string, template, and additional regex-literal checks.
```

#### D8.5: control characters in regex patterns

**Coverage finding:** The RegExp rule analyzes more statically understood pattern forms, including constant bindings and concatenations, whereas the core rule also reports some intentional string escapes that the RegExp rule allows. Neither rule is a strict superset of all reports from the other under the current options. The original proposal to use the RegExp rule remains reasonable, but it changes which constructor spellings are accepted and must not be described as identical coverage.

**Verified examples with both rules enabled:**

```js
const directPattern = /\x1F/u;
// Reported by both rules.

const source = "\\x1F";
const indirectPattern = new RegExp(source, "u");
// Reported only by regexp/no-control-character.

const intentionalTab = new RegExp("\t", "u");
// Reported only by no-control-regex.

const explicitRegexTab = new RegExp("\\t", "u");
// Reported by neither rule.
```

**Recommendation:** A — retain `regexp/no-control-character: "error"` and turn off `no-control-regex`, with a comment naming the replacement and the intentional-escape policy. Preserve analysis of constant pattern expressions and allow explicit string control escapes such as `"\t"` and `"\n"` in constructor arguments. The core documentation identifies its rejection of these spellings as a known limitation. This is an explicit acceptance-policy difference, not full diagnostic containment.

**Alternative:** B — retain both rules. This preserves the existing core requirement to write constructor tabs as `"\\t"` instead of `"\t"`, while keeping the RegExp rule's additional static analysis. Direct hexadecimal control-character patterns continue to receive duplicate reports.

**Rationale:** A treats recognizable intentional escapes consistently across regex literals and constructor strings (principle 1), reduces surprising reports (principle 2), and removes duplicate reports on the shared cases (principle 7). It also follows the preference for wider static pattern analysis while explicitly documenting the reports intentionally removed. B is appropriate if the maintainer wants the stricter constructor-spelling policy. See the [core rule's known limitation](https://eslint.org/docs/latest/rules/no-control-regex#known-limitations) and the [RegExp rule documentation](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-control-character.html).

**Focused verification:** Eleven isolated examples used ESLint 10.12.0 and eslint-plugin-regexp 3.3.1, matching the repository pins. The examples covered hexadecimal, Unicode, and code-point escapes in regex literals; literal, constant-binding, and concatenated constructor patterns; intentional tab and newline string escapes; an explicit regex tab escape; a tab escape in a regex literal; and a raw tab in a regex literal. Source inspection confirmed that the RegExp rule consults the original source spelling when allowing intentional control escapes. No parser failures occurred. These checks compare this pair only.

**Maintainer choice:** A — retain `regexp/no-control-character: "error"` and set `no-control-regex: "off"`. Confirmed by the maintainer on 20 October 2026. Explicitly allow intentional constructor string escapes such as `"\t"` and `"\n"`, while retaining the RegExp rule's static pattern analysis. The disabled core entry must document both ownership and this acceptance-policy difference:

```ts
"no-control-regex": "off", // Handled by `regexp/no-control-character`; intentional constructor control escapes are allowed.
```

No control-character rule settings have been changed yet; this records the approved implementation decision.

#### D8.6: regex performance and ReDoS checks

**Scope:** Compare `security/detect-unsafe-regex` with the combined coverage of `regexp/no-super-linear-backtracking` and `regexp/no-super-linear-move`. Retain the distinction between the two RegExp checks: backtracking explores alternative paths within a match attempt; movement repeats matching from different input positions. One sample receiving both reports does not make those two concerns interchangeable.

**Current options:** Security is a warning. The RegExp rules are errors with `report: "certain"`; the movement rule additionally has `ignorePartial: true` and `ignoreSticky: true`. Its options are not being broadened as part of either proposal below.

**Coverage finding:** The RegExp pair reports additional cases that Security misses, including adjacent quantified terms and patterns obtained from constant bindings or a `RegExp(...)` call without `new`. Security also has unique heuristic warnings, including small bounded nested repetitions and nested repetitions without a rejecting suffix. Consequently, Security is not fully handled in the literal sense of preserving every diagnostic. Turning it off is a deliberate choice to use the more specific RegExp analyses and omit the additional coarse warnings.

**Verified examples:**

```js
const shared = /(a+)+$/u;
// Both RegExp rules report; Security adds a warning.

const adjacent = /a+a+$/u;
// Both RegExp rules report; Security does not.

const moving = /a+b/u;
// Only regexp/no-super-linear-move reports.

const bounded = /^(a{1,3}){1,3}$/u;
// Only Security reports. The nested repetitions have small finite bounds.
```

**Recommendation:** A — retain both RegExp rules with their current options and turn off `security/detect-unsafe-regex`. Document a preference for the more specific checks rather than claim complete diagnostic containment. This removes the Security warning on the bounded example while retaining the demonstrated RegExp error reports. A suitable implementation comment is:

```ts
// Prefer `regexp/no-super-linear-backtracking` and `regexp/no-super-linear-move` over this coarse heuristic.
"security/detect-unsafe-regex": "off",
```

**Alternative:** B — retain all three rules at their current severities. Preserve the additional Security review warnings, including heuristic warnings on bounded patterns, and accept duplicates where the analyses overlap. This favors retaining another heuristic signal over reducing reports; it does not make a warning proof that a pattern is vulnerable.

**Rationale:** A keeps consistent analysis across literals and statically understood constructor patterns (principle 1), reduces reports caused by coarse structural heuristics (principle 2), retains both distinct RegExp risk checks (principle 3), and reduces overlapping reports (principle 7). The maintainer must explicitly accept removal of the additional Security warnings; broader analysis of some cases is not proof of complete coverage. The Security dependency [safe-regex documents false positives and false negatives](https://github.com/davisjam/safe-regex). The RegExp documentation also describes limitations and the distinction between [backtracking](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-super-linear-backtracking.html) and [movement](https://ota-meshi.github.io/eslint-plugin-regexp/rules/no-super-linear-move.html).

**Focused verification:** Twenty-four isolated static lint examples used ESLint 10.12.0, eslint-plugin-regexp 3.3.1, the exact Security 4.2.0 rule from its npm archive, and safe-regex 2.1.1, which satisfies Security's declared `^2.1.1` dependency. The examples covered rejecting and non-rejecting nested repetition, small bounded repetition, adjacent quantifiers, moving matches, a linear pattern, literal and indirect constructors, lookarounds, optional nesting, and backreferences. No parser failures occurred. Security-only warnings were observed on non-rejecting nested repetition, small bounded repetition, and optional nesting. These probes compare diagnostics; they do not benchmark runtime, prove complete detector coverage, or establish that an unreported pattern is safe. Temporary rule extractions were removed.

**Maintainer choice:** B — retain all three rules because `security/detect-unsafe-regex` is not fully handled by the RegExp pair. Confirmed by the maintainer on 20 October 2026. Preserve the current RegExp error severities and options and Security's warning severity, including its additional heuristic warnings. The maintainer explicitly requires complementary-coverage comments; do not apply the proposed Security `off` entry or its preference comment.

**Applied comments:** Added `Complemented by` comments to all three source entries. The backtracking entry names movement analysis and Security's heuristic warnings; the movement entry names backtracking analysis and Security's heuristic warnings; the Security entry names both more specific RegExp analyses. Existing fixability annotations are retained. These are comment-only source edits; no rule values, severities, or options have changed.

#### D8.7: Buffer restrictions and constructor modernization

**Policy question before selecting owners:** Should the shared configuration continue preferring `Uint8Array` over Node.js `Buffer`, or allow modern `Buffer` APIs while rejecting the deprecated constructor? These are different acceptance policies, so select the intended coding pattern before deciding which overlapping rules should remain.

**Current policy:** The core rules restrict the global `Buffer` name, including configured global-object access, and static imports from `buffer` and `node:buffer`. The TypeScript policy also restricts the `Buffer` type. Their messages prefer `Uint8Array`. Meanwhile, `unicorn/no-new-buffer` reports `new Buffer(...)` and can replace it with `Buffer.alloc(...)` or `Buffer.from(...)`. A global replacement remains prohibited by the existing global restriction.

**Recommendation:** A — retain the current API preference for `Uint8Array` and align the eventual rule owners and fixes with that goal. Preserve the approved coverage criterion: the original table's proposal to disable Unicorn must not be justified by claiming that the current core restrictions fully cover every Unicorn report. Review the remaining enforcement and fix boundaries before finalizing that implementation.

```js
const bytes = new Uint8Array(10);
```

**Alternative:** B — allow modern Node.js Buffer APIs such as `Buffer.alloc` and `Buffer.from`, while continuing to reject deprecated Buffer construction. This requires deliberately removing the Buffer-specific global, import, and TypeScript type restrictions, and then choosing the appropriate deprecation-check owners. Those formerly rejected modern API uses would become allowed by this policy.

```js
const bytes = Buffer.alloc(10);
const textBytes = Buffer.from("hello", "utf8");
```

**Rationale:** A keeps the preferred coding pattern consistent with the current global, import, and type policies (principle 1) and gives consumers one clear API convention (principle 2). B accommodates Node-specific Buffer capabilities. Both `Uint8Array` and modern Buffer APIs can be valid choices; do not describe `Buffer.alloc` or `Buffer.from` as deprecated merely because this configuration currently restricts them. Under either policy, fixes must move toward the selected permitted form rather than another prohibited form.

**Coverage boundary:** An isolated dynamic import, `const { Buffer } = await import("node:buffer"); const bytes = new Buffer(10);`, was reported by Unicorn but not by the two core restrictions. Conversely, global `Buffer.alloc(...)`, `Buffer(...)`, and `globalThis.Buffer` usage were reported by the global restriction but not by Unicorn. Static imports were rejected by the import restriction, including an aliased import that the name-based Unicorn constructor check did not report. These comparisons establish that neither side fully replaces the other in isolation; they do not evaluate the combined coverage of every enabled Node or Security rule.

**Fix boundary:** With the current three-rule combination, fixing global `new Buffer(10)` produced `Buffer.alloc(10)`, leaving the global restriction report. A separate local-class example, `class Buffer {} const bytes = new Buffer(10);`, was also matched by Unicorn and rewritten to `Buffer.alloc(10)` despite the class defining no such method. This demonstrates a name-based matching and fix-safety boundary that must be considered when selecting or retaining the constructor rule; the absence of remaining reports from this isolated combination does not establish correctness.

**Focused verification:** Nine diagnostic examples and two fix runs used ESLint 10.12.0 and the exact Unicorn 77.0.0 rule with its official adapter. The cases covered global construction, a modern global API, a global function call, global-object access, static and aliased imports, a dynamic import, a locally defined class, and Uint8Array construction. All examples parsed. Assertions confirmed the dynamic-import coverage difference and the still-prohibited global autofix result. Temporary extraction was removed. Other Node, Security, and TypeScript rules were outside these isolated probes. See the official [global restriction rule](https://eslint.org/docs/latest/rules/no-restricted-globals), [import restriction rule](https://eslint.org/docs/latest/rules/no-restricted-imports), and [Unicorn constructor rule](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-new-buffer.md) documentation.

**Maintainer choice:** A — retain the Uint8Array preference and the existing Buffer global, static-import, and TypeScript type restrictions. Confirmed by the maintainer on 20 October 2026. Constructor-check ownership is also confirmed as A in the follow-up below. Buffer runtime settings remain unchanged during decision gathering.

##### D8.7 follow-up: constructor-check ownership

**Additional coverage finding:** Enabling the existing `n/no-deprecated-api` and `security/detect-new-buffer` rules does not eliminate the demonstrated dynamic-import gap. In `const { Buffer } = await import("node:buffer"); const bytes = new Buffer(10);`, only Unicorn reports among the existing core, Node, and Security checks under comparison. With a variable argument, both Unicorn and Security report. The Node rule does report statically tracked imports, CommonJS imports and aliases, and global constructor use. Keep its wider deprecation coverage; it is not a complete replacement for either name-based constructor check.

**Recommendation:** A — use a focused native `no-restricted-syntax` selector to own direct `new Buffer(...)` checks, retain the existing global/import/type restrictions and Node deprecation rule, and disable the two superseded constructor checks with ownership comments. The selector reports the violation without supplying an automatic fix or editor suggestion toward another prohibited Buffer API. Merge this selector with the eventual D3 syntax restrictions rather than overwrite them.

```ts
// Reject direct Buffer construction without suggesting another restricted Buffer API.
"no-restricted-syntax": [
  "error",
  {
    selector: "NewExpression[callee.type='Identifier'][callee.name='Buffer']",
    message: "Use Uint8Array instead.",
  },
],
"unicorn/no-new-buffer": "off", // Handled by `no-restricted-syntax`; Buffer API autofixes conflict with the Uint8Array policy.
"security/detect-new-buffer": "off", // Handled by `no-restricted-syntax` for direct Buffer construction, including non-literal arguments.
```

**Alternative:** B — retain the existing Unicorn error and Security warning along with the global/import/type restrictions and Node deprecation rule. This preserves the existing constructor diagnostics, automatic fixes, and editor suggestions. On global numeric construction, Unicorn's automatic fix still produces `Buffer.alloc(10)`, which the global restriction rejects. No native replacement selector is introduced for Buffer under B.

```js
// Input under either choice.
const bytes = new Buffer(10);
```

Under A, the source is reported with `Use Uint8Array instead.` and remains unchanged by `--fix`. The developer chooses the appropriate Uint8Array conversion deliberately:

```js
const bytes = new Uint8Array(10);
```

Under B, Unicorn's `--fix` produces the following source and the global restriction still reports it:

```js
const bytes = Buffer.alloc(10);
```

**Coverage proof and boundaries:** Unicorn 77.0.0 visits `NewExpression` nodes and its `isNewExpression` helper, called with `{ name: "Buffer" }` and no argument limits, requires an Identifier callee named `Buffer`. The selector expresses the same diagnostic condition. Security 4.2.0 checks the same direct callee name and additionally requires a non-literal first argument, so its supported JavaScript/TypeScript matches are contained by the selector. This justifies disabling these two rules under A; it does not justify the original table's claim that the global restriction alone replaces Unicorn. All three name-based checks also report a custom local class named `Buffer`; A removes the demonstrated unsafe automatic rewrite of that class but does not add semantic recognition of Node's Buffer. An aliased dynamic import such as `const { Buffer: NodeBuffer } = await import("node:buffer"); new NodeBuffer(input);` is outside the checks compared here under both choices. TypeScript assertions around the callee are another shared name-matching limitation. Neither choice proves a complete program-wide Buffer prohibition.

**Rationale:** A gives direct constructor syntax one policy-aligned owner in place of the two constructor rules and avoids an automatic rewrite to a forbidden API (principles 1 and 2). The retained global, import, and Node checks can still produce overlapping reports; this proposal does not promise one total report per occurrence. It retains the constructor checks' diagnostic coverage, including Security's non-literal-argument cases (principle 3), and removes redundant constructor owners using an existing native rule (principle 7). This is a small, explicit syntax restriction with no custom plugin or new dependency. The developer must select a semantically correct replacement: a blanket Buffer-to-Uint8Array rewrite is not safe for every constructor overload or surrounding use. The retained Node rule supplies deprecation messages rather than automatic fixes, and its suggested Buffer alternatives do not override the approved API restriction.

**Focused verification:** Fifty isolated diagnostic comparisons used ESLint 10.12.0, typescript-eslint parser 8.70.0, eslint-plugin-n 18.4.1, and the exact Unicorn 77.0.0 and Security 4.2.0 rules from their npm archives. Twenty-four cases ran as both JavaScript and TypeScript, and two additional TypeScript cases checked type arguments and an asserted callee. Every Unicorn-positive case (29) and Security-positive case (17) had a selector report at the same starting position. Four fix runs with the proposed replacement retained the original source and the policy diagnostic. All assertions passed and no parser failures occurred. The probes covered the relevant rule combination, not the full composed configuration, and did not execute the sample programs. Temporary extractions were removed. See the official [syntax restriction](https://eslint.org/docs/latest/rules/no-restricted-syntax), [Security constructor check](https://github.com/eslint-community/eslint-plugin-security/blob/main/docs/rules/detect-new-buffer.md), and [Node deprecation check](https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-deprecated-api.md) documentation.

**Maintainer choice:** A — replace the two direct Buffer constructor checks with the native syntax restriction while retaining the other API and deprecation checks described above. Confirmed by the maintainer on 20 October 2026, with an explicit request to add comments. The approved configuration example includes an explanation above the native owner and `Handled by` comments on both disabled entries, including the autofix conflict and non-literal-argument coverage. Preserve these English comments when implementing the decision. The replacement settings and comments are recorded here for the implementation phase; Buffer runtime source entries have not yet changed.

#### D8.8: await versus promise chaining

**Coverage finding:** Neither rule fully covers the other with the current settings. Unicorn 77.0.0 reports chains that Promise 7.3.0 with `strict: false` permits, including awaited or yielded chains, constructor bodies, top-level chains, statically computed method names, and untyped Cypress-style chains. Promise additionally reports chains explicitly discarded with `void` inside functions, which Unicorn intentionally permits. With TypeScript type information, Promise can also report methods known not to be promise methods; Unicorn deliberately skips those known non-promise receivers. The original corpus observation that all 45 Promise reports were also Unicorn reports does not establish complete containment.

| Example context                                                            | Unicorn         | Promise (`strict: false`) |
| -------------------------------------------------------------------------- | --------------- | ------------------------- |
| Return `task.then(consume)` from a function                                | Reports         | Reports                   |
| `await task.then(consume)` inside an async function                        | Reports         | Does not report           |
| `void task.catch(handleError)` inside a function                           | Does not report | Reports                   |
| Top-level `task.then(consume)`                                             | Reports         | Does not report           |
| Top-level `void task.catch(handleError)`                                   | Does not report | Does not report           |
| Return `task["then"](consume)` from a function                             | Reports         | Does not report           |
| Return a known non-promise object's `catch()` result from a typed function | Does not report | Reports                   |

**Recommendation:** A — retain both rules at their current error severities and keep Promise's `strict: false` setting, with complementary-coverage comments. This recommendation follows the maintainer's requirement to preserve unique diagnostic coverage when no complete replacement has been established. It retains the additional Promise reports and accepts duplicates on ordinary chains, as well as the existing scope exceptions and method-name false positives described below. It does not classify every additional report as a genuine promise problem.

```ts
// Complemented by `promise/prefer-await-to-then` for void-discarded chains inside functions.
"unicorn/prefer-await": "error",
// Complemented by `unicorn/prefer-await` for awaited, yielded, constructor, top-level, and statically computed chains.
"promise/prefer-await-to-then": ["error", { strict: false }],
```

**Alternative:** B — retain Unicorn and disable Promise's await-preference rule, explicitly accepting Unicorn's intentional `void` opt-out and known-non-promise exclusions. This removes Promise-only reports, including its method-name false positives, and overlapping reports on ordinary chains. It is an acceptance-policy change rather than a fully covered replacement. Keep other Promise rules and type-aware promise-safety checks unchanged.

```ts
"unicorn/prefer-await": "error",
// Prefer `unicorn/prefer-await`; allow explicit void opt-outs and known non-promise methods.
"promise/prefer-await-to-then": "off",
```

**Compared outcomes:** Both choices reject the awaited callback chain below through Unicorn. Prefer a direct await followed by ordinary code when the operation should be awaited.

```js
const load = async () => {
  await task.then(consume);
};
```

```js
const load = async () => {
  const value = await task;
  consume(value);
};
```

The next example is rejected only under A. B intentionally permits the explicit `void` opt-out from this await-preference check. This describes these two rules, not acceptance by every rule in the composed configuration.

```js
const start = () => {
  void task.catch(handleError);
};
```

**Heuristic and semantic boundaries:** Promise checks property identifier names rather than TypeScript promise types. In a typed fixture, `const store = { catch: () => { return 1; } }; const read = () => { return store.catch(); };` produced only a Promise report even though the receiver was known not to be a promise. A computed method whose key variable is named `then` but contains `"save"` was another Promise-only false positive. Without type information, Unicorn also uses method-name heuristics. Retaining both rules preserves these limitations; it does not establish a uniform ban on every chain, as the top-level `void` example shows. Constructors cannot be made async, and converting a detached operation to an awaited one changes when its enclosing operation completes. Use an appropriate async helper or initialization promise where required, preserve error handling, and do not claim that a blanket rewrite is semantics-preserving. The current core `no-void` permits standalone void statements; other composed-rule interactions remain implementation checks.

**Rationale:** A preserves the currently requested diagnostic coverage and await-oriented coding policy (principles 1 and 2), accepting redundant reports and some name-based noise. B provides a clearer boundary for intentional detached work and typed non-promise APIs and reduces duplicate diagnostics (principles 2 and 7), but requires explicit approval of the lost Promise-only reports under the maintainer's coverage criterion. Neither choice is proof of complete promise error handling or asynchronous safety.

**Focused verification:** Twenty-six isolated comparisons used ESLint 10.12.0, Promise 7.3.0, and the exact Unicorn 77.0.0 rule with its official adapter. Twenty JavaScript fixtures covered return chains, awaited/yielded chains, constructors, module-level chains, `void`, nested chains, computed names, optional calls, Cypress-style chains, a plain await, and an untyped non-promise method. Six additional fixtures used typescript-eslint parser 8.70.0 and a TypeScript 6.0.3 program with no compiler diagnostics to verify promise and non-promise receivers. Seven fixtures were reported by both rules, nine only by Unicorn, seven only by Promise, and three by neither. All final assertions passed; configuration warnings and parser failures were rejected by the harness. These checks compare the two rules, not the entire consumer policy, and did not execute the fixture programs. Temporary files were removed. See the versioned [Unicorn documentation](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v77.0.0/docs/rules/prefer-await.md) and [Promise documentation](https://github.com/eslint-community/eslint-plugin-promise/blob/v7.3.0/docs/rules/prefer-await-to-then.md).

**Maintainer choice:** A — retain both await-preference rules at their current error severities, retain Promise's `strict: false` option, and add complementary-coverage comments. Confirmed by the maintainer on 20 October 2026. This retains the documented Promise-only reports, including `void`-discarded chains inside functions, and accepts the documented duplicate reports and heuristic limitations.

**Applied comments:** Added the proposed English `Complemented by` comments above both source entries. Unicorn's comment names Promise's additional checks of void-discarded chains inside functions. Promise's comment names Unicorn's checks of awaited, yielded, constructor, top-level, and statically computed chains. Unicorn's existing editor-suggestion annotation is preserved. These are comment-only source changes; rule values, severities, and options are unchanged.

#### D8.9: explicit array-sort comparators

**Coverage finding:** Neither current rule fully covers the other. Unicorn 77.0.0 checks ordinary `.sort()` and `.toSorted()` calls in JavaScript and TypeScript, including string arrays and an explicit `undefined` comparator. The TypeScript 8.70.0 rule is enabled only in the type-aware scope and uses `ignoreStringArrays: true`; it additionally reports computed method access and optional calls that Unicorn skips. Disabling the TypeScript rule as proposed in the original ownership table would therefore remove distinct comparator diagnostics.

| Typed example                                                       | Unicorn         | TypeScript (`ignoreStringArrays: true`) |
| ------------------------------------------------------------------- | --------------- | --------------------------------------- |
| `[10, 2, 1].sort()` or `.toSorted()`                                | Reports         | Reports                                 |
| `["b", "a"].sort()`                                                 | Reports         | Does not report                         |
| `[10, 2, 1].sort(undefined)`                                        | Reports         | Does not report                         |
| `[10, 2, 1]["sort"]()`                                              | Does not report | Reports                                 |
| `values[method]()` with a numeric array and `const method = "sort"` | Does not report | Reports                                 |
| `[10, 2, 1].sort?.()`                                               | Does not report | Reports                                 |
| Numeric array with an explicit numeric comparator                   | Does not report | Does not report                         |
| `Uint8Array` or `BigInt64Array` sorting without a comparator        | Does not report | Does not report                         |

**Recommendation:** A — retain both rules with the current settings and add complementary-coverage comments. Keep the TypeScript rule active only where type information is available and preserve its existing untyped-scope `off` entry. This follows the maintainer's no-loss coverage criterion and retains a clear preference for explicit comparator intent, accepting duplicate reports on ordinary typed numeric arrays.

```ts
// Complemented by `@typescript-eslint/require-array-sort-compare` for computed access and optional calls with type information.
"unicorn/require-array-sort-compare": "error",
// Complemented by `unicorn/require-array-sort-compare` for string arrays, explicit undefined comparators, and untyped files.
"@typescript-eslint/require-array-sort-compare": ["error", { ignoreStringArrays: true }],
```

**Alternative:** B — retain Unicorn as the only comparator-rule owner and disable the TypeScript counterpart, explicitly accepting the lost computed-access and optional-call comparator reports. Unicorn still checks ordinary calls in JavaScript and TypeScript, including string arrays and explicit `undefined` arguments. This is not complete replacement coverage. Type-aware linting remains enabled for the other rules.

```ts
// Prefer `unicorn/require-array-sort-compare`; accept its computed-access and optional-call gaps.
"@typescript-eslint/require-array-sort-compare": "off",
```

**Compared outcomes:** Both choices reject the ordinary numeric example through Unicorn. Default array sorting compares string representations; the small runtime check below produced the shown order.

```js
const values = [10, 2, 1].toSorted();
// Result: [1, 10, 2]. Both choices report the missing comparator.
```

The explicit comparator makes the intended numeric ordering clear. Both comparator rules accept this example.

```js
const values = [10, 2, 1].toSorted((left, right) => {
  return left - right;
});
// Result: [1, 2, 10].
```

This typed example is reported under A through the TypeScript rule, but neither comparator rule reports it under B:

```ts
const values = [10, 2, 1];
values["toSorted"]();
```

**Boundaries:** These comparisons isolate the comparator rules; other composed rules may report the same source for separate reasons. JavaScript files outside the type-aware scope retain Unicorn's computed-access and optional-call gaps under both choices. Both rules skipped `values.sort(void 0)` and a TypeScript non-null assertion on the method, `values.sort!()`, in the probes. Neither combination proves an exhaustive comparator prohibition across all expression shapes. Both skipped the tested custom non-array method and the tested `Uint8Array`/`BigInt64Array` receivers. Numeric `TypedArray` sorting already has numeric ordering, so the array string-coercion rationale must not be applied to it. Choose a comparator appropriate to the element type and required ordering; numeric subtraction is not a universal comparator, and changing an intentional lexicographic order is a behavior change. Unicorn's editor suggestions use concise arrow bodies; implementing D3 must verify that subsequent formatting and lint fixes converge to the approved block-body convention.

**Rationale:** A preserves the existing explicit-sort policy across the available source scopes and retains each rule's distinct diagnostics (principles 1 and 2), accepting redundant reports (principle 7). B reduces duplicate diagnostics but requires explicit acceptance of the narrower comparator coverage under the maintainer's criterion. Neither option requires a new rule implementation or dependency, and neither justifies disabling unrelated type-aware checks.

**Focused verification:** Twenty-two typed comparisons used ESLint 10.12.0, typescript-eslint parser/plugin 8.70.0, TypeScript 6.0.3, and the exact Unicorn 77.0.0 rule with its official adapter. The TypeScript program had no compiler diagnostics. Five fixtures were reported by both rules, seven only by Unicorn, four only by TypeScript, and six by neither. The fixtures included `.sort`/`.toSorted`, numeric/string arrays and tuples, explicit comparators, `undefined`, `void 0`, computed names, optional calls/access, nullable and `any` receivers, unions, readonly arrays, custom non-array methods, typed-array receivers, and a non-null assertion around the method. Eight additional JavaScript checks verified Unicorn's applicable coverage and boundaries without type services. Configuration warnings and parser failures were rejected by the harness. A small deterministic runtime check confirmed the two numeric output arrays shown above. All final assertions passed, and temporary extractions were removed. This is focused rule verification, not full composed-policy validation. See the official [TypeScript rule documentation](https://typescript-eslint.io/rules/require-array-sort-compare/) and versioned [Unicorn documentation](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/v77.0.0/docs/rules/require-array-sort-compare.md).

**Maintainer choice:** A — retain both array-sort comparator rules with their current settings and scopes and add complementary-coverage comments. Confirmed by the maintainer on 20 October 2026. Preserve the TypeScript rule's `ignoreStringArrays: true` option and its existing untyped-scope `off` entry. This retains the documented unique reports and accepts overlapping reports on ordinary typed numeric arrays.

**Applied comments:** Added the proposed English `Complemented by` comments above both active source entries. Unicorn's comment names TypeScript's computed-access and optional-call checks with type information. TypeScript's comment names Unicorn's checks of string arrays, explicit `undefined` comparators, and untyped files. Unicorn's existing editor-suggestion annotation is preserved. These are comment-only source changes; rule values, severities, options, and scope composition are unchanged.

#### D8.10: RegExp execution preference and fix safety

**Coverage finding:** Neither rule fully covers the other. RegExp 3.3.1 checks ordinary `.match(...)` calls in JavaScript and TypeScript, including cases where the pattern or its flags cannot be statically evaluated. TypeScript 8.70.0 additionally reports statically computed member access such as `text["match"](/a/u)` and provides automatic fixes. The original recommendation to use RegExp alone must not be described as complete diagnostic containment.

| Typed example                                                           | RegExp          | TypeScript         |
| ----------------------------------------------------------------------- | --------------- | ------------------ |
| `"aba".match(/a/u)`                                                     | Reports, no fix | Reports with a fix |
| `"aba".match(/a/gu)`                                                    | Does not report | Does not report    |
| `"aba"["match"](/a/u)`                                                  | Does not report | Reports with a fix |
| `"aba"[method](/a/u)` with `const method = "match"`                     | Does not report | Reports with a fix |
| String receiver and a RegExp parameter whose flags are unknown          | Reports, no fix | Does not report    |
| String receiver and `new RegExp(pattern, "gu")` with a string parameter | Reports, no fix | Does not report    |
| String receiver and `new RegExp(source)` with a RegExp parameter        | Reports, no fix | Reports with a fix |

**Verified fix-safety finding:** TypeScript's syntactic proof helper treats a direct `new RegExp(...)` expression with no second argument as non-global. However, constructing a RegExp from another RegExp without overriding its flags inherits those flags. For a RegExp parameter, the original `.match(...)` can therefore collect all global matches, while the reported automatic fix to `.exec(...)` returns only the first match. The following case was reproduced with the pinned rule, and a small runtime check confirmed the changed array elements:

```ts
const read = (text: string, source: RegExp) => {
  return text.match(new RegExp(source));
};
// Array elements from read("aba", /a/gu): ["a", "a"].
```

```ts
// Output produced by the TypeScript rule's automatic fix:
const read = (text: string, source: RegExp) => {
  return new RegExp(source).exec(text);
};
// Array elements from read("aba", /a/gu): ["a"].
```

**Recommendation:** A — retain `regexp/prefer-regexp-exec` and temporarily disable `@typescript-eslint/prefer-regexp-exec` with an explicit fix-safety comment, pending verification of a corrected rule. This prevents the reproduced automatic rewrite from this rule while retaining ordinary `.match(...)` diagnostics in JavaScript and TypeScript. Explicitly accept the loss of the two demonstrated computed-access diagnostics and the TypeScript automatic fixes. This is an individual exception to the maintainer's no-loss coverage criterion, confirmed below; it does not establish complete replacement coverage.

```ts
// Unknown flags can cause false positives; preserve global-match semantics during manual fixes.
"regexp/prefer-regexp-exec": "error",
// Temporarily disabled: this autofix can change results when RegExp inherits global flags.
// Prefer manual review with `regexp/prefer-regexp-exec`; computed-access reports are not fully covered.
"@typescript-eslint/prefer-regexp-exec": "off",
// Prefer `regexp/prefer-regexp-exec` for manual review of non-global match rewrites.
"sonarjs/prefer-regexp-exec": "off",
```

Apply the TypeScript `off` policy and its reason comments to the active typed scope as well as the existing untyped fallback, and keep type-aware linting active for other rules. Update the existing `sonarjs/prefer-regexp-exec` disabled-entry comment, which currently names the TypeScript rule as its owner, to the policy reason shown above. The SonarJS rule remains off; do not redirect its ownership comment to a disabled owner or assert unverified complete coverage. Revisit the lost computed-access diagnostics after a corrected fix has been verified.

**Alternative:** B — retain both rules at their current severities and scopes, with complementary-coverage comments. This preserves the computed-access diagnostics and existing TypeScript autofixes, including the demonstrated behavior-changing fix. The TypeScript rule has no option for disabling only its autofix. Keeping both unchanged does not resolve the reproduced fix-safety issue; any future proposal to preserve diagnostics while removing or correcting fixes must be reviewed as a separate implementation change.

```ts
// Complemented by `@typescript-eslint/prefer-regexp-exec` for computed access and automatic fixes.
"regexp/prefer-regexp-exec": "error",
// Complemented by `regexp/prefer-regexp-exec` for untyped code and calls with unresolved regex flags.
"@typescript-eslint/prefer-regexp-exec": "error",
```

**Compared outcomes:** Under A, the first `read` example still receives a RegExp diagnostic but is not rewritten automatically by these two rules. Under B, it receives both diagnostics and the TypeScript fix changes the demonstrated global-match result. For ordinary known non-global regexes, both alternatives prefer the same explicit execution form:

```js
const match = /a/u.exec("aba");
// First matched text: "a". Neither rule reports this form.
```

For a typed computed call, A removes the TypeScript-only preference report while B retains it:

```ts
const match = "aba"["match"](/a/u);
```

**Manual-review boundary:** The retained RegExp rule is not a fix-safety or semantic-equivalence checker. It can report an intended global match when the full RegExp value cannot be statically evaluated, including the dynamic-pattern constructor with explicit `"gu"` flags shown in the table. Do not turn such reports into a blanket `.match`-to-`.exec` migration. Preserve intentional all-match behavior and use a targeted, explanatory suppression for a verified false positive where necessary. An invalid string pattern was another RegExp-only report in the probes; it was not treated as a safe migration. Both rules skipped the tested custom non-string `.match` method, `any` receiver, and non-null assertion around the method. Full composed-policy interactions remain implementation checks.

**Rationale:** A prioritizes a verified behavior-preservation problem over deduplicating diagnostics or claiming broader coverage (principles 1 and 2). It accepts a specific, documented coverage loss to avoid an automatic transformation that changes returned data. B follows the prior no-loss preference but retains the verified automatic-fix defect. Neither option makes all RegExp preference reports valid or removes the need to verify flags and required result shape. The documentation's performance rationale was not benchmarked and is not used to justify changing semantics.

**Focused verification:** Twenty-four typed comparisons used ESLint 10.12.0, RegExp 3.3.1, typescript-eslint parser/plugin 8.70.0, and TypeScript 6.0.3. The TypeScript program had no compiler diagnostics. Ten fixtures were reported by both rules, six only by RegExp, two only by TypeScript, and six by neither. Six additional JavaScript checks exercised RegExp coverage without type services. Four fix inspections covered an ordinary literal, computed access, a string pattern, and the inherited-flags reproduction. Runtime assertions confirmed different global-match array elements before and after the inherited-flags fix and equal results for the tested non-global input. All assertions passed; configuration warnings and parser failures were rejected by the harness, and temporary files were removed. This is focused rule and fix verification, not full composed-policy validation. See the official [RegExp rule documentation](https://ota-meshi.github.io/eslint-plugin-regexp/rules/prefer-regexp-exec.html) and [TypeScript rule documentation](https://typescript-eslint.io/rules/prefer-regexp-exec/).

**Maintainer choice:** A — retain the RegExp execution-preference rule and temporarily disable the TypeScript counterpart to prevent the reproduced behavior-changing autofix. Confirmed by the maintainer on 20 October 2026, with an explicit request for reason comments. The maintainer accepts the documented loss of computed-access preference reports and automatic fixes as an individual coverage exception. Preserve the English comments in the approved configuration example, including the inherited-global-flags reason and incomplete-coverage qualification, when implementing both TypeScript policy entries. The settings and comments are recorded here for the implementation phase; execution-preference runtime entries have not yet changed.

#### D8.11: Unicode-aware regular expressions

**Coverage finding:** Neither rule fully covers the other. Core `require-unicode-regexp` requires either `u` or `v` on ordinary regex literals and statically tracked RegExp constructions, whether or not the pattern contains Unicode-specific constructs. SonarJS `unicode-aware-regex` detects particular Unicode constructs used without Unicode mode. With TypeScript type information, its regex-rule template also analyzes implicit string patterns passed to methods such as `.match(...)` and `.search(...)`; the core flag rule does not analyze those implicit constructions. The original proposal to disable SonarJS therefore loses distinct Unicode diagnostics.

| Example                                                      | Core            | SonarJS         |
| ------------------------------------------------------------ | --------------- | --------------- |
| `/abc/`                                                      | Reports         | Does not report |
| `/\p{L}/`                                                    | Reports         | Reports         |
| `new RegExp("\\p{L}")`                                       | Reports         | Reports         |
| `/\p{L}/u` or `/\p{L}/v`                                     | Does not report | Does not report |
| `"A".match("\\p{L}")` with type information                  | Does not report | Reports         |
| `"A".search("\\p{L}")` with type information                 | Does not report | Reports         |
| The same implicit string-pattern calls without type services | Does not report | Does not report |

**Recommendation:** A — retain both current error entries and their existing file/type-aware scopes, with complementary-coverage comments. Keep core's `requireFlag` unspecified so either `u` or `v` satisfies the existing policy. This preserves the additional implicit-pattern diagnostics and the general flag requirement, accepting duplicates where the checks overlap. It follows the maintainer's no-loss coverage criterion and does not claim exhaustive Unicode validation.

```ts
// Complemented by `sonarjs/unicode-aware-regex` for implicit string patterns when type information is available.
"require-unicode-regexp": ["error", { requireFlag: undefined }],
// Complemented by `require-unicode-regexp` for general flag enforcement on regex literals and constructors.
"sonarjs/unicode-aware-regex": "error",
```

Retain core's existing inline warning that adding a flag can change matching behavior and its editor-suggestion annotation. Keep the two existing RegExp-plugin Unicode-mode rules disabled. Their policy-reason comments now prefer core's reviewed Unicode-mode suggestions and explain that either `u` or `v` is permitted rather than requiring `v` everywhere. These comments do not assert unverified full diagnostic containment.

**Alternative:** B — retain core as the only Unicode-flag rule owner and disable SonarJS's counterpart. The general `u`/`v` requirement remains, but the demonstrated Unicode reports on implicit string patterns are removed. This is an explicit coverage reduction, not a fully handled replacement.

```ts
// Prefer `require-unicode-regexp`; accept the loss of implicit string-pattern Unicode diagnostics.
"sonarjs/unicode-aware-regex": "off",
```

**Compared outcomes:** In a TypeScript file with type services, the following receives a SonarJS Unicode report under A. Under B, neither of these two rules reports it. Other composed rules can still report the source for separate reasons.

```ts
const match = "A".match("\\p{L}");
// Result: null. The string pattern is interpreted without Unicode mode.
```

Both choices accept this explicit Unicode-aware form, which also follows the approved execution-preference convention:

```ts
const match = /\p{L}/u.exec("A");
// First matched text: "A".
```

**Migration and coverage boundaries:** Unicode mode changes matching semantics; it is not a formatting-only transformation. Runtime checks confirmed `/^.$/.test("😀")` is false while `/^.$/u.test("😀")` is true. Adding a mode can also invalidate legacy patterns or change case folding. Keep the current review requirement and avoid blanket flag insertion. Core reported `new RegExp(/abc/u)` despite the constructor inheriting an existing Unicode flag; review actual inherited flags before changing constructor code. Both rules skipped the tested explicit `undefined` flag argument, unresolved flag parameter, and computed implicit `.match` access. SonarJS's implicit-pattern analysis required type services in the probes. Neither A nor B closes these shared or untyped-code gaps.

**Rationale:** A preserves a consistent general Unicode-mode policy and catches Unicode intent hidden in supported implicit string patterns (principles 1 and 2), accepting overlapping reports (principle 7). B reduces reports at the cost of that distinct coverage. Either `u` or `v` remains permitted; choosing one flag universally would be a separate policy change requiring runtime and syntax compatibility review.

**Focused verification:** Forty isolated lint checks used ESLint 10.12.0, the exact SonarJS 4.2.2 S5867 rule and its helpers from the published npm archive, typescript-eslint parser 8.70.0, and TypeScript 6.0.3. The probe used regexpp 4.12.2 and lodash.merge 4.6.2, satisfying SonarJS's declared ranges; temporary packages were extracted outside the checkout and removed afterward. Twenty-one checks ran with a TypeScript program: four were reported by both rules, six only by core, three only by SonarJS, and eight by neither. The program produced two expected semantic diagnostics for intentionally non-Unicode regex literals containing Unicode-specific syntax; those fixtures still parsed, and no compiler diagnostics were attributed to the implicit string-pattern examples. Nineteen additional checks ran without type services and demonstrated the implicit-pattern coverage boundary. The harness rejected configuration warnings and parser failures. Small runtime assertions confirmed the two match results and the surrogate-pair example shown above. All assertions passed. This is focused rule verification, not full composed-policy validation. See the official [ESLint documentation](https://eslint.org/docs/latest/rules/require-unicode-regexp); the exact SonarJS implementation was read from its [published 4.2.2 source archive](https://registry.npmjs.org/eslint-plugin-sonarjs/-/eslint-plugin-sonarjs-4.2.2.tgz).

**Maintainer choice:** A — retain both current Unicode-rule error entries, their existing scopes, and core's unspecified `requireFlag`, so either `u` or `v` remains permitted. Confirmed by the maintainer on 20 October 2026. Preserve the additional typed implicit-pattern diagnostics and accept duplicate reports where the checks overlap.

**Applied comments:** Added English `Complemented by` comments above the active core and SonarJS entries, describing implicit string patterns with type information and general flag enforcement respectively. Core's existing matching-behavior warning and editor-suggestion annotation remain intact. Updated the two disabled RegExp-plugin Unicode-rule reason comments to match the actual policy, preserving their capability annotations. All four edits are comments only; rule values, severities, options, and scopes are unchanged.

#### D8.12: default branches and typed switch exhaustiveness

**Current policy:** Both rules remain necessary for different checks. Core `default-case` enforces a default branch or an accepted omission comment without type information. TypeScript's `switch-exhaustiveness-check` identifies missing literal/enum cases, and the current `considerDefaultExhaustiveForUnions: false` setting keeps that check active even when a default branch exists. The ownership question is whether to retain TypeScript's additional `requireDefaultForNonUnion: true` setting or set it to false as originally proposed.

**Coverage finding:** Core does not fully cover TypeScript's non-union default requirement. Core skips switches with no cases. Its built-in omission marker accepts capitalization variants of `no default`, whereas the configured TypeScript `defaultCaseCommentPattern: "^no default$"` is case-sensitive. With `requireDefaultForNonUnion: true`, TypeScript therefore reports empty broad-type switches and broad-type switches ending in `// NO DEFAULT` or `// No Default` that core permits. Setting the option to false removes these reports as well as duplicates on ordinary missing-default cases. Neither rule fully replaces the other overall.

**Recommendation:** A — retain both rules and all current settings, including `requireDefaultForNonUnion: true`, and add complementary-coverage comments. This follows the maintainer's no-loss criterion and preserves the additional default requirements, accepting overlapping default reports and the current stricter omission-marker behavior in typed code.

```ts
// Complemented by `@typescript-eslint/switch-exhaustiveness-check` for missing typed literal and enum cases.
"default-case": ["error", { commentPattern: undefined }],
// Complemented by `default-case` for untyped switches and general default-or-comment enforcement.
"@typescript-eslint/switch-exhaustiveness-check": [
  "error",
  {
    allowDefaultCaseForExhaustiveSwitch: true,
    considerDefaultExhaustiveForUnions: false,
    defaultCaseCommentPattern: "^no default$",
    requireDefaultForNonUnion: true,
  },
],
```

**Alternative:** B — retain both rules but set only `requireDefaultForNonUnion: false`, assigning ordinary default-or-comment enforcement to core while keeping TypeScript's literal/enum exhaustiveness analysis. Preserve all other options, including `allowDefaultCaseForExhaustiveSwitch: true`, so the TypeScript rule does not reject defaults required by core. This reduces duplicate reports and adopts core's existing case-insensitive omission marker, but explicitly accepts its empty-switch gap. It is not complete diagnostic containment.

```ts
// General fallback checks use `default-case`; its empty-switch and comment-case behavior is accepted.
requireDefaultForNonUnion: false,
```

**Compared outcomes:** An ordinary switch over `string` without a default receives two reports under A and one under B. Both alternatives still reject it.

```ts
const processState = (state: string) => {
  switch (state) {
    case "ready":
      break;
  }
};
```

For the next typed switch, A produces one TypeScript report for a missing default and B produces no report from these two rules. The comment does not count as an omission marker. Other composed rules can independently reject the source.

```ts
const processState = (state: string) => {
  switch (state) {
    // No cases are supported yet.
  }
};
```

Both choices continue to report a missing `"failed"` case in this example, despite the existing default:

```ts
const describeState = (state: "ready" | "failed") => {
  switch (state) {
    case "ready":
      return "Ready";
    default:
      return "Other";
  }
};
```

**Comment and scope boundaries:** An intentional omission comment must follow the final case. Lowercase `// no default` is accepted by both current checks for a broad string switch; capitalization variants are accepted only by core with these options. Such a comment does not excuse missing literal/enum branches while `considerDefaultExhaustiveForUnions` remains false. Even an exhaustive typed union still needs a default or accepted omission comment to satisfy core. TypeScript's rule remains enabled only with type information, so its extra empty-switch and exact-marker checks do not apply in untyped code. Retaining A does not harmonize that pre-existing scope difference. The probes isolate these two rules; neither the empty-switch example nor an omission marker is a promise of acceptance by all configured rules. Editor suggestions add branch placeholders that require deliberate implementation, not automatic acceptance as correct fallback behavior.

**Rationale:** A preserves the currently requested coverage and makes both fallback intent and missing typed cases visible (principles 1 and 2), accepting duplicate default reports (principle 7). B has a simpler division of ownership and more consistent omission-marker handling across typed and untyped files (principles 1, 2, and 7), but requires explicit acceptance of the unique reports it removes under the maintainer's criterion. The original table's proposal to set the option to false remains unconfirmed and must not be implemented as a lossless deduplication.

**Focused verification:** Twenty-two TypeScript fixtures were checked under both option values, for forty-four typed comparisons, using ESLint 10.12.0, typescript-eslint parser/plugin 8.70.0, and TypeScript 6.0.3. The TypeScript program had no compiler diagnostics. The fixtures covered broad string switches, complete/incomplete literal unions, enums, booleans, mixed literal/non-literal unions, empty switches, an `any` receiver, actual defaults, omission-marker capitalization, and misplaced markers. The current option produced twenty-five diagnostics across the corpus; setting it to false produced sixteen. Assertions verified the unique lost reports and confirmed that missing literal/enum cases still report even with defaults or omission markers. Five additional JavaScript checks verified core's default, comment, and empty-switch behavior without type services. All assertions passed; configuration warnings and parser failures were rejected, and temporary files were removed. This is focused rule verification, not full composed-policy validation. See the official [core rule documentation](https://eslint.org/docs/latest/rules/default-case) and [TypeScript rule documentation](https://typescript-eslint.io/rules/switch-exhaustiveness-check/).

**Maintainer choice:** A — retain both switch rules and all current settings, including TypeScript's `requireDefaultForNonUnion: true`, and add complementary-coverage comments. Confirmed by the maintainer on 20 October 2026. This preserves the additional typed empty-switch and exact omission-marker checks, accepting overlapping default reports and the documented scope differences.

**Applied comments:** Added the proposed English `Complemented by` comments above both active source entries. Core's comment names TypeScript's missing literal/enum case analysis. TypeScript's comment names core's untyped and general default-or-comment enforcement. TypeScript's editor-suggestion annotation is preserved. These are comment-only source changes; rule values, severities, options, and scope composition are unchanged.

### D9: opaque return types and async-function requirements

**Current policy:** `@typescript-eslint/promise-function-async` uses `allowAny: false`, with all four function-kind checks enabled and `allowedPromiseNames: []`. The rule remains restricted to the existing type-aware scope. With this option false, checked non-async functions whose return type is `any` or `unknown` are reported even when their implementation is synchronous. In the pinned implementation, this opaque-type branch produces a diagnostic without an automatic fix.

**Recommendation:** A — set only `allowAny: true`, the upstream default, and retain the rule's error severity, other options, and scope. Require async based on a recognized Promise return contract rather than assuming opaque synchronous data is a Promise. Preserve the independent `no-explicit-any` and `no-unsafe-*` policies. The option name applies to this rule only; it does not permit arbitrary `any` use across the configuration.

```ts
"@typescript-eslint/promise-function-async": [
  "error",
  {
    // Opaque any/unknown return types do not establish a Promise return contract.
    allowAny: true,
    allowedPromiseNames: [],
    checkArrowFunctions: true,
    checkFunctionDeclarations: true,
    checkFunctionExpressions: true,
    checkMethodDeclarations: true,
  },
],
```

**Alternative:** B — retain `allowAny: false`. Keep the additional reports on all tested checked `any`/`unknown` return types, including real Promises hidden behind those types, and accept reports on deliberately synchronous opaque-return functions. These cases require explicit return-type clarification or a justified exception; adding `async` mechanically would change a synchronous API into a Promise API. The false setting does not automatically rewrite the tested opaque-return cases.

```ts
// Treat opaque any/unknown returns as potentially asynchronous and require explicit review.
allowAny: false,
```

**Compared outcomes:** This synchronous parsing boundary receives no `promise-function-async` report under A and one under B. Under B, its report says that functions returning promises must be async, even though the declared boundary intentionally returns an untrusted value synchronously.

```ts
const parse = (raw: string): unknown => {
  return JSON.parse(raw);
};
```

Both choices report this recognized non-async Promise-returning function and retain the existing async convention:

```ts
const load = (): Promise<number> => {
  return Promise.resolve(1);
};
```

```ts
const load = async (): Promise<number> => {
  return 1;
};
```

**Accepted-coverage question:** A also removes the report in the following case, where a real runtime Promise is hidden by an explicit `unknown` annotation. B reports it without an automatic fix. A must therefore not be justified by the original P4 claim that every real-Promise report is preserved. Prefer exposing an actual asynchronous contract as `Promise<...>` when the function is asynchronous.

```ts
const load = (): unknown => {
  return Promise.resolve(1);
};
```

**Independent type-safety checks:** Three combined-rule probes used `allowAny: true`, the existing `no-unsafe-return` error, and the existing `no-explicit-any` options. The explicit `unknown` parsing boundary above produced no report from those three rules, an inferred `any` parse return was still reported by `no-unsafe-return`, and an explicit `any` return annotation was still reported by `no-explicit-any`. The explicit unknown boundary is an intentional safe handling point, not proof of validation; its caller must narrow or validate the value before typed use. Neither safety rule should be described as a complete substitute for the opaque-return async reports.

**Implementation boundaries:** Do not change this rule's other function-kind settings, allowed Promise names, or typed/untyped composition as part of A. Review the targeted suppression on the synchronous rule-option callback in `src/utilities/plugin-policy.ts` after implementation and composed validation; remove it only if it is no longer needed. Do not turn an opaque synchronous API into an async API just to silence B's report. Both settings skipped the tested explicit `number | Promise<number>` hybrid annotation and reported the tested inferred hybrid return; the option does not promise exhaustive detection of all asynchronous contracts. Getters were skipped under both settings because they cannot be async. Missing third-party type declarations remain a project setup problem even if A removes this particular symptom.

**Rationale:** A keeps synchronous opaque data boundaries distinct from explicit async contracts and avoids an inaccurate Promise-specific diagnostic on those boundaries (principles 1 and 2), while leaving independent unsafe-type checks enabled (principle 3). B favors reviewing uncertain returns and can catch a hidden Promise, at the cost of those false-positive async requirements. The maintainer must explicitly choose the uncertainty policy; a preference for retaining complementary overlap coverage does not establish that every opaque return should become async.

**Focused verification:** Eighteen typed fixtures were checked under both option values, for thirty-six option comparisons, using ESLint 10.12.0, typescript-eslint parser/plugin 8.70.0, and TypeScript 6.0.3. The TypeScript program had no compiler diagnostics. The fixtures covered explicit/inferred `any`, explicit `unknown`, synchronous scalar returns, recognized and hidden Promises, `Promise<any>`, `Promise<unknown>`, already-async functions, explicit/inferred hybrid returns, class methods, and a getter. The true option produced six diagnostics and the false option thirteen. Assertions verified that all seven added opaque-return reports lacked automatic fixes and that the five tested recognized non-async Promise-return cases reported under both settings. Three additional combined-rule checks verified the independent unsafe-return and explicit-any behaviors described above. All assertions passed; configuration warnings and parser failures were rejected, and temporary files were removed. This is focused rule verification, not full composed-policy validation. The P4 summary was refined to reflect the verified hidden-Promise and safe-unknown boundaries. See the official [async-function rule documentation](https://typescript-eslint.io/rules/promise-function-async/) and [unsafe-return documentation](https://typescript-eslint.io/rules/no-unsafe-return/).

**Maintainer choice:** B — retain `allowAny: false`, all four function-kind checks, `allowedPromiseNames: []`, the error severity, and the existing type-aware scope. Confirmed by the maintainer on 20 October 2026. Preserve the additional opaque-return reports, including the tested hidden Promises, and accept the synchronous-boundary reports as explicit review points. Keep the justified, targeted suppression for synchronous opaque rule-option data in `src/utilities/plugin-policy.ts`; do not apply A's proposed suppression-removal review as an instruction to delete it. Resolve other reports through accurate return contracts or justified local exceptions, preserving synchronous APIs.

**Applied comment:** Added B's English uncertainty-policy comment immediately above this rule's `allowAny: false` option. The option values, rule severity, typed/untyped composition, unrelated `allowAny` settings, and existing suppression remain unchanged. This is a comment-only source change; the proposed A setting is rejected.

### D10: security review signals and file-role exceptions

The two rules have different patterns and different suppression evidence. Decide their scopes separately rather than disable both through one shared noise exception. D10.1 concerns filesystem paths; D10.2 considers object-injection reports independently.

#### D10.1: dynamic filesystem paths in test files

**Current policy and evidence:** `security/detect-non-literal-fs-filename` is `warn` throughout the existing Security feature scope. There is no shared test-file exception for it. Of its twenty-five source suppression comments, seventeen are whole-file directives: sixteen matching test files and the `tests/package/consumers.ts` helper. The eight remaining directives are local exceptions in source, scripts, or tests. The current role is the intersection of `**/*.{test,spec}.*` and the existing JavaScript/TypeScript source patterns; it does not mean every file under a `tests/` directory. Existing file-wide directives hide later warnings in those files regardless of the global setting.

**Recommendation:** B — retain `warn` in matching test files as well as other sources. During implementation, review the existing filesystem suppressions and narrow whole-file directives to justified operation-level exceptions where feasible. Preserve unrelated rule suppressions in combined directives and verify that comments remain necessary. Document the actual path boundary, such as a fixed filename inside a newly created temporary directory; being a test file or receiving a caller-supplied path is not itself proof of safety. This revises the original table's role-exception recommendation after checking the coverage it would remove and the role's actual matching boundary.

```ts
// Review dynamic filesystem paths in every source role; suppress only inspected safe operations.
"security/detect-non-literal-fs-filename": "warn",
```

**Alternative:** A — retain the base warning but turn only this rule off in the shared `test-files` role when the Security feature is enabled. This reduces repeated fixture suppressions in matching tests, explicitly accepting loss of every filesystem-path warning in those files, including unreviewed input-derived paths. It does not cover the helper, source files, or scripts outside the role. Do not broaden the test globs or disable object-injection as part of this choice. An equivalent illustrative flat-config exception is:

```ts
{
  files: [[
    "**/*.{test,spec}.*",
    "**/*.{js,mjs,jsx,mjsx,ts,mts,tsx,mtsx}",
  ]],
  rules: {
    // Accept dynamic fixture paths in test files, also omitting other dynamic-path warnings.
    "security/detect-non-literal-fs-filename": "off",
  },
}
```

**Compared outcomes:** In a matching test file, A produces no filesystem-rule warning for either operation below. B produces one warning on each `readFile` call, even though the first path is a deliberately constructed fixture. The tested `mkdtemp` call itself produces no report. The rule cannot establish the temporary directory's trust boundary or whether an environment path was authorized; a warning is a review request rather than a vulnerability finding.

```js
// fixture.test.js
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const directory = await mkdtemp(path.join(os.tmpdir(), "fixture-"));
const file = path.join(directory, "fixture.json");
await readFile(file, "utf8"); // A: no warning. B: one warning.
await readFile(process.env.INPUT_FILE, "utf8"); // A: no warning. B: one warning.
```

Under B, a reviewed fixture operation can have a local exception without hiding a later unrelated dynamic-path warning:

```js
// eslint-disable-next-line security/detect-non-literal-fs-filename -- The fixed fixture filename is inside a newly created temporary directory.
await readFile(file, "utf8");
await readFile(process.env.INPUT_FILE, "utf8"); // The warning remains.
```

**Rationale:** B applies the same input-review policy to equivalent operations in source, scripts, helpers, and tests (principle 1). A narrowly justified comment makes the trust assumption visible at the operation for later maintenance (principle 2) and preserves unrelated review signals (principle 3), accepting comment overhead (principle 7). A is a legitimate explicit role-level trade-off if reducing repeated fixture comments is preferred, but its loss of unrelated test-path warnings must be approved rather than described as fully handled elsewhere. A global warning plus existing file-wide suppressions does not yet achieve B's narrower review boundary; reducing those directives is implementation work.

**Implementation boundaries:** Neither choice changes the base severity, the feature's files/ignores, other Security rules, or the test-role glob. If A is selected, integrate the exception through the existing role model and generator with a Security-feature gate; do not register a disabled Security rule when that feature is absent. Remove only filesystem suppression tokens rendered unnecessary in matching tests. If B is selected, retain justified exceptions where the heuristic cannot establish safety, without rewriting safe path construction just to satisfy the rule. Update scope documentation and validate representative effective configurations and suppression use when implementing the chosen policy. No shared exception, runtime setting, or suppression has been changed in this discussion.

**Focused verification:** The exact Security 4.2.0 npm archive was inspected and tested with ESLint 10.12.0; TypeScript filename-scope checks used parser 8.70.0 without requiring type services. Thirteen JavaScript fixtures were checked under A and B, for twenty-six comparisons, covering literal and constant paths, static path construction, a module-relative URL, temporary directories, environment/parameter inputs, named/namespace/aliased imports, writes, renames, and an unrelated same-named function. B produced nine warnings and A none in the matching test file. Ten further comparisons checked source, test, spec, and helper filenames under both choices. Two suppression checks verified that a local directive preserved a later environment-path report whereas a whole-file directive hid it. All thirty-eight checks passed after inspection corrected initial probe expectations for `new URL` and `mkdtemp`; parser/configuration failures and unexpected rule IDs were rejected, and temporary files were removed. Repository suppression counts were refreshed separately. This is isolated rule and representative scope verification, not full composed-policy validation or proof of path safety. See the official [filesystem-rule documentation](https://github.com/eslint-community/eslint-plugin-security/blob/main/docs/rules/detect-non-literal-fs-filename.md).

**Maintainer choice:** B — retain `security/detect-non-literal-fs-filename: "warn"` in the existing Security scope, including matching test files. Confirmed by the maintainer on 20 October 2026. Do not add A's shared test-role exception or broaden the test-file patterns. Review and narrow existing whole-file filesystem suppressions to justified operation-level exceptions where feasible during implementation, preserving unrelated suppressed rules and valid path-boundary explanations. D10.2 is recorded separately below.

**Applied comment:** Added B's English path-review comment above the active filesystem-rule source entry. The severity, scope, test-role model, and existing suppression directives remain unchanged. Narrowing existing directives and composed-policy validation remain implementation work.

#### D10.2: computed object keys in test files

**Current policy and evidence:** `security/detect-object-injection` is `warn` in the existing Security scope, including test files. Four source suppression comments name this rule: two whole-file directives in matching tests (`tests/policy/overlaps.test.ts` and `tests/package/contract.test.ts`) and two local directives in production configuration code (`src/options.ts` and `src/configs/plugins/react/rules.ts`). The latter describe keys constrained by configuration types. A shared test-role exception would not cover those production sites. The two whole-file test directives are evidence for reviewing their accesses, not proof that arbitrary computed keys are safe in all tests and consumer projects.

**Verified pattern and limits:** Security 4.2.0 reports a computed `MemberExpression` when its property node is an identifier, without inspecting TypeScript types, the key's origin, or its use as an array index. Constant literal-valued identifiers, union/`keyof` parameters, optional access, and an access inside an `Object.hasOwn` guard still report. Direct dot/literal access and the tested call-expression, template, member-expression, and TypeScript-asserted key forms do not report. Those syntax gaps are not a reason to rewrite a key expression merely to evade the check. The rule provides no automatic fix or editor suggestion. Neither a report nor its absence establishes whether the operation is safe.

**Recommendation:** B — retain `warn` across the existing Security scope, including matching tests, and use justified local suppressions for inspected accesses whose key provenance and allowed properties are understood. Review the two whole-file directives during implementation and narrow them where feasible, preserving other rule tokens in the combined contract-test directive. A TypeScript union describes a compile-time contract; external values still need appropriate runtime handling before they can be trusted.

```ts
// Review computed identifier keys; suppress only inspected accesses with trusted keys.
"security/detect-object-injection": "warn",
```

**Alternative:** A — leave the base warning enabled but turn only this rule off in the shared `test-files` role, using the same source-pattern intersection described in D10.1 and a Security-feature gate. This accepts loss of all its computed-identifier warnings in matching tests, including unrelated accesses and writes using unreviewed keys. It does not affect production code, scripts, or helpers outside the role. Do not reinterpret A as a global `off`, a filesystem-rule exception, or a broader test glob. The generated test-role rule entry would be:

```ts
// Accept computed test-fixture keys, also omitting warnings for unreviewed keys in these files.
"security/detect-object-injection": "off",
```

**Compared outcomes:** In a matching test file, A produces no object-injection warnings in either example. B produces one warning at each bracket access, preserving a review point for the fixed-key contract as well as the arbitrary-key write. These examples isolate this rule rather than promise acceptance by every configured rule.

```ts
// lookup.test.ts
const variants = { dev: 1, prod: 2 };
const readFixture = (key: "dev" | "prod") => {
  return variants[key]; // A: no warning. B: one warning.
};

const writeValue = (
  target: Record<string, string>,
  key: string,
  value: string,
): void => {
  target[key] = value; // A: no warning. B: one warning.
};
```

Under B, a precise exception for an inspected fixture access preserves later warnings on unrelated operations:

```ts
// eslint-disable-next-line security/detect-object-injection -- The key is selected from the fixed fixture keys.
const fixtureValue = record[key];
const otherValue = record[externalKey]; // The warning remains.
```

**Independent type checks:** `noUncheckedIndexedAccess` addresses the possible absence of an indexed value, not key provenance or authorization to write a property. A typed `Record<string, string>` write and a read that explicitly returns `string | undefined` both compiled with `strict`, `noImplicitReturns`, and `noUncheckedIndexedAccess` enabled. Each still received one Security warning and no `@typescript-eslint/no-unsafe-member-access` report. These checks are not complete substitutes for this rule's heuristic reports, and the Security rule is not a substitute for those type checks. No compiler-option change is included in either choice.

**Rationale:** B maintains the same review convention for equivalent computed-key operations in production and tests, consistent with confirmed D10.1 (principle 1). Local reason comments expose the inspected trust boundary to maintainers (principle 2) while preserving unrelated warning coverage (principle 3), accepting comment overhead (principle 7). A reduces comments in matching tests but removes additional review signals; the test role alone does not establish a distinct trust boundary. The original audit's suggestion to weigh both rules similarly does not authorize disabling either globally or claiming compiler ownership of object-injection checks.

**Implementation boundaries:** Preserve the base severity, other Security rules, feature scope/ignores, and test-file patterns. Under B, retain necessary production suppressions and review the test directives deliberately rather than delete them mechanically. Under A, add only the feature-gated test-role exception and remove only rule tokens made unnecessary in matching files. Update scope documentation and verify effective configurations and unused suppressions during implementation. No object-injection setting, suppression, or compiler option has changed during this discussion; the confirmed choice's comment-only source edit is recorded below.

**Focused verification:** The exact Security 4.2.0 npm archive was tested with ESLint 10.12.0, typescript-eslint parser/plugin 8.70.0, and TypeScript 6.0.3. Thirteen JavaScript and four TypeScript fixtures were compared under A and B, for thirty-four checks; B produced ten warnings across those fixtures and A none in matching test files. Ten further comparisons verified source, test, spec, helper, and script filename scopes. Two checks verified local versus whole-file suppression coverage. Two typed combined-rule checks verified that indexed reads/writes could produce a Security warning without compiler diagnostics or an unsafe-member-access report when `noUncheckedIndexedAccess` was enabled. All forty-eight checks passed; parser/configuration failures and unexpected rule IDs were rejected, and temporary files were removed. This is isolated rule and representative scope verification, not full composed-policy validation or exhaustive security analysis. The P10 compiler-ownership claim was corrected accordingly. See the official [object-injection rule documentation](https://github.com/eslint-community/eslint-plugin-security/blob/main/docs/rules/detect-object-injection.md) and [TypeScript option documentation](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html).

**Maintainer choice:** B — retain `security/detect-object-injection: "warn"` throughout the existing Security scope, including matching tests. Confirmed by the maintainer on 20 October 2026. Do not add A's test-role exception or change the file-role globs. Keep justified local exceptions for inspected computed-key accesses, and review the two whole-file test directives for narrower suppression where feasible during implementation. Preserve necessary production exceptions and unrelated suppressed rules. No compiler-option migration or claim of full TypeScript replacement is approved by this choice.

**Applied comment:** Added B's English computed-key review comment above the active rule entry. The severity, feature scope, role model, compiler options, and existing suppressions remain unchanged. Suppression cleanup and composed-policy validation remain implementation work.

### D11: known issues that change code or stop linting

Review the three P5 issues separately: D11.1 concerns custom-element end tags in HTML, D11.2 concerns the Markdown rule crashes, and D11.3 concerns Svelte rune-module file extensions. A choice for one issue does not approve the other proposed changes.

#### D11.1: preserve custom-element end tags in HTML

**Current policy:** The HTML feature applies `@html-eslint/require-closing-tags` at `warn` with `selfClosing: "always"` and `selfClosingCustomPatterns: ["-"]`. In the pinned plugin/parser 0.66.1, the custom pattern makes the rule automatically replace an empty `<my-element></my-element>` with `<my-element />`. HTML browser parsing does not treat the slash as an end tag for a custom element. In the verified example, the following paragraph changes from a sibling to a child of that element.

**Recommendation:** A — set only `selfClosingCustomPatterns: []`, retaining the warning severity, `selfClosing: "always"`, and existing HTML feature scope. Preserve explicit custom-element end tags and require manual review when they are missing or written as a self-closing form. Keep the English reason comment in the approved configuration when implementing the change:

```ts
"@html-eslint/require-closing-tags": [
  "warn",
  {
    selfClosing: "always",
    // HTML custom elements need explicit end tags; a trailing slash does not close them.
    selfClosingCustomPatterns: [],
  },
], // Automatically fixable by the --fix command.
```

**Alternative:** B — retain `selfClosingCustomPatterns: ["-"]` and the current automatic rewrite of empty matching custom elements. This preserves the current convention but accepts the reproduced change to HTML hierarchy. It also accepts the tested `<my-element />` without a warning from this rule. It must not be described as behavior-preserving merely because the formatter converges.

**Compared results from the same valid HTML input:**

```html
<my-element></my-element>
<p>After</p>
```

Under A, `eslint --fix` leaves this input unchanged. The custom element and paragraph remain siblings. Under B, the fixed source becomes:

```html
<my-element />
<p>After</p>
```

Although the paragraph still appears beside the tag in the source, an HTML parser produces a hierarchy equivalent to:

```html
<my-element>
  <p>After</p>
</my-element>
```

**Existing invalid forms and other elements:** A reports `<my-element />` as `unexpected` without an automatic fix; an explicit `</my-element>` must be placed deliberately to preserve the intended boundary. A also reports the tested custom element with a missing end tag as `missing`, whereas B skipped the tested missing-end-tag example containing a child. A does not promise automatic repair of arbitrary malformed HTML. Both choices retain the existing `<br>` to `<br />` fix for void elements, whose slash does not change their HTML tree. The tested nonempty custom elements, standard `div`, SVG `path` child, and MathML `mi` child had the same results under both choices. The whitespace-only custom-element example was not rewritten by either setting. Do not generalize this focused sample into complete namespace or parser coverage.

**Formatter boundary:** Prettier 3.9.10 retains the self-closing custom-element form in the tested layouts. Both options converge with the formatter; convergence alone does not establish correct HTML semantics. Under A, an already self-closing custom element still needs a manual end-tag correction after formatting. This choice concerns the existing HTML feature; it does not authorize changes to component-language policies or broaden the feature's file scope.

**Rationale:** A aligns the preferred source form, linter behavior, and the HTML interpretation used by consumers (principle 1). Explicit boundaries keep the document understandable and maintainable (principle 2) and avoid the verified behavior-changing rewrite. The shorter empty-tag form does not justify losing those boundaries (principle 9). This is a targeted option correction; keep the rule active and preserve its unrelated closing-tag checks and current severity.

**Implementation boundaries:** Change only the custom pattern list and add the English reason comment shown above. Preserve the inline fixability annotation, since the rule still fixes other cases such as void-element slash formatting. Add focused coverage for the valid custom-element sibling case and the reported-but-unfixed self-closing form to the existing HTML feature tests, verify formatting convergence and effective policy, and update the resolved HTML known-issue documentation during implementation. Do not apply the Markdown or Svelte proposals as part of this decision. No HTML setting, source comment, fixture, or README workaround has changed during this discussion.

**Focused verification:** Installed ESLint 10.12.0 and HTML plugin/parser 0.66.1 were checked against this worktree's pins. Twelve HTML fixtures were checked under A and B for twenty-four initial/fix comparisons, followed by twenty-four repeat-fix stability checks. They covered empty/attributed/whitespace/nonempty custom elements, nested children, existing self-closing and missing-end-tag forms, a standard element, void elements, SVG, and MathML. Assertions verified the specific rewrite, the retained manual-review warnings, and representative unchanged cases. parse5 5.1.1 confirmed two sibling elements for A versus a paragraph nested inside the custom element after B's fix; this was standards-parser verification, not an executed-browser test. Thirty-two further formatter scenarios covered four inputs under both choices and four layouts: Prettier defaults, repository config 0.3.2, tabs at 120 columns, and single quotes at 80 columns. Three fix/format cycles per scenario converged with Prettier 3.9.10, while preserving the reproduced DOM difference. All assertions passed; parser/configuration failures and unexpected rule IDs were rejected. Checks ran in memory without modifying either checkout. This is focused rule/formatter verification, not full composed-policy or consumer validation. See the official [rule option documentation](https://html-eslint.org/docs/rules/require-closing-tags) and [HTML start-tag syntax](https://html.spec.whatwg.org/multipage/syntax.html#start-tags).

**Maintainer choice:** A — set `selfClosingCustomPatterns: []` in the HTML closing-tag rule, retaining `warn`, `selfClosing: "always"`, the existing feature scope, and unrelated rule settings. Confirmed by the maintainer on 20 October 2026. Preserve explicit custom-element end tags and the approved English explanation in the configuration example above. Existing self-closing or missing-end-tag custom elements require deliberate manual correction; do not assume the rule automatically inserts the correct closing boundary. The option change, accompanying source comment, focused regressions, and README update remain recorded for implementation; no HTML source setting or source comment has changed during decision gathering. D11.2 and D11.3 are separate decisions recorded below.

#### D11.2: Markdown rules that throw on GFM autolinks

**Current policy:** The Markdown feature uses `markdown/gfm`, YAML front matter, and math, with twenty-one explicit rule entries, nineteen currently active. Five active error rules throw on the tested bracketed URL/email inputs in `@eslint/markdown` 8.0.3: `markdown/no-bare-urls`, `markdown/no-invalid-label-refs`, `markdown/no-missing-label-refs`, `markdown/no-reference-like-urls`, and `markdown/no-space-in-emphasis`. The exceptions are not ordinary rule diagnostics. In isolation, the first and fourth threw `Custom getRange() method must be implemented in the subclass.`, while the other three threw the corresponding `getLoc()` error. The combined current policy threw `getLoc()`. All five also threw when reduced to `warn`, so changing severity does not resolve this failure.

**Recommendation:** A — temporarily set only these five rules to scalar `off`, preserving their explicit entries and adding an English version/cause/upstream comment for every disabled rule. Keep the Markdown feature, GFM language, front matter, math, file scope, and all other rule settings. This leaves fourteen active Markdown rules in the base policy and allows the verified inputs to be linted without these exceptions. It explicitly accepts a temporary loss of the five rules' unique diagnostics and fixes to keep the lint pipeline usable; do not claim that the remaining rules or Prettier fully handle them.

```ts
// Temporarily disabled: GFM autolink nodes without positions crash 8.0.3 (eslint/markdown#619).
"markdown/no-bare-urls": "off", // Automatically fixable by the --fix command.
// Temporarily disabled: GFM autolink nodes without positions crash 8.0.3 (eslint/markdown#619).
"markdown/no-invalid-label-refs": "off",
// Temporarily disabled: GFM autolink nodes without positions crash 8.0.3 (eslint/markdown#619).
"markdown/no-missing-label-refs": "off",
// Temporarily disabled: GFM autolink nodes without positions crash 8.0.3 (eslint/markdown#619).
"markdown/no-reference-like-urls": "off", // Automatically fixable by the --fix command.
// Temporarily disabled: GFM autolink nodes without positions crash 8.0.3 (eslint/markdown#619).
"markdown/no-space-in-emphasis": "off", // Automatically fixable by the --fix command.
```

**Alternative:** B — retain all five current error entries, options, and scopes. Keep their useful reports on ordinary non-triggering inputs, accepting that certain GFM autolinks still interrupt linting. The tested explicit link `[Example](https://example.com)` and explicit autolink `<https://example.com>` avoided the exception under both choices. Rewriting known triggering text can be a local workaround, but it neither fixes the parser/source-location issue nor guarantees future Markdown will avoid every trigger. The tested shorthand autolink `<www.example.com>` still threw under B.

**Compared outcomes, using separate input files:**

```text
Input 1: [https://example.com]
A: Lint returns normally; no Markdown diagnostic for this input.
B: Exception: Custom getLoc() method must be implemented in the subclass.

Input 2: https://example.com
A: No no-bare-urls diagnostic.
B: Error from markdown/no-bare-urls, with an automatic fix available.

Input 3: [text][missing]
A: No no-missing-label-refs diagnostic.
B: Error from markdown/no-missing-label-refs.
```

The lost coverage also includes invalid label references, URLs confused with defined reference identifiers, and spaces around emphasis markers. In the tested `** bold **` input, B produced two `no-space-in-emphasis` diagnostics while A produced none. These losses apply throughout the existing Markdown scope, not just around the crashing text. On a mixed input containing a bracketed URL and an image without alt text, A still returned `markdown/require-alt-text`, while B threw before returning a diagnostic array. A also retained the tested heading-increment report. This demonstrates retained useful linting without asserting that all future Markdown inputs are crash-free.

**Rationale:** A preserves a predictable lint workflow across this repository and consumers (principle 1) and confines the temporary workaround to the reproduced failing rules, with a visible reason and restoration criterion (principle 2). It preserves the other active checks rather than disabling the Markdown feature. B retains more coverage on non-triggering text, but does not provide a reliable lint run when the known inputs occur. As with D8.10's behavior-changing autofix, removing unique reports requires this explicit individual trade-off; the general preference for retaining complementary coverage is not silently overridden.

**Implementation and restoration boundaries:** Move the affected entries into their existing appropriate disabled groups, remove unused options from the scalar `off` entries, preserve fixability capability annotations, and update group/composition counts consistently. Preserve all twenty-one explicit rule IDs and every unaffected value. Add regression coverage in the existing Markdown tests for the triggering inputs and an unrelated retained diagnostic. Replace tests that use `no-bare-urls` as an assumed-active feature/scope sentinel with an appropriate retained rule while preserving the tests' purpose; retain independent consumer override coverage. Update the README known issue and the explicit temporary-coverage explanation when implementing A. Do not disable GFM, front matter, math, or the entire feature, and do not introduce a dependency upgrade, parser fork, or source-location monkey patch through this decision. Track the upstream issue and re-test the triggering corpus and lost diagnostic examples with the actual upgraded dependency combination before re-enabling each rule and removing its temporary comment. No Markdown source entry, comment, test, dependency, or README workaround has been changed during this discussion.

**Focused verification:** Tests used ESLint 10.12.0, `@eslint/markdown` 8.0.3, `@eslint/core` 1.2.1, and `@eslint/plugin-kit` 0.7.3 from the primary checkout; these versions match this worktree's lockfile. Rule policy was loaded from this worktree's actual TypeScript source by in-memory transpilation. Nineteen active rules were tested separately on bracketed URL and email inputs for thirty-eight checks; exactly the five named rules threw on both. Thirteen inputs were compared under A and B for twenty-six policy checks, including reference-like and shorthand autolinks, bare URLs, explicit links/autolinks, fenced literal text, emphasis spacing, missing labels, alt text, heading increments, and a mixed trigger/retained-report case. B threw on five of those inputs; A returned normally on all thirteen. Three A fix-mode checks also returned normally. Five additional warning-severity checks still threw, and one B fix-mode check reproduced `getRange()`. All seventy-three focused checks passed with explicit assertions. Expected exceptions were matched explicitly; other exceptions, parser/configuration failures, and unexpected rule IDs were rejected. Checks ran in memory without changing either checkout and do not constitute full composed-policy or consumer validation. The related missing-position issue is documented in [eslint/markdown#619](https://github.com/eslint/markdown/issues/619); its original example uses older versions, while the pinned-version results above were reproduced locally. See also the official [bare-URL rule documentation](https://github.com/eslint/markdown/blob/main/docs/rules/no-bare-urls.md) and [reference-like URL rule documentation](https://github.com/eslint/markdown/blob/main/docs/rules/no-reference-like-urls.md).

**Maintainer choice:** A — temporarily set the five named Markdown rules to scalar `off` with the English version/cause/upstream comments recorded above. Confirmed by the maintainer on 20 October 2026. Preserve all twenty-one explicit rule IDs, the fourteen remaining active rules, the existing feature scope, GFM, front matter, and math. The maintainer accepts the documented loss of unique diagnostics and fixes as an individual temporary exception to the coverage-retention preference. Re-enable each rule only after validating the triggering cases and restored diagnostics with the actual corrected dependency combination. Source entries, accompanying comments, tests, and documentation changes remain recorded for the implementation phase; no Markdown runtime setting or source comment has changed during decision gathering. D11.3 is recorded separately below.

#### D11.3: route Svelte-related filenames to supported parser modes

**Current policy and verified cause:** `svelteFiles` includes `.svelte`, `.svelte.js`, `.svelte.mjs`, `.svelte.ts`, and `.svelte.mts`. The Svelte block follows the TypeScript blocks and selects svelte-eslint-parser for every matching file. Parser 1.9.0 explicitly selects script/rune-module mode only when the filename ends with `.svelte.js` or `.svelte.ts`; otherwise it selects component mode. Ordinary module syntax in the two extra suffixes can therefore fail to parse. A statement without braces can also be accepted as component text, leaving its JavaScript expression unchecked rather than producing an error. The official Svelte module documentation describes `.svelte.js` and `.svelte.ts`.

**Recommendation:** A — remove only `.svelte.mjs` and `.svelte.mts` from the Svelte feature's default glob. Keep them in the existing ordinary source globs through their `.mjs`/`.mts` extensions: JavaScript uses the normal parser, and TypeScript uses typescript-eslint when that feature covers the file. Keep the supported component and rune-module suffixes and add an English explanation when implementing the glob correction:

```ts
// Match the component and rune-module suffixes recognized by svelte-eslint-parser 1.9.0.
// Other .mjs/.mts sources keep ordinary JavaScript/TypeScript parsing.
const svelteFiles = ["**/*.{svelte,svelte.js,svelte.ts}"] as const;
```

**Alternative:** B — retain the existing five-suffix Svelte glob and document the current limitation. This preserves the existing parser selection for the extra suffixes but accepts the reproduced parsing failures and silent interpretation of module statements as component text. Consumers can avoid those paths by using documented rune-module filenames; retaining the glob does not make the pinned parser support the extra suffixes. No parser adapter, dependency upgrade, or additional extension support is included in B.

**Compared outcomes:** The same ordinary module source was tested under the filename `options.svelte.mjs`, and the equivalent `.svelte.mts` case was checked too:

```js
export const options = { value: 1 };
```

```text
A: Parsed normally as JavaScript (.mjs) or TypeScript (.mts).
B: Parsing error: Expected token }
```

A restores the normal `eqeqeq` report in this additional `.svelte.mjs` example. Under B, the statement is treated as component text and the isolated JavaScript comparison check produces no report:

```js
export const check = 1 == 1;
```

```text
A: eqeqeq error requiring ===.
B: No eqeqeq report; the statement was not parsed as a JavaScript expression.
```

**Rune and type-information boundaries:** A is ordinary-source routing for the two extra suffixes, not an extension of Svelte rune support. In the tested `.svelte.mjs` source `export const state = $state({ count: 0 });`, A restored ordinary parsing but `no-undef` reported `$state`. The same source named `.svelte.js` retained rune-aware parsing and had no such report under either choice; `.svelte.ts` also retained its existing parser path. Prefer those documented suffixes for actual rune modules, and update affected imports deliberately if a consumer renames a module. Do not add global rune declarations or suppress undefined-symbol reports just to imply support for an unverified compiler/build path. Type-aware linting remains conditional on the existing TypeScript scope and project setup: a focused `.svelte.mts` fixture under A still received `@typescript-eslint/no-floating-promises` using a valid TypeScript program, while B failed to parse it. This does not promise that all files or disabled TypeScript features receive type services.

**Retained checks and scope:** Ordinary `.mjs`/`.mts` files remain source files rather than becoming ignored. A restored the tested `eqeqeq` and `no-eval` reports in `.svelte.mjs`, retained the component class-spacing report, and retained the ten supported Svelte rule entries on the supported paths. The two extra suffixes no longer receive Svelte-specific parser services or template rules. Do not describe those services as fully replaced by the ordinary parsers, and do not claim that the current template parse provides valid module coverage. Existing `.svelte` component scope resolution, feature files/ignores, global ignores, optional-peer handling, and other language defaults remain separate from this correction.

**Rationale:** A makes parser selection consistent with the language role and supported filename conventions instead of allowing a module to be interpreted as component text (principle 1). It exposes the supported rune-module boundary clearly for maintainers and consumers (principle 2), preserves meaningful ordinary-code checks, and avoids a custom parser workaround for undocumented suffixes. Keeping a broad filename pattern is not itself evidence of additional language support.

**Implementation boundaries:** Change only the Svelte glob and its explanation, update the README feature matrix/known issue to explain ordinary-source fallback and documented rune filenames, and add representative regression coverage to the existing Svelte tests. Verify parser selection, a previously missed ordinary diagnostic, the typed `.svelte.mts` path, and retained component/canonical-rune behavior. Preserve the ordinary source globs, TypeScript feature scope, Svelte component-role calculation, and feature option filtering. Do not globally ignore these files, rename consumer files automatically, disable the Svelte feature, or introduce parser wrappers through this decision. No Svelte glob, parser setting, source comment, fixture, dependency, or README text has changed during this discussion.

**Focused verification:** Forty-four checks used installed ESLint 10.12.0, Svelte 5.57.2, svelte-eslint-parser 1.9.0, HTML Svelte plugin 0.66.1, typescript-eslint parser/plugin 8.70.0, and TypeScript 6.0.3; these named versions match this worktree's lockfile. Actual glob definitions, the component-source helper, Svelte rule maps, compatibility filtering, and the floating-Promise option were loaded from this worktree through in-memory transpilation. The Svelte plugin was loaded through its ESM export, as in the feature. Fifteen syntax/diagnostic fixtures were compared under A and B for thirty checks, covering ordinary and Svelte-named modules, typed arrows, object exports, loose equality, rune globals, a template diagnostic, eval, and the component-text gap. Ten effective-config checks verified all five relevant parser selections under both choices. Four typed comparisons used normal and Svelte-named `.mts` files in a TypeScript program with no compiler diagnostics, verifying retained floating-Promise reports under A and the expected B parsing failure. All forty-four checks passed; only explicitly expected parsing failures were accepted, and configuration warnings or unexpected rule IDs were rejected. Fixtures were created in an isolated temporary directory with access to existing dependencies and then removed. These checks use representative parser/rule blocks, not the full factory or a Svelte application build. See the official [Svelte module documentation](https://svelte.dev/docs/svelte/svelte-js-files) and [parser configuration examples](https://github.com/sveltejs/svelte-eslint-parser/blob/main/README.md).

**Maintainer choice:** A — narrow the Svelte glob to `.svelte`, `.svelte.js`, and `.svelte.ts`, preserving ordinary JavaScript/TypeScript routing for `.svelte.mjs` and `.svelte.mts`. Confirmed by the maintainer on 20 October 2026. Preserve the English explanation in the proposed glob example, the existing source globs, feature scope/filtering, component-role calculation, and optional-peer handling. Actual rune modules should use the documented `.svelte.js` or `.svelte.ts` filenames; no new rune support, automatic consumer rename, global ignore, or parser adapter is approved for the extra suffixes. The glob change, accompanying source comment, regressions, and README updates remain recorded for implementation; no Svelte runtime setting or source comment has changed during decision gathering.

### D12: severity of quantitative maintainability limits

**Current policy and refreshed scope:** Twelve active owner entries set limits on code size, complexity, parameter count, or nesting. Five use `error`, and seven use `warn`. The original P6 list omitted the native JavaScript parameter owner and the Unicorn/HTML depth limits; apply the same decision to these equivalent review metrics. Current values are:

| Rule                             | Current severity | Existing limit                                    |
| -------------------------------- | ---------------- | ------------------------------------------------- |
| `complexity`                     | `error`          | 10, classic variant                               |
| `max-params`                     | `error`          | 4 parameters; existing `countThis` behavior       |
| `@typescript-eslint/max-params`  | `error`          | 4 parameters; existing TypeScript `this` behavior |
| `unicorn/max-nested-calls`       | `error`          | 3 nested calls                                    |
| `@html-eslint/max-element-depth` | `error`          | 6 element levels                                  |
| `max-depth`                      | `warn`           | 3 block levels                                    |
| `max-lines`                      | `warn`           | 600 counted lines                                 |
| `max-lines-per-function`         | `warn`           | 60 counted lines                                  |
| `max-nested-callbacks`           | `warn`           | 3 callback levels                                 |
| `sonarjs/cognitive-complexity`   | `warn`           | 15                                                |
| `sonarjs/expression-complexity`  | `warn`           | 3                                                 |
| `sonarjs/regex-complexity`       | `warn`           | 20, within its existing type-aware scope          |

The table summarizes limits rather than replacing the full option objects. Preserve blank/comment counting, IIFE/constructor-callback settings, shared parameter options, variants, and every existing feature/typed scope. The core parameter owner stays disabled in the TypeScript replacement scope, and existing alternative/formatter-owned rules remain off. A number in a rule's schema is not sufficient to classify that rule as a size/complexity review metric: fixed formatting conventions, duplicate-code heuristics, language/correctness checks, and security policies retain their independent decisions.

**Recommendation:** A — make all twelve listed quantitative review limits `warn`, changing only the five currently error-level owner severities. The numbers and detected over-limit cases remain the same in ordinary lint runs. Document the convention for this repository, future equivalent metrics, and consumers: configurable size/complexity/nesting limits identify maintainability concerns that require contextual review. A limit violation alone does not establish an incorrect function or justify a mechanical API change. Preserve meaningful existing exception boundaries and document any necessary exception at its actual scope.

**Alternative:** B — make the same twelve listed limits `error`, changing the seven currently warning-level owner entries. Treat exceeding the configured maintainability limits as a mandatory error-level project convention. Update the README's complexity-threshold wording and `CONTRIBUTING.md` accordingly. This is an equally consistent severity convention if strict limits are preferred; it should not be implemented by changing their values, enabling currently disabled metric rules, or reclassifying unrelated warnings.

**Compared diagnostic outcomes:** The parameter maximum remains four under either choice. A five-parameter arrow is reported once by the applicable JavaScript or TypeScript owner; only severity differs. A four-parameter boundary case receives no parameter-count report under either choice. This example isolates the parameter rule rather than promise acceptance by every configured rule:

```js
const sum = (first, second, third, fourth, fifth) => {
  return first + second + third + fourth + fifth;
};
```

```text
A: One max-params warning; the maximum remains 4.
B: One max-params error; the maximum remains 4.
```

**CLI and CI boundary:** This repository's `lint:built` command is `eslint . --max-warnings 0`. Therefore both choices fail that command when the example produces its report; choosing warnings does not make the repository's warning budget permissive. In an ordinary consumer command without that flag and without other errors, A exits successfully while B exits with an error status. Consumers control their own CLI warning budget. With `--quiet` alone, warning-level rules are skipped; when combined with `--max-warnings`, they still run and count toward the budget but their warning output is hidden. Do not claim that changing severity preserves execution/reporting under every CLI mode.

| Command                              | A: `warn` | B: `error` |
| ------------------------------------ | --------- | ---------- |
| `eslint example.js`                  | exit 0    | exit 1     |
| `eslint example.js --max-warnings 0` | exit 1    | exit 1     |

The commands above describe the isolated five-parameter fixture and its single configured diagnostic, not the full repository policy. Keep the actual package scripts, CI flags, and warning budget unchanged under either choice.

**Rationale:** A makes equivalent maintainability review metrics use the same diagnostic category across JavaScript, TypeScript, HTML, and the existing plugin scopes (principle 1). It communicates that the metric is a prompt to assess readability and structure in context (principle 2), while allowing the repository to retain its explicit zero-warning gate. B also satisfies consistency and makes limits mandatory in ordinary consumer runs, but represents a different policy choice about context-dependent metrics. Existing bug/security restrictions, fixed coding conventions, and the accepted explicit-operator policy are independent of this decision.

**Implementation boundaries:** For A, change only `complexity`, native and TypeScript `max-params`, `unicorn/max-nested-calls`, and `@html-eslint/max-element-depth` to warning severity. For B, change only the seven warning-level table entries to error severity. Preserve the existing shared parameter maximum and all other options; D13 separately considers the deprecated `maximum: undefined` property in the TypeScript entry. Update the README and `CONTRIBUTING.md` with the chosen convention, add concise English reason comments where source severities change, and verify effective severity/ownership across representative files using existing policy coverage. Preserve disabled owners, feature options, user overrides, typed fallbacks, and repository-specific size/nesting exceptions. Do not refactor application APIs or change numeric limits through this severity decision. No rule severity, source comment, limit, script, or contributor documentation has been changed during this discussion.

**Focused verification:** Twenty isolated boundary/severity checks exercised the five current error-level owners using their actual worktree option objects. Each rule was tested at its configured limit and one above it under A and B. All over-limit cases produced the same diagnostic content and location after removing severity; boundary cases produced none. Checks used ESLint 10.12.0, typescript-eslint parser/plugin 8.70.0, TypeScript 6.0.3, and HTML plugin/parser 0.66.1 matching the lockfile. Unicorn's exact pinned 77.0.0 npm archive and official rule adapter were used in an isolated directory rather than the older primary-checkout version. Eight real CLI checks verified both severities under ordinary execution, `--max-warnings 0`, `--quiet`, and their combination. All twenty-eight checks passed with explicit assertions; parser/configuration failures and unexpected rule IDs were rejected, and temporary files were removed. The twelve-entry inventory came from current source maps; unchanged SonarJS metrics were not executed as part of this focused check. This is severity/threshold verification, not full composed-policy validation. See the official [complexity documentation](https://eslint.org/docs/latest/rules/complexity), [TypeScript parameter-rule documentation](https://typescript-eslint.io/rules/max-params/), and [CLI warning-budget documentation](https://eslint.org/docs/latest/use/command-line-interface#--max-warnings).

**Maintainer choice:** A — use `warn` consistently for all twelve quantitative size/complexity/nesting owner entries listed above. Confirmed by the maintainer on 20 October 2026. Change only the five currently error-level severities, preserving the existing limits, options, scopes, disabled replacement owners, and repository-specific exceptions. Document the convention and concise English source reasons during implementation. The repository's `--max-warnings 0` gate remains unchanged, and the standard warning behavior under ordinary and quiet consumer commands remains as described above. No unrelated security/correctness severity or numeric option is reclassified by this decision. The source severity changes, reason comments, and documentation updates remain recorded for implementation; no runtime rule setting or related source comment has changed during decision gathering.

### D13: deprecated rule entries and option aliases

Separate two concerns: D13.1 confirms that package-authored maps must omit deprecated rule entries, including explicit `off`; D13.2 confirms removing the redundant `maximum: undefined` alias on an active rule. Removing deprecated rule IDs does not itself decide the treatment of individual option keys on a non-deprecated rule; supported extension options and the documented neutral formatter guard remain as specified in D13.2.

#### D13.1: omission versus explicit disabling of deprecated rules

**Current policy and evidence:** P7 records thirteen deprecated SonarJS entries, three Stylistic entries, and one core-rule entry in the TypeScript replacement map, all disabled. The current source still contains these groups with reason comments. SonarJS and Stylistic documentation expressly retains deprecated entries in their reviewed inventories, while the generic update instructions say to remove deprecated rules. The deprecated-rule test only rejects active plugin entries: it skips `off`/`0` and never checks core metadata. This section verifies the core composition case and those source/test boundaries; it is not a new complete metadata inventory of every plugin.

**Reviewed recommendation (not selected):** B — permit existing reviewed deprecated rule entries only as scalar `off`, with an English explanation of their disabled status and, where relevant, the current policy owner. Preserve explicit suppression when it prevents earlier configuration from re-enabling an obsolete or conflicting check. Keep reviewed disabled inventories where they already exist; this choice does not require bulk-adding every historical core rule, alias, or previously omitted deprecated ID. Continue requiring explicit decisions for every current non-deprecated rule, and never enable a deprecated rule in package-authored default policy. Reconcile the contributor instructions around that consistent rule.

This revises the original table's blanket-removal recommendation after testing consumer config composition. In particular, retain the existing typed-scope `no-return-await: "off"` entry and describe its actual purpose rather than imply that its old prohibition is diagnostically equivalent to the current await convention:

```ts
// Deprecated: disable its await prohibition; @typescript-eslint/return-await enforces the chosen policy.
"no-return-await": "off", // Manually fixable by editor suggestions.
"@typescript-eslint/return-await": ["error", "always"], // Automatically fixable by the --fix command. Manually fixable by editor suggestions.
```

The example summarizes the two current policy roles, not a request to reorder source groups or alter scopes. The native rule's official documentation says it is deprecated and has no replacement; TypeScript's `always` convention intentionally requires behavior that the old prohibition can oppose. Do not describe this as a lossless replacement of the old diagnostic set.

**Selected alternative:** A — omit every deprecated rule entry from package-authored maps, including those currently `off`, and reject any such authored key in policy checks. This keeps the maps free of deprecated IDs and reduces inactive declarations. With no preceding config enabling one, both omission and `off` leave it inactive. However, omission does not override an earlier setting; accepting A therefore also accepts the reproduced consumer-composition difference. Removal of an explicit disable must not be called behavior-preserving cleanup across all consumer configurations.

**Compared outcomes:** Assume a consumer config placed before this package's blocks contains `"no-return-await": "error"`. Within the existing typed replacement scope, test this function while retaining `@typescript-eslint/return-await: ["error", "always"]`:

```ts
export const load = async (): Promise<number> => {
  return await Promise.resolve(1);
};
```

```text
A: The earlier no-return-await error remains active and reports the await.
B: The package's explicit off suppresses that obsolete prohibition; no such report.
Both: @typescript-eslint/return-await remains active with the "always" policy.
```

Without the preceding enablement, neither choice produced a report on the awaited function. A separate unawaited return still received the TypeScript rule's diagnostic with the deprecated rule disabled. This establishes why the retained disable can have a real ownership purpose even though it never executes the deprecated rule.

**Precedence, stale-entry, and test boundaries:** Both choices preserve existing user override APIs and flat-config ordering. An explicit later user config can re-enable the rule under either choice; B is a package default within its existing scope, not a global prohibition imposed on all consumer configs. Native and plugin unknown rule IDs were both accepted silently when set to `off`, confirming P7's stale-entry risk. Under B, verify authored IDs against the corresponding current pinned core/plugin registries, reject active deprecated entries in both core and plugin policy, and remove declarations when upstream removes their rules. Run authored-inventory checks before optional-peer compatibility filtering can hide unavailable entries, while preserving supported older-peer behavior in consumers. Under A, inspect authored maps as well as composed output so metadata/filtering does not hide disallowed declarations. Neither choice makes the existing plugin-only enabled-rule test a complete policy guard.

**Rationale:** B preserves explicit policy ownership and predictable precedence when this package follows another config (principle 1), and reason comments make the inactive declaration understandable (principle 2). The deprecated check remains unexecuted; retaining its identifier is a deliberate inactive-reference trade-off against removing all deprecated references (principle 6). A is cleaner at the declaration level and reduces inventory maintenance (principles 6 and 7), but loses the demonstrated explicit-disable behavior. An entry that suppresses inherited behavior is not automatically redundant. Retaining reviewed disabled inventories also respects the established explicit-policy convention, without dynamically adding new upstream rules.

**Implementation boundaries:** Do not enable any deprecated rule, change the TypeScript await convention, broaden the native disable to new file scopes, or alter user override ordering. For B, preserve existing reviewed `off` entries and their fixability annotations, refine the native await-disable reason as shown above, reconcile `CONTRIBUTING.md`/README wording, and add meaningful core/metadata/removed-ID and inherited-config coverage to existing policy tests. For A, remove deprecated authored keys and adjust counts/documentation/guards while recording the accepted inheritance effect. Preserve all non-deprecated decisions, formatter ownership, typed boundaries, and optional-peer compatibility. D13.2 separately decides canonical option cleanup; this rule-entry decision does not authorize changing active option values. No deprecated rule entry, source comment, option, test, or contributor instruction has changed during this discussion.

**Focused verification:** Tests used ESLint 10.12.0, typescript-eslint parser/plugin 8.70.0, and TypeScript 6.0.3. Four typed lint comparisons covered A/B with and without a preceding native-rule enablement; four calculated-config checks verified native severities were respectively absent/disabled or inherited-error/disabled. The initial TypeScript program had no compiler diagnostics. One additional typed check verified that the unawaited return remained reported by the active TypeScript rule. Two later-override checks verified that both choices still permit explicit later enablement. Two unknown-ID checks confirmed silent acceptance of both native and plugin `off` entries. All nine lint scenarios and four effective-configuration checks passed with explicit assertions; parser/configuration failures and unexpected diagnostics were rejected. Temporary TypeScript fixtures were removed. This is focused precedence and rule-activity verification, not full policy/peer validation or a refreshed inventory of every dependency's deprecated metadata. See the official [deprecated native-rule documentation](https://eslint.org/docs/latest/rules/no-return-await), [rule configuration documentation](https://eslint.org/docs/latest/use/configure/rules), and [config composition documentation](https://eslint.org/docs/latest/use/configure/combine-configs).

**Maintainer choice:** A — deprecated rules no longer belong in package-authored rule maps, including disabled entries. Confirmed by the maintainer's direct instruction on 20 October 2026. This supersedes the earlier inventory preference for retaining deprecated SonarJS/Stylistic rules as `off`; the explicit inventory requirement continues for current non-deprecated rules. Remove the deprecated native `no-return-await` entry from the existing TypeScript replacement map as well, preserving the active TypeScript await policy and its scope. Accept the documented inheritance difference if a preceding consumer config enables that deprecated rule; do not describe removal as universal behavior preservation or silently reintroduce a deprecated disable. Reconcile contributor instructions and counts, and extend core/plugin authored-map checks to reject deprecated IDs at every severity before optional-peer filtering. Preserve current non-deprecated disabled owners, formatter ownership, public override ordering, and older-peer compatibility. Source entry removal, test/metadata guards, and documentation changes remain recorded for implementation; no deprecated rule entry or runtime setting has changed during decision gathering. D13.2 records the independently confirmed option cleanup.

#### D13.2: remove a redundant deprecated option alias

**Current policy:** The active `@typescript-eslint/max-params` entry declares `maximum: undefined`, then spreads the shared `{ max: 4 }` options and sets `countVoidThis: false`. The pinned plugin's schema marks `maximum` as deprecated; its documented canonical limit is `max`. The native JavaScript owner already uses the shared `max` without this alias. The existing explicit-option test permits omission of `maximum` whenever `max` is present, so the undefined property is unnecessary for either enforcement or that test.

**Recommendation:** A — remove only `maximum: undefined` from this TypeScript entry and keep the shared `max` option. Preserve the limit, `countVoidThis: false`, replacement ownership, file scopes, and consumer overrides. Apply the warning severity already approved in D12 during implementation; this option decision does not choose a new severity.

**Alternative:** B — retain the existing undefined alias alongside the canonical `max`. It supplies no additional parameter-limit diagnostic in the checked fixtures and retains a deprecated option reference without a demonstrated compatibility purpose.

**Compared proposed settings:** Both examples include D12's approved warning severity. The current source is still unchanged at `error`; these examples do not mean that implementation has happened. Production code should continue spreading the shared options rather than duplicate the number.

```ts
// A: remove the deprecated alias; retain the shared max option.
"@typescript-eslint/max-params": [
  "warn",
  { ...maxParamsOptions, countVoidThis: false },
],

// B: retain the existing redundant property.
"@typescript-eslint/max-params": [
  "warn",
  { maximum: undefined, ...maxParamsOptions, countVoidThis: false },
],
```

```ts
const sum = (
  first: number,
  second: number,
  third: number,
  fourth: number,
  fifth: number,
) => {
  return first + second + third + fourth + fifth;
};
```

```text
A: One @typescript-eslint/max-params warning; maximum allowed remains 4.
B: The identical warning, message, and location; maximum allowed remains 4.
Both: An ordinary four-parameter arrow receives no parameter-count report.
```

**Option-specific guardrails:** Do not equate removing a deprecated rule ID with deleting every similarly labeled option across unrelated rules. In the pinned typescript-eslint 8.70.0 extension, `countVoidThis` remains the documented/schema-supported option, while `countThis` is rejected by that extension's schema. The current native ESLint documentation deprecates its own `countVoidThis` alias, but copying its replacement into the plugin entry is not supported by this installed extension. Preserve `countVoidThis: false`; replacing the extension or changing native/TypeScript ownership is outside this decision.

Also preserve `@stylistic/type-annotation-spacing`'s `overrides: { arrow: "ignore" }` and its existing English ownership/deprecation comment. This is an intentional suppression of deprecated arrow-spacing behavior in a non-deprecated rule, rather than an unused alias. With the pinned Stylistic 5.10.0 rule and current `before: false` / `after: true` options, removing that override reports the normal space before `=>` in `type Mapper = (value: number) => number;` and supplies a fix deleting it. Prettier restores that space. Keeping the override leaves this example stable while the separate arrow-spacing owner remains configured. Neither A nor B approves removing this formatter compatibility guard or disabling the whole annotation-spacing rule.

**Rationale:** A gives the JavaScript and TypeScript limit owners the same canonical `max` convention (principle 1), removes a confusing unused declaration (principle 2), and avoids a deprecated alias and redundant property (principles 6 and 7). Compatibility/ownership suppressions and version-specific extension options require their own evidence: preserving stable diagnostics and formatting takes priority over mechanically banning every legacy-looking key. Guard the known redundant alias specifically in authored policy; do not claim that generic rule deprecation metadata identifies every deprecated option or that a raw recursive key-name ban is safe.

**Implementation boundaries:** Remove the redundant alias only if A is confirmed, reuse the shared options, and update the existing policy checks/documentation to distinguish unsupported or obsolete aliases from justified neutral compatibility settings. Retain the existing canonical-alias allowance in explicit-option coverage, preserve the arrow override and its explanation, and verify the relevant effective option/diagnostic boundary during implementation. No dependency update, rule replacement, scope change, public option change, fixture migration, or broad deprecation scanner is approved here. No source option, severity, comment, test, or contributor instruction has changed during this discussion.

**Focused verification:** Sixteen isolated parameter-rule comparisons used ESLint 10.12.0, typescript-eslint parser/plugin 8.70.0, TypeScript 6.0.3, and the actual shared `{ max: 4 }` options. Eight fixtures ran under A and B at warning severity: ordinary arrows, function types, and function expressions with void/non-void `this` parameters at and above their existing effective boundaries. Every A/B diagnostic array was identical, and expected rule IDs, severity, limit, and report counts were asserted. Two calculated-config checks retained limit 4 and disabled native ownership; one additional check verified schema rejection of `countThis` on the pinned plugin extension. Eight Stylistic comparisons used its exact pinned 5.10.0 npm archive with both relevant rules configured, covering ordinary/generic function types, a call signature, and a normal colon annotation. Both function-type examples were reported only after removing the guard; the two control cases remained clear. Two formatting checks used Prettier 3.9.10 and the repository's Prettier config 0.3.2, verifying stable normal spacing and restoration of the rule's proposed space deletion. All twenty-nine checks passed with assertions; parser/configuration failures and unexpected diagnostics were rejected except for the explicitly expected unsupported-option failure. Temporary files were removed, and the primary dependency checkout was read-only. These probes verify the focused options and formatting boundary, not the full composed policy or all deprecated options. See the official [native parameter-option documentation](https://eslint.org/docs/latest/rules/max-params), [TypeScript extension documentation](https://typescript-eslint.io/rules/max-params/), and [annotation-spacing documentation](https://eslint.style/rules/type-annotation-spacing).

**Maintainer choice:** A — remove the redundant `maximum: undefined` property from `@typescript-eslint/max-params` and retain the canonical shared `max` option. Confirmed by the maintainer on 20 October 2026. Preserve limit 4, `countVoidThis: false`, native replacement ownership, scopes, and public overrides; D12 independently supplies the approved warning severity. Retain Stylistic's intentional `overrides: { arrow: "ignore" }` and its English reason comment, and do not replace the extension's supported option with the unsupported native `countThis` key. Add focused authored-policy protection for the redundant alias during implementation, preserving the existing explicit-option alias allowance. The option removal, related policy checks, and documentation updates remain recorded for implementation; no source option, severity, or comment has changed during decision gathering.

### D14: globally ignore known framework-generated directories

**Current policy:** The shared ignore builder contributes only `**/dist/`, `**/build/`, and `**/coverage/`, followed by the caller's `ignores` patterns. It takes no framework context and runs before feature blocks and user configs. The current defaults therefore include `.next/` and `.svelte-kit/` JavaScript/TypeScript files in an ordinary directory lint. Those folders are generated by Next.js and SvelteKit respectively; Vite's documented default output is already covered by `dist/`.

**Recommendation:** A — add exactly `**/.next/` and `**/.svelte-kit/` to the existing unconditional global directory ignores, before caller patterns. Keep the current three defaults. Apply the same policy at the project root and inside monorepo packages, independently of framework feature toggles or root-manifest detection. This extends the existing default treatment of generated directories without adding framework-config loaders, dependency scans, or new public options.

```ts
// A: existing defaults plus the two known framework-generated directories.
globalIgnores(
  [
    "**/dist/",
    "**/build/",
    "**/coverage/",
    "**/.next/",
    "**/.svelte-kit/",
    ...patterns,
  ],
  "@cravingmaker/eslint-config/ignores",
);
```

**Alternative:** B — retain the current three default ignores and require each consumer to add the framework-generated folders through `createConfig({ ignores: [...] })`. This keeps their inclusion an explicit project decision, but a consumer that omits those additions will lint the generated files after a build or development run.

```ts
// B: current defaults; callers must supply framework output patterns themselves.
globalIgnores(
  ["**/dist/", "**/build/", "**/coverage/", ...patterns],
  "@cravingmaker/eslint-config/ignores",
);
```

**Compared outcomes:** With no additional caller ignores and an ordinary directory lint, both choices still lint authored source. The example generated paths are skipped only under A:

```text
Path                                         A                     B
src/page.js                                  linted                linted
.next/server/page.js                         globally ignored      linted
packages/site/.svelte-kit/generated/root.js   globally ignored      linted
packages/app/dist/generated.js               globally ignored      globally ignored
```

For a generated file containing `export const compare = (value) => { return value == null; };`, the isolated strict-equality check reports an `eqeqeq` error under B; A excludes the file from directory discovery. The same code in `src/page.js` remains reported under both choices. Ignoring generated output does not repair its code or establish its safety; it selects the authored-code lint boundary. An explicitly named ignored file can still produce ESLint's standard ignored-file warning, which is separate from a rule diagnostic during `eslint .`.

**Rationale:** A makes discovery of authored files independent of the presence of these generated folders before or after running the framework (principle 1), and avoids parsing/linting their generated contents (principle 4). One small explicit list in the existing builder remains easy to maintain (principle 2). Unconditional patterns work in mixed monorepos without assuming that the root manifest declares every child application's framework. This is an intentional file-selection policy change for these two directories, not a claim of behavior preservation for their previously linted contents.

**Scope and caller control:** Retain exact directory patterns, including trailing slashes, so unrelated files such as `.next.js`, `.svelte-kit.js`, configuration files, and similar directory names stay linted. Do not infer additional ignores for `out/`, `public/`, `static/`, arbitrary `generated/` directories, or frameworks the factory does not detect. Custom framework output paths and Next.js export/adapter-specific destinations remain the consumer's responsibility through the existing `ignores` option; A does not promise automatic coverage of every build artifact. Preserve caller patterns after defaults. Because these patterns prune whole directories, a file-only negation such as `!**/.next/server/page.js` does not reopen its ignored parent; `!**/.next/` restores matching directories, after which ordinary selection and caller patterns apply. The same principle applies to `.svelte-kit/`. Document that existing ESLint behavior rather than introduce a custom ignore engine.

**Implementation boundaries:** If A is confirmed, update the existing builder's list and concise English explanation, the README option/default-ignore wording, and relevant regression/packed-consumer or policy discovery coverage. Preserve current feature scopes, optional peers, manifest detection, config names/order, user override APIs, existing defaults, and caller negation order. Check root and nested generated directories, authored source/config controls, unchanged existing ignores, additional caller patterns, and deliberate directory restoration. B would keep runtime defaults and instead document explicit consumer additions. No ignore pattern, source comment, framework configuration, dependency, test, snapshot, or README content has changed during decision gathering.

**Focused verification:** Sixty-seven isolated checks used Node.js 26.12.0, ESLint 10.12.0, typescript-eslint parser 8.70.0, and this worktree's actual ignore builder loaded through in-memory transpilation. Forty-eight `isPathIgnored` comparisons covered A/B across eight root/nested Next.js/SvelteKit JavaScript/TypeScript paths, six existing output/coverage paths, and ten authored-source/config/similar-name controls. Four directory-discovery checks compared A/B before and after generating the eight fixture files: A retained the same ten linted authored files; B grew from ten to eighteen. A fifth discovery check verified directory negations restored all eight paths. Ten caller-pattern checks covered an extra generated directory, the ineffective file-only negation, and eight restored paths; four direct lint checks verified retained authored `eqeqeq` reports and generated-file reports under B. Every linted fixture produced the expected native report, with no parser/configuration warnings or unexpected IDs. All assertions passed and the temporary directory was removed. These checks verify the actual ignore helper combined with representative source blocks, not the full factory, framework builds, or typed-project services. The main dependency checkout was read-only. See the official [ESLint directory-ignore documentation](https://eslint.org/docs/latest/use/configure/ignore#ignore-directories), [Next.js output-directory documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/distDir), [SvelteKit output-directory documentation](https://svelte.dev/docs/kit/@sveltejs-kit-vite#outDir), and [Vite build-output documentation](https://vite.dev/config/build-options.html#build-outdir).

**Maintainer choice:** A — add `**/.next/` and `**/.svelte-kit/` to the existing global directory ignores at every depth. Confirmed by the maintainer on 20 October 2026. Keep `dist/`, `build/`, and `coverage/`, apply the two new defaults independently of framework detection/toggles, and preserve caller patterns after the defaults, including documented directory negations. Custom output locations remain configurable through the existing `ignores` option. Add a concise English source explanation and update the README/default-ignore wording and meaningful root/nested/discovery coverage during implementation. Preserve file scopes outside these two directories, optional peers, public APIs, config names/order, and manifest detection. The ignore-list change, explanatory source comment, regressions, and documentation updates remain recorded for implementation; no runtime ignore pattern or related source comment has changed during decision gathering.

### D15: published source maps and runtime debugging

**Current policy and evidence boundary:** `tsconfig.json` enables declarations and `declarationMap: true`; `tsdown.config.ts` sets `dts: true` but does not explicitly choose JavaScript source-map output. The package publishes `dist/` and its package documents, not `src/`. The packed-package test currently requires both `index.d.mts.map` and `index.mjs.map`. R7's reported package sizes came from the original audit build, not a fresh package-size measurement in this decision discussion. New isolated builds with the pinned toolchain verify the option/output relationship and debugging behavior below without rebuilding or mutating this checkout's package.

**Shared change under both choices:** Set `compilerOptions.declarationMap` to `false`, retain `declaration: true` and `dts: true`, and stop publishing the declaration map. In the checked baseline fixture, the declaration map refers to an unpublished TypeScript file and embeds no source content. Removing it preserves the declaration output itself; the choice does not remove consumer types or normal navigation to the published declarations. Do not add the entire source tree to the package merely to make that unused map resolve.

**Reviewed recommendation (not selected):** B — retain only the external JavaScript source map, explicitly setting `sourcemap: true` in the bundler config while disabling declaration maps in the TypeScript config. Keep embedded original source content in the JavaScript map so debuggers can use it without a published `src/` tree. The generated JavaScript retains its normal map-reference comment, and consumers may opt into Node's source-map stack traces.

The relevant `tsconfig.json` compiler options under both choices are below; retain the other existing options.

```json
{
  "declaration": true,
  "declarationMap": false
}
```

```ts
// B: tsdown.config.ts, preserving the existing entry, format, and output directory.
export default defineConfig({
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  // Preserve runtime debugging; declaration maps stay disabled in tsconfig.json.
  sourcemap: true,
});
```

**Selected alternative:** A — publish no source maps. Use the same disabled declaration-map option, with explicit `sourcemap: false` in `tsdown.config.ts`. This emits the runtime module and declaration bundle only, reducing package contents and map maintenance. Runtime behavior and public types remain the same in the checked fixture, but source-map-aware stack traces can no longer resolve this bundle's frames back to its original TypeScript through a bundled map. Generated JavaScript remains available for inspection; A does not make debugging impossible.

```text
Build artifacts under A:             Build artifacts under B:
dist/index.mjs                      dist/index.mjs
dist/index.d.mts                    dist/index.d.mts
                                    dist/index.mjs.map
```

**Compared debugging outcomes:** In an isolated two-source fixture, `src/fail.ts` throws on line 2, column 9. After building, deleting `src/`, and running the package with `node --enable-source-maps runner.mjs`, the matching frame was:

```text
A: at fail (file://<temporary-package>/dist/index.mjs:3:8)
B: at fail (<temporary-package>/src/fail.ts:2:9)
```

The B path identifies the original mapped source; it does not mean that `src/fail.ts` is a physical file in the installed package. The JavaScript map embeds its original text. Without the source-map flag, both choices showed the emitted JavaScript location in this probe. Node's mapping is opt-in/best effort and can be affected by custom stack-trace handling; do not claim that every consumer error report or editor will automatically map frames. These filenames and line numbers are from the minimal fixture, not an assertion about a particular repository error.

**Rationale:** B preserves the ability to trace errors to readable original configuration code (principle 2), which has higher priority than minimizing artifact size (principle 4). Explicit bundler settings make the JavaScript debugging policy independent of an incidental declaration-map toggle (principle 1). Removing the unusable declaration map eliminates a redundant artifact (principle 7). A is appropriate if minimizing published files is preferred over retaining runtime source mapping. Neither map choice changes the configured ESLint rules or prevents lint diagnostics from naming consumer source files; this decision concerns debugging this package's own runtime bundle.

**Implementation boundaries:** Apply the chosen two explicit map settings, preserve declaration generation, public exports, entry/format/output directory, dependency policy, and authored runtime behavior. Add a concise English reason comment in the bundler config. Update the packed-package inventory test to the selected artifact set and verify there is no unresolved declaration-map reference in the declaration bundle. If B is selected, assert that the external runtime map is included, referenced, and contains usable original source content. Compare executable JavaScript and declarations after excluding map-reference comments and their trailing whitespace; do not regenerate unrelated policy snapshots or broaden the published source allowlist. Recheck actual packed file sizes during implementation rather than reuse R7's historical counts as current. No TypeScript/bundler option, source comment, generated output, package allowlist, test, dependency, or README text has changed during decision gathering.

**Focused verification:** Three isolated builds used Node.js 26.12.0, tsdown 0.23.1, rolldown-plugin-dts 0.28.7, Rolldown 1.2.13, and TypeScript 6.0.3, matching the pinned build-tool versions. The fixture loaded this worktree's actual bundler config through in-memory transpilation and copied its TypeScript options, changing only the two map choices. Baseline produced both maps, A produced neither, and B produced only the JavaScript map. Three `npm pack --dry-run --ignore-scripts --json` inventories confirmed the corresponding dist files and absence of `src/`; no registry publish or dependency installation occurred. The B JavaScript map embedded both source files, while the baseline declaration map embedded neither. Four subprocess runs compared A/B with and without `--enable-source-maps` after deleting their fixture sources, verifying the expected original/generated locations and thrown error. Runtime and declaration text matched across all three builds after stripping map-reference comments and normalizing trailing whitespace. All final assertions passed and temporary build directories were removed. An initial text-comparison attempt found only an extra trailing newline next to the map comment; the final comparison explicitly normalizes that non-executable difference. These are build-option, dry-run inventory, and mapped-stack probes on a minimal fixture, not a full repository build, installed-consumer suite, editor-navigation test, or refreshed size benchmark. See the official [tsdown source-map documentation](https://tsdown.dev/options/sourcemap), [declaration-map documentation](https://tsdown.dev/options/dts#declaration-maps), [TypeScript declaration-map reference](https://www.typescriptlang.org/tsconfig/declarationMap.html), and [Node source-map stack-trace option](https://nodejs.org/api/cli.html#--enable-source-maps).

**Maintainer choice:** A — publish neither JavaScript nor declaration source maps. Confirmed by the maintainer on 20 October 2026, with an explicit security concern about exposing original source through maps. Disable `declarationMap` in the TypeScript config and explicitly set `sourcemap: false` in the bundler config, while retaining declaration generation and the runtime/declaration exports. Add the English bundler reason comment `Do not publish original source through source maps.` during implementation. Do not substitute inline or hidden maps, broaden the package source allowlist, or leave stale map files/references in the clean build. Update package-content coverage for only `index.mjs` and `index.d.mts`, alongside the existing package documents. The tested JavaScript map embeds original source; removing it limits that additional disclosure and reduces package contents. This is not a claim that every source map is inherently a vulnerability, that emitted JavaScript becomes confidential, or that map removal replaces secret handling and other security controls. The maintainer accepts the documented loss of mapped TypeScript runtime frames. Source-map settings, explanatory source comments, package tests, and documentation updates remain recorded for implementation; no build option or generated artifact has changed during decision gathering.

### D16: AWS CDK security checks versus a root-manifest gate

**Current policy:** Eighteen `sonarjs/aws-...` entries are explicitly `error` in the existing general SonarJS rule map. Seventeen are in its recommended group and `aws-iam-all-resources-accessible` is in its other-rules group. The exact pinned 4.2.2 metadata identifies all eighteen as non-deprecated and not requiring type information. They currently apply within the existing SonarJS source/component scope, feature file filters/ignores, and user overrides. The builder does not condition them on declared dependencies.

**Original proposal / option A:** Enable the eighteen checks only when the manifest at the resolved `projectRootDirectory` declares `aws-cdk-lib` through the existing dependency reader, otherwise set their defaults to `off`. That reader currently combines `dependencies`, `devDependencies`, and `peerDependencies` from one manifest; it does not scan workspace child manifests or include `optionalDependencies`, and missing/invalid manifests produce an empty set. A can avoid running the checks in a project whose selected root manifest lacks this name. It also suppresses their checks for legitimate child packages and optional dependencies not reflected in that set. Preserve explicit rule entries and apply user overrides after conditional defaults if A is chosen; do not describe that gate as proof that none of the source uses AWS CDK.

**Recommendation:** B — retain all eighteen AWS checks at their existing `error` severity throughout the current SonarJS scope, independently of the root manifest's AWS declaration. This preserves checks on code the rules recognize in monorepos and other valid dependency layouts, without adding recursive package scans or changing dependency detection. Add a concise English explanation of that intentional trade-off in the owning rule groups:

```ts
// Keep AWS CDK checks active: a root manifest may omit workspace or optional dependencies.
"sonarjs/aws-s3-bucket-insecure-http": "error",
```

The comment is a proposed reason for the retained group, not a new rule setting or a request to move only this example rule. Include the separately grouped IAM entry in the same retained policy, preserve the existing group organization/counts, and avoid repeating the same explanation on every entry.

**Reviewed inventory:** The scope of this choice is exactly the eighteen currently authored entries below. This descriptive AWS prefix is not a proposal to enable future upstream rules dynamically.

```text
sonarjs/aws-apigateway-public-api
sonarjs/aws-ec2-rds-dms-public
sonarjs/aws-ec2-unencrypted-ebs-volume
sonarjs/aws-efs-unencrypted
sonarjs/aws-iam-all-privileges
sonarjs/aws-iam-privilege-escalation
sonarjs/aws-iam-public-access
sonarjs/aws-opensearchservice-domain
sonarjs/aws-rds-unencrypted-databases
sonarjs/aws-restricted-ip-admin-access
sonarjs/aws-s3-bucket-granted-access
sonarjs/aws-s3-bucket-insecure-http
sonarjs/aws-s3-bucket-public-access
sonarjs/aws-s3-bucket-versioning
sonarjs/aws-sagemaker-unencrypted-notebook
sonarjs/aws-sns-unencrypted-topics
sonarjs/aws-sqs-unencrypted-queue
sonarjs/aws-iam-all-resources-accessible
```

**Compared outcomes:** Consider a monorepo whose root `package.json` lists workspace packages but no `aws-cdk-lib`, while `packages/infrastructure/package.json` declares it. The root config still selects source files in that child package. For this source fragment, where `scope` is the surrounding CDK construct, the selected S3 rule has different outcomes:

```js
import { Bucket } from "aws-cdk-lib/aws-s3";

export const bucket = new Bucket(scope, "Artifacts", { enforceSSL: false });
```

```text
A: The root dependency gate disables the rule; no report from this S3 check.
B: One sonarjs/aws-s3-bucket-insecure-http error is retained.
```

With `enforceSSL: true`, the isolated S3 check reports neither choice. If the selected root manifest declares AWS CDK in one of the three supported fields, both choices enable it and report the false-setting example. Code importing an unrelated library with a class named `Bucket` produced no S3 report. The report identifies security-sensitive HTTP configuration for review; this probe does not establish the deployed bucket policy or evaluate every possible external security control. These comparisons isolate this S3 diagnostic, not acceptance or total diagnostics under the complete shared config.

**Rationale:** B follows the same security convention for equivalent recognized source regardless of whether its dependency is listed in the config root or a workspace child (principle 1). It preserves a demonstrated security report (principle 3), which has higher priority than the original rule-time optimization (principle 4). The AWS recognizer can resolve imported constructor names from the linted syntax without consulting the root manifest or resolving a physically installed CDK package in this probe. It is therefore inaccurate to claim these rules cannot report merely because that manifest omits `aws-cdk-lib`. B accepts continued rule execution in files without recognized CDK use; no new timing benchmark or universal performance estimate is claimed. A remains available as an explicit coverage/performance trade-off, but is no longer recommended as lossless cleanup.

**Override and implementation boundaries:** Preserve disabling the entire SonarJS feature, its existing file scopes/ignores, the shared typed boundary, canonical plugin name, all non-AWS settings, manifest-reading semantics, and public override order. A user may explicitly change these rules using the current override API under either default policy. B retains the existing runtime settings; add the group explanation and meaningful regression coverage for a root config linting a child CDK package. If A is chosen, implement only the reviewed eighteen-entry gate before overrides, document the lost root-absent coverage, and cover selected-root/manifest behavior rather than change the dependency reader or silently scan new files. No AWS SDK/CDK dependency, framework detector, project-root behavior, custom option, or additional feature is authorized by this decision. No SonarJS runtime rule, scope, dependency, test, or contributor instruction has changed during decision gathering; the two retained-policy reason comments were added after confirmation as recorded below.

**Focused verification:** Seventy-eight checks used ESLint 10.12.0, typescript-eslint parser 8.70.0, and the exact SonarJS 4.2.2 npm archive. This worktree's actual context/options preparation, shared source globs, and authored rule map were loaded through in-memory transpilation. Inventory assertions verified eighteen current error entries and their non-deprecated/untyped metadata. Eight prepared-root checks covered a regular dependency, dev dependency, peer dependency, optional-only dependency, workspace-child-only dependency, empty manifest, missing manifest, and malformed manifest. Sixteen calculated-config comparisons verified all eighteen effective severities under A/B. Forty-eight lint comparisons isolated the S3 HTTP check for insecure, secure, and ordinary-source fixtures in those eight layouts under both choices; all expected reports were error-level and no parser/configuration diagnostics were accepted. Six more import/recognizer checks covered named, namespace, aliased, and root-namespace imports, omitted `enforceSSL`, and an unrelated-library control. The workspace fixture's root dependency set omitted CDK while its child manifest declared it; only B retained the insecure S3 report. All assertions passed. Temporary projects, downloaded rule archives, and a temporary missing helper dependency were removed; existing dependency files were used read-only, with no CDK installation or cloud deployment. The complete eighteen-rule diagnostic interaction, full factory/typed-project services, and new timing were not tested. See the official [SonarJS S3 rule source](https://github.com/SonarSource/SonarJS/blob/master/packages/analysis/src/jsts/rules/S6249/rule.ts) and [AWS CDK SSL-enforcement option](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.BucketProps.html#enforcessl).

**Maintainer choice:** B — retain all eighteen AWS CDK rules at their existing error severity within the current SonarJS scope, without conditioning them on the root manifest. Confirmed by the maintainer on 20 October 2026. Preserve security reports for workspace-child and optional-dependency layouts, current feature/file/typed boundaries, public overrides, and manifest-reading semantics. The proposed English group reason was added above the seventeen-entry AWS group, with a matching concise explanation for the separately grouped IAM rule. These source edits are comments only; no rule value, runtime scope, dependency, or detector changed. Regression/contributor-documentation work remains recorded for implementation. The root-gating proposal is rejected; the original timing percentages are not a justification to drop demonstrated diagnostic coverage.

### D17: test-rule scope versus the shared filename role

**Current scope and refreshed inventory:** The SonarJS map currently enables twenty entries whose names explicitly identify tests or test-runner behavior. These candidates are listed below rather than rely on P9's older eighteen-rule count. The exact pinned 4.2.2 metadata identifies all twenty as non-deprecated. Nineteen run without type information in the existing SonarJS source/component scope; `assertions-in-tests` remains disabled there and is enabled only through the existing shared typed scope. Related general assertion/Chai rules whose names do not identify this test group are outside this proposed restriction and keep their independent current policy.

| Rule suffix after `sonarjs/`                    | Existing severity | Existing information requirement |
| ----------------------------------------------- | ----------------- | -------------------------------- |
| `assertions-in-test-cases`                      | `error`           | untyped                          |
| `assertions-in-tests`                           | `warn`            | typed scope only                 |
| `async-test-assertions`                         | `error`           | untyped                          |
| `explicit-test-skip`                            | `error`           | untyped                          |
| `hooks-before-test-cases`                       | `error`           | untyped                          |
| `no-debug-commands-in-ui-tests`                 | `error`           | untyped                          |
| `no-duplicate-parameterized-test-case`          | `error`           | untyped                          |
| `no-duplicate-test-title`                       | `error`           | untyped                          |
| `no-empty-parameterized-test-dataset`           | `error`           | untyped                          |
| `no-empty-test-file`                            | `error`           | untyped                          |
| `no-empty-test-title`                           | `error`           | untyped                          |
| `no-exclusive-tests`                            | `error`           | untyped                          |
| `no-fixed-wait-in-tests`                        | `error`           | untyped                          |
| `no-skipped-tests`                              | `warn`            | untyped                          |
| `parameterized-tests`                           | `warn`            | untyped                          |
| `stable-tests`                                  | `error`           | untyped                          |
| `test-check-exception`                          | `error`           | untyped                          |
| `testing-library-prefer-query-by-disappearance` | `error`           | untyped                          |
| `testing-library-query-assertion`               | `error`           | untyped                          |
| `vitest-mock-at-module-scope`                   | `error`           | untyped                          |

**Original proposal / option A:** Restrict this reviewed group to the existing `test-files` role: `**/*.{test,spec}.*`, intersected with the current source, SonarJS feature, and information scopes. Outside that role, set the group's defaults to `off`; keep their current severities and options inside it. This avoids running them across other selected source files, but treats a filename convention as the default eligibility boundary. In particular, it suppresses currently available reports in `__tests__/checkout.js`, `test/checkout.js`, `tests/checkout.ts`, and a standalone `test.js` unless the consumer explicitly restores them. Do not label that scope change lossless or silently rename consumer files.

**Recommendation:** B — retain the group's existing rule scopes and let the installed rules recognize their supported test APIs and, where relevant, their own filename/settings requirements. Keep `assertions-in-tests` behind its current typed guard, preserve existing severities, and add a concise English policy explanation during implementation:

```ts
// Keep test checks in their current scope: runners also support filenames outside .test/.spec.
```

This revises the initial role-only recommendation after checking supported filenames and actual diagnostic loss. B does not enable test-rule coverage on every file type: the SonarJS feature's existing source/component scope, file filters/ignores, typed boundaries, feature toggle, and public overrides still apply. It also does not claim that every rule internally uses identical test detection or that name-based test recognizers can never report on similarly named non-test APIs.

**Compared outcomes:** Jest supports ordinary source filenames inside `__tests__/`, and Mocha's default directory also accepts files without `.test` or `.spec`. For an illustrative Jest file `__tests__/checkout.js`, lint this test:

```js
it.only("checks checkout", () => {
  expect(1).toBe(1);
});
```

```text
A: No sonarjs/no-exclusive-tests report; the file is outside the shared test role.
B: One sonarjs/no-exclusive-tests error is retained.
```

The same source at `checkout.test.js` is reported under both choices. A normal `it(...)` case without `.only` receives no report from that isolated rule under either choice. The typed missing-assertion check shows the same boundary: a Node test with no assertion is still warned under B in `__tests__/check.ts` and `test/check.ts`, but not under A; an equivalent `.test.ts` case is warned under both. These are comparisons of selected rule diagnostics, not a promise about total reports from the full shared policy or execution by a configured test runner.

**Rationale:** B applies the same checks to equivalent recognized tests regardless of supported filename conventions (principle 1), and preserves reports that help maintain a reliable test suite (principle 2). Those benefits take priority over the original rule-execution optimization (principle 4). The existing role is suitable for its documented exceptions, but is not an exhaustive discovery contract for every consumer runner, custom include pattern, setup/helper file, or inline test. Changing that global role would also affect unrelated Functional exceptions and potentially other decisions, so do not broaden it incidentally as a way to hide A's coverage trade-off. No new timing or universal performance improvement is claimed.

**Implementation and override boundaries:** Under B, keep all current settings and scope/typed composition, add the English retained-policy reason, and add meaningful alternate-filename regression coverage using the existing test helpers. Existing runner recognition, rule-specific settings, SonarJS `files`/`ignores`, feature toggles, user-config ordering, and type-aware override guards stay intact. If A is chosen, use the exact twenty-entry reviewed group with explicit defaults and existing file-scope helpers, intersect its single typed member with both the test role and existing typed scope, preserve later explicit overrides, and document accepted diagnostic loss. Do not dynamically select future rules by a `test` substring, scope general assertion rules through this decision, scan or execute runner configs, infer that an off rule has no possible report, or add a new plugin/API. D18 separately addresses repository naming. No SonarJS runtime rule, test-role glob, typed boundary, fixture, dependency, or contributor instruction has changed during this review; the retained-policy reason comment was added after confirmation as recorded below.

**Focused verification:** One hundred four comparisons used Node.js 26.12.0, ESLint 10.12.0, typescript-eslint parser 8.70.0, TypeScript 6.0.3, and the exact SonarJS 4.2.2 npm archive. This worktree's source globs, actual `test-files` role, rule maps, typed-off map, and typed-scope helper were loaded through in-memory transpilation. Metadata assertions verified the twenty-entry inventory and sole typed member. Thirty-six calculated-config checks covered A/B, typed linting on/off, and nine root/nested/alternate/source paths, asserting every candidate's effective severity. Fifty-four isolated exclusive-test lint comparisons covered offending, ordinary-test, and ordinary-source fixtures at those nine paths under both choices. Twelve typed missing-assertion comparisons used six real files and a TypeScript program with no compiler diagnostics, checking `.test.ts`, `__tests__/`, and `test/` cases with and without a Node assertion under A/B. Two explicit-later-override checks verified re-enabling the exclusive-test rule under A and disabling it under B. All final assertions passed; parser/configuration warnings and unexpected IDs/severities were rejected. An initial probe supplied nested file-role arrays to a string-only helper parameter and failed configuration validation; the corrected probe intersects the test patterns through the typed helper's supported `files` option. This was a probe construction error, not a repository runtime failure. Temporary files, archives, and a temporary helper dependency were removed; primary dependencies were read-only. These probes compare representative blocks and two selected diagnostic implementations, not the complete twenty-rule interaction, full factory/runner execution, or a refreshed performance benchmark. See the official [Jest discovery defaults](https://jestjs.io/docs/configuration#testmatch-arraystring), [Mocha default test glob](https://mochajs.org/running/test-globs/), [Vitest configurable includes](https://vitest.dev/config/include), and [SonarJS exclusive-test rule source](https://github.com/SonarSource/SonarJS/blob/master/packages/analysis/src/jsts/rules/S6426/rule.ts).

**Maintainer choice:** B — retain the current scopes and severities of the twenty reviewed test-rule entries, including the existing typed-only guard for `assertions-in-tests`. Confirmed by the maintainer on 20 October 2026. Do not restrict this group to the shared `.test`/`.spec` filename role or broaden that role as a workaround. Preserve alternate-filename diagnostics, feature/file/typed boundaries, rule-specific recognition/settings, and public overrides. The proposed concise English scope reason was added above the owning recommended-rule group. This is a comment-only source edit; no rule value, file-selection pattern, or typed setting changed. Alternate-filename regression and contributor-documentation work remains recorded for implementation. The original role-only optimization is rejected.

### D18: repository naming and module layout

R11 combines independent structural choices. Review them separately so choosing a feature folder name does not implicitly approve moving typed policy, merging upstream category groups, or changing test organization. The discussion sequence is D18.1 (the import feature folder), D18.2 (uncategorized rule-module names), D18.3 (the React HTML category typo), D18.4 (Node's typed-policy location), D18.5 (test paths and direct feature coverage), and D18.6 (the ambient type-declaration location). D18.1–D18.6 are confirmed as A; every structural choice in this group has been recorded. None authorizes consumer filename enforcement or lint-policy changes merely to make the repository layout uniform.

#### D18.1: the import feature's folder name

**Current structure:** The public option and builder are `imports`, the three emitted block names use `imports/`, and the existing feature test is `tests/configs/imports.test.ts`. Its six source modules instead live under `src/configs/plugins/import-x/`, named after the installed plugin and its `import-x/...` rule namespace. Three code imports refer to this folder: `src/factory.ts`, `tests/configs/imports.test.ts`, and `tests/configs/code-quality.test.ts`. The contributor feature-policy table contains one additional current path reference. Historical audit paths are evidence of the original layout and are not live imports.

**Recommendation:** A — rename only this internal source folder from `import-x/` to `imports/`, preserving its `index.ts`, policy composition, and category modules. Use the existing feature name as the contributor-facing directory name. Update the three referring code imports and contributor table path. The existing test filename already matches that feature name; decisions about its directory are deferred to D18.5.

```text
A: align the internal folder with the existing imports feature.

src/configs/plugins/imports/
  index.ts
  rules.ts
  rules/
    helpful-warnings.ts
    module-systems.ts
    static-analysis.ts
    style-guide.ts
tests/configs/imports.test.ts
```

**Alternative:** B — keep `src/configs/plugins/import-x/` and document it as an intentional plugin-named directory, while the public feature, block names, and tests continue to use `imports`. This prioritizes direct correspondence with the plugin name rather than one feature-facing name across those locations. It requires a documented mapping rather than a source-folder move; it does not require renaming the public option or block names to match the directory.

```text
B: retain the current plugin-named folder.

src/configs/plugins/import-x/
  index.ts
  rules.ts
  rules/
    helpful-warnings.ts
    module-systems.ts
    static-analysis.ts
    style-guide.ts
tests/configs/imports.test.ts
```

**Import example:** The factory reference changes only under A:

```ts
// A
import { imports } from "./configs/plugins/imports/index.js";

// B
import { imports } from "./configs/plugins/import-x/index.js";
```

**Namespace and API boundary:** Under both choices, the installed dependency remains `eslint-plugin-import-x`, the resolver dependency keeps its name and settings, plugin registration stays `plugins: { "import-x": pluginImportX }`, and every authored rule key stays `import-x/...`. The `imports` public option, builder export, block names `imports/setup`, `imports/rules`, and `imports/resolver`, file scopes, ordering, options, overrides, and runtime behavior retain their existing contracts. A filesystem name is not a reason to rename the plugin namespace or rewrite consumer rule IDs. The package exports only its root and package manifest; this internal source directory is not a public package subpath.

**Rationale:** A makes the feature, its directory, its emitted block labels, and its current test stem use the same contributor-facing name (principle 1), reducing the mapping needed when finding implementation and tests (principle 2). B remains a valid explicit convention if plugin identity should determine the directory name. This decision is deliberately local: preserve `core/` with the existing `javascript` public feature and keep the separately owned `package-json/` and `enforce-package-type/` builders as already established. It does not approve mechanically renaming every folder after a public option or merging distinct plugins that share one option. Category labels, typed-policy separation, test paths, and ambient declarations are independent D18 follow-ups.

**Implementation boundaries:** If A is confirmed, move exactly the six source modules without editing their policies or relative module depth, update the three live code references and contributor-table path, and document the feature-folder convention and its intentional exceptions. Check other current references before applying the move; preserve historical audit examples as dated evidence rather than bulk-replacing every `import-x` string. Verify build/type resolution, packed exports, effective rule/settings equality, resolver behavior, and ordinary test discovery during implementation. Do not rename the package dependency, plugin namespace, rule keys, public options, emitted blocks, category exports, fixtures, or unrelated folders through this decision. B would retain the folder and document the naming exception. No source folder, referring import, contributor instruction, package export, runtime value, test location, or consumer configuration has changed during this discussion.

**Focused verification:** Current-source inspection identified six modules, four category maps, forty-six authored rule entries, exactly three live TypeScript imports, and one contributor-table path reference outside historical audit text. An isolated temporary copy of the six-file tree under the proposed name was byte-identical by SHA-256. In-memory module resolution evaluated the current and proposed logical rule-map paths and compared all forty-six entries, including options and disabled settings; they were identical. The three proposed caller rewrites parsed without TypeScript syntax errors and resolved to the planned builder path. Additional assertions verified the existing plugin namespace, all three emitted block names, the absence of an existing destination folder, and the package's root/manifest-only exports. All structural assertions passed and temporary files were removed. This is a review of a concrete proposed path mapping and authored policy, not a full build, factory execution, resolver test, or claim that the actual move has been implemented. Existing dependencies were used read-only.

**Maintainer choice:** A — rename `src/configs/plugins/import-x/` to `src/configs/plugins/imports/`, preserving its six modules and category organization. Confirmed by the maintainer on 20 October 2026. Update the factory import, the two direct test imports, and the contributor table path during implementation. Retain the existing `imports` public option/builder/block names and `import-x` dependency, plugin namespace, rule keys, resolver settings, options, scopes, composition order, and public exports. The current `imports.test.ts` stem already matches the selected feature name; test directory organization is deferred to D18.5. Preserve the established `core`/`javascript` mapping and separate package-json/enforce-package-type ownership. The folder move, referring imports, and contributor-documentation changes remain recorded for implementation; no source path or runtime configuration has changed during decision gathering.

#### D18.2: one filename for the remaining-rule group

**Current naming:** Unicorn uses `rules/other.ts`, while package-json uses `rules/other-rules.ts`. Both export `otherRules` into the feature's `rules.ts` composition. The groups retain different upstream meanings: Unicorn's file contains thirty-six non-recommended entries, while package-json's file contains seventeen entries outside its two main property categories, with its own recommended/other subgroups. Standardizing a filename does not merge those meanings or change their policy.

**Recommendation:** A — use `other.ts` consistently for this remaining-rule module inside a feature's `rules/` directory. Rename only `src/configs/plugins/package-json/rules/other-rules.ts` to `other.ts`, update its composition import, and document the convention in `CONTRIBUTING.md`. Unicorn already follows this name.

```text
A: use other.ts for both features.

src/configs/plugins/unicorn/rules/other.ts
src/configs/plugins/package-json/rules/other.ts
```

**Alternative:** B — use `other-rules.ts` consistently. Rename only Unicorn's `rules/other.ts` to `other-rules.ts`, update that composition import, and document this name as the convention. Package-json already follows it. The longer filename states its content when viewed without its parent directory.

```text
B: use other-rules.ts for both features.

src/configs/plugins/unicorn/rules/other-rules.ts
src/configs/plugins/package-json/rules/other-rules.ts
```

**Compared composition imports:** Both choices retain the same named export and authored rule values:

```ts
// A
import { otherRules } from "./rules/other.js";

// B
import { otherRules } from "./rules/other-rules.js";
```

**Rationale:** Both choices make equivalent fallback-module naming consistent (principle 1). A is readable in its existing `rules/` directory (principle 2) and avoids repeating that directory's role in the filename (principles 7 and 9). This is a naming preference with no intended diagnostic difference. Preserve upstream categories and recommended/default/overridden/off grouping inside the modules; the choice is not a new classification rule for every plugin.

**Implementation boundaries:** Move only the one file required by the selected convention, update its one live composition import, and adjust contributor wording. Keep exports, order, rule IDs, severities/options, counts appropriate to the eventual implementation state, English reason/fixability comments, and source/test/public scopes intact. Do not rename the `otherRules` export, alter package dependencies, merge categories, split every flat `rules.ts`, or rename official category files such as Functional's `no-other-paradigms.ts`. Historical audit paths remain evidence of the original structure. Verify the selected path resolves and authored/effective policy is unchanged for this structural move, separately from approved behavioral changes elsewhere. No source path, import, export, contributor text, runtime policy, or test has changed during this discussion.

**Focused verification:** Source inspection identified exactly one live TypeScript composition import for each candidate filename and package-json's current contributor reference. Both destination paths are currently absent. In-memory logical-path probes evaluated the complete Unicorn and package-json compositions under the current layout and both proposed conventions, preserving the moved module contents. All 374 current authored Unicorn entries and 99 package-json entries, including options and disabled values, were identical under A and B. Proposed compositions parsed without TypeScript syntax errors. All assertions passed; no directory/file was moved, no runtime dependency was loaded for the policy-only comparison, and no persistent test was written. These probes do not replace build/resolution/effective-policy validation during implementation.

**Maintainer choice:** A — use `other.ts` consistently for these remaining-rule modules. Confirmed by the maintainer on 20 October 2026. Rename only package-json's `rules/other-rules.ts` to `rules/other.ts`, update its single composition import, and document the convention. Unicorn already follows the selected name. Preserve both features' `otherRules` exports, upstream classifications, composition order, every rule value/option, and source comments; do not rename official categories such as `no-other-paradigms.ts`. The file move, import update, and contributor-documentation change remain recorded for implementation; no source path or runtime setting has changed during decision gathering.

#### D18.3: React HTML category spelling variants

**Current evidence:** The pinned `@html-eslint/eslint-plugin-react` 0.66.1 metadata assigns eight rules to `Best Practice`, one (`no-duplicate-classname`) to `Best Practices`, and one to `Stylistic Issues`. The source follows those strings literally with `html-best-practice.ts`, `html-best-practices.ts`, and `html-stylistic-issues.ts`. The first two files export almost identically named category maps, and both are imported only by the React feature's `rules.ts`. This verifies the spelling split, not an upstream maintainer statement that one label is a bug.

**Recommendation:** A — treat `Best Practice` and `Best Practices` as one explicitly documented local category. Keep the dominant existing name `html-best-practice.ts`, move the duplicate-classname entry and its shared-options import into it, and remove the now-unused plural file/export/import. The resulting category has nine rules; `html-stylistic-issues.ts` continues to hold its one separate rule. Add an English comment documenting the exact upstream label aliases:

```ts
// Treat upstream Best Practice and Best Practices as one local category.
// Preserve the current composition order.
```

```text
A: one locally normalized category.

react/rules/html-best-practice.ts       9 rules
react/rules/html-stylistic-issues.ts    1 rule
```

**Alternative:** B — retain the literal upstream split and both current filenames/exports, with an English explanation that their near-identical names follow distinct metadata strings. This preserves a strict one-file-per-upstream-label mapping and requires no merge, at the cost of two locally separate groups distinguished only by a plural suffix.

```text
B: preserve both upstream label spellings literally.

react/rules/html-best-practice.ts       8 rules
react/rules/html-best-practices.ts      1 rule
react/rules/html-stylistic-issues.ts    1 rule
```

**Same diagnostic outcome:** The duplicate-classname setting remains `@html-eslint/react/no-duplicate-classname: ["error", { ...classNameOptions }]`. Under both layouts, `export const card = <div className="card card" />;` produced the same single duplicate-classname error, and autofix produced the same source with one `card`. Classname spacing, obsolete-tag, invalid-attribute, and clean-control probes also retained their respective results. A changes local file/category organization, not the rule's ID, options, or implementation.

**Rationale:** A gives equivalent category spellings one local representation (principle 1) and removes two almost identical filenames/export names from routine navigation (principle 2). Keep exact upstream names in the comment so dependency reviews can trace the normalization. B favors literal metadata correspondence and remains valid if that trace should determine the file boundary. Under A, document this specific alias exception to the contributor convention of following official category names; do not normalize arbitrary categories dynamically or erase their provenance.

**Ordering and implementation boundaries:** Preserve the complete ten-entry HTML rule map and its current key/composition order. The existing composition places the duplicate-classname entry before the eight singular-label entries; the checked merged form retains that order, including the overridden-options group before the default-options group, with an explicit preservation comment. Keep each group's options, English fixability/reason annotations, and correct counts: nine category entries with two fixable rules, alongside the separate one-rule stylistic map. Preserve shared `classNameOptions`, all twenty-eight Hooks policy entries, all three React Refresh variants, optional-peer filtering, feature/parser/typed scopes, public options, namespaces, overrides, and block order. Update only the owning category module, the redundant module's removal, the composition import/spread/counts, and documented alias convention during implementation. Do not rename general HTML/Svelte category files, update dependencies, merge Stylistic Issues, or move tests through this decision. No source category, export, import, rule setting, dependency, contributor text, or test has changed during decision gathering.

**Focused verification:** Installed React HTML plugin 0.66.1 metadata confirmed the 8/1/1 category split and matched this worktree's lockfile. An in-memory proposed merge loaded the actual nine rule entries and shared options, combined them in their existing effective order, and updated only the proposed composition. It preserved every value and key order of the ten-entry HTML map, all twenty-eight Hooks entries, and the result of each of the three Refresh variants. Four calculated-config checks used `.jsx` and `.tsx` paths under A/B. Twelve lint comparisons covered six fixtures under both choices: duplicate class names, class spacing, clean classes, an obsolete tag, an invalid attribute value, and a valid button. Four fix runs compared duplicate-classname and spacing results under A/B. Every expected rule ID, parser success, clean control, diagnostic array, and fixed output matched; all assertions passed. Tests used ESLint 10.12.0 and typescript-eslint parser 8.70.0 with the pinned React HTML plugin. No persistent files or tests were written for the proposal. These are authored-map and representative HTML diagnostic/fix comparisons, not a full factory, minimum-peer, or React application build. See the official [React HTML rule inventory](https://html-eslint.org/docs/react/rules) and [duplicate-classname rule documentation](https://html-eslint.org/docs/react/rules/no-duplicate-classname); the exact category counts above come from the pinned package metadata, not an inferred documentation heading.

**Maintainer choice:** A — treat the upstream `Best Practice` and `Best Practices` spellings as one documented local category. Confirmed by the maintainer on 20 October 2026. Keep `html-best-practice.ts` with all nine category entries, remove the redundant plural module/export/import, and retain the separate stylistic module. Add the English alias and order-preservation comments during implementation, documenting this specific exception to literal upstream category mapping. Preserve the current effective rule key order, including the existing duplicate-classname position, every option/annotation, shared class-name options, Hooks/Refresh policy, peer compatibility, namespaces, scopes, and public overrides. The category merge, source comments, composition/count updates, and contributor-documentation changes remain recorded for implementation; no React source module or runtime setting has changed during decision gathering.

#### D18.4: the Node feature's TypeScript-specific policy location

**Current structure:** `node/rules.ts` owns the forty-three-entry Node policy and also exports two one-entry maps: `typescriptRulesOff` disables `n/no-sync` in TypeScript/component files, and `typeAwareRules` restores the existing `nodeRules["n/no-sync"]` tuple in the shared typed scope. The Node builder imports all three from that file. Functional, SonarJS, and TypeScript instead keep their specialized typed maps in `rules-type-aware.ts`. This is a source-organization difference; the current Node scope behavior is already deliberate and covered by tests.

**Recommendation:** A — move the two existing specialized maps into `src/configs/plugins/node/rules-type-aware.ts`, importing `nodeRules` from `rules.ts` to retain the single authored owner and shared options. Update the builder's imports and the contributor policy table. Keep the names `typescriptRulesOff` and `typeAwareRules`, because the former's TypeScript-specific meaning matters.

```text
A: separate the TypeScript-specific maps.

node/index.ts              builder and scope composition
node/rules.ts              43-entry base policy
node/rules-type-aware.ts   TypeScript disable and typed reactivation maps
```

```ts
// A: node/index.ts imports.
import { typeAwareRules, typescriptRulesOff } from "./rules-type-aware.js";
import { nodeRules } from "./rules.js";
```

**Alternative:** B — keep the current combined `rules.ts`, documenting it as a deliberate small-feature exception because the specialized maps each contain only the same single rule. This minimizes file count while retaining the existing explicit exports and comments.

```text
B: retain the current combined policy module.

node/index.ts              builder and scope composition
node/rules.ts              base policy and both TypeScript-specific maps
```

**Behavioral guardrail under both choices:** Do not turn Node into a globally typed-only feature. The existing policy keeps `n/no-sync` active in ordinary JavaScript without type information, disables it in TypeScript files/components outside typed linting, and restores it in the eligible typed scope. The move must preserve that policy and its override order, including the builder's separate `node/rules-typescript` block. Keep `allowAtRootLevel: true`, current ignore options, and the existing tuple reference rather than duplicate the option literal. A suitable English explanation in the extracted module is:

```ts
// TypeScript-specific guards and reactivation; JavaScript keeps the base n/no-sync policy.
```

For an imported `readFileSync` call inside an arrow function, the compared outcomes were identical:

```text
Ordinary JavaScript:                A error      B error
TypeScript without typed linting:   A no report  B no report
TypeScript within typed linting:    A error      B error
```

These describe the existing package policy and selected diagnostic, not a universal claim that every configuration of the upstream rule always requires type services for every TypeScript input. Both layouts also retained the configured top-level synchronous-call allowance.

**Rationale:** A gives contributors the same location for specialized typed policy across these features (principle 1), while making the two guarded maps easy to find and distinguish from the base Node policy (principle 2). B reasonably favors a smaller file count for a one-rule specialization. Under A, the new file is a static ownership split with an explicit dependency on the existing base map; it does not introduce a registry, dynamic discovery, duplicate authored options, or a circular dependency.

**Implementation boundaries:** Extract only the existing two maps and their explanations, preserve the forty-three-entry base map and key order, update the builder imports, and document the Node table entry with both policy files. Preserve `n` rule IDs, counts, comment annotations, block names/order, typed/file/component scopes, feature filters/ignores, user overrides, Node-version inference, import-resolution ownership, optional peer behavior, and public API. Do not rename the TypeScript-specific off map to imply a universal untyped guard, add a generic typed-rule filter that suppresses the JavaScript policy, or change other features through this decision. Verify effective rules and representative typed/untyped behavior during implementation, using existing Node scope tests. No Node module, import/export, runtime option, scope, source comment, dependency, test, or contributor instruction has changed during decision gathering.

**Focused verification:** An in-memory proposed extraction evaluated this worktree's actual Node builder, maps, context/options, globs, and file/typed-scope helpers. It preserved all forty-three base entries and their key order, both specialized map values, and strict reference identity between the typed tuple and its base owner. Fifty-eight calculated-config comparisons covered A/B across JavaScript, TypeScript, declaration files, rune-named modules, Svelte components, excluded generated components, file filters, ignore negations, enabling overrides, and disabling overrides. Ten lint comparisons exercised nested synchronous reads in ordinary JavaScript, untyped TypeScript, and typed TypeScript, plus the permitted top-level JavaScript/typed cases. Typed fixtures used a TypeScript program with no compiler diagnostics; every actual report was the expected `n/no-sync` error, and A/B diagnostic arrays matched. All assertions passed using Node.js 26.12.0, ESLint 10.12.0, typescript-eslint parser 8.70.0, TypeScript 6.0.3, and eslint-plugin-n 18.4.1. Temporary fixture files were removed, primary dependencies were read-only, and the proposed source changes existed only in memory. This is Node-feature composition/diagnostic verification, not a full factory build or the complete repository suite. See the official [synchronous-call rule documentation](https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-sync.md); the specialized scope described here comes from this package's current builder and tests.

**Maintainer choice:** A — extract `typeAwareRules` and `typescriptRulesOff` into `src/configs/plugins/node/rules-type-aware.ts`, preserving the single base owner in `rules.ts`. Confirmed by the maintainer on 20 October 2026. Update the builder imports and contributor table, carry the existing explanations, and add the concise English explanation of the TypeScript-specific guard. Preserve JavaScript activation, untyped TypeScript/component suppression, typed reactivation, tuple identity/options, all forty-three base entries, effective key/block order, scopes, override handling, inference, and public API. Do not introduce a universal typed-only restriction or duplicate the option tuple. The module extraction, source comments, import/export update, and documentation change remain recorded for implementation; no Node source module or runtime setting has changed during decision gathering.

#### D18.5: test ownership, paths, and meaningful feature coverage

**Current evidence:** The repository has sixty-two test files. Most single-feature suites are flat files such as `tests/configs/node.test.ts`, although their builders live under `src/configs/plugins/<feature>/index.ts`. TypeScript and core already have test directories, but the former omits the source's `plugins/` segment and the latter places category tests beside its builder test. Tests for the four modules in `src/utilities/` are scattered across `tests/configs/`, `tests/factory/`, and the test root. `type-aware-scope.test.ts` combines pure `overridesWithoutTypeInformation` cases with factory-level typed-scope integration. Generated-rule declaration checks are at `tests/typegen.test.ts`, while other script tests already use `tests/scripts/`. The root `tests/utilities.ts` is a shared lint-assertion helper, rather than a test of the source utilities.

Comments is already covered by the twelve-feature parameterized builder contract in `tests/configs/code-quality.test.ts`; it is not an untested feature. Global ignores also have effective-snapshot coverage. Neither coverage fact guarantees a dedicated regression for directive diagnostics or caller ignore-pattern ordering. A file for every rule/category/declaration would add little value when existing behavior tests already cover its contract.

**Recommendation:** A — organize tests by their implementation owner. A dedicated feature or utility suite follows that owner's source path under `tests/`; a suite spanning features stays under `tests/policy/`, and factory orchestration, package consumers, scripts, and shared test support have explicit homes. Name builder suites `index.test.ts`, matching the existing builder modules. Keep purpose-named feature integration suites such as Svelte's script checks within the owning feature directory; they do not require a source file with the same stem.

```text
A: source ownership determines the test location.

src/configs/plugins/node/index.ts
tests/configs/plugins/node/index.test.ts

src/utilities/file-scope.ts
tests/utilities/file-scope.test.ts

scripts/typegen.ts
tests/scripts/typegen.test.ts

tests/support/lint.ts                  shared test helper
tests/support/lint.test.ts             the helper's own regression checks
tests/support/describe-file.ts         shared effective-config description helper
tests/policy/code-quality.test.ts      shared builder contract
tests/policy/type-aware-scope.test.ts  cross-feature integration
```

**Alternative:** B — retain the current test locations and flat feature filenames, and replace the contributor guide's implied exact mirroring with an explicit ownership map and documented exceptions. Keep the mixed helper/integration file and existing shared-helper paths. This avoids the structural migration and keeps feature import paths shorter. Apply the same meaningful behavior-coverage standard described below.

```text
B: keep the current locations and document their owners.

src/configs/plugins/node/index.ts
tests/configs/node.test.ts

src/utilities/file-scope.ts
tests/configs/file-scope.test.ts

scripts/typegen.ts
tests/typegen.test.ts

tests/utilities.ts                      shared test helper
tests/utilities.test.ts                 the helper's own regression checks
tests/configs/describe-file.ts          shared effective-config description helper
tests/configs/code-quality.test.ts      shared builder contract
tests/configs/type-aware-scope.test.ts  utility cases and integration
```

For example, importing the same Node builder requires different relative depth:

```ts
// A: tests/configs/plugins/node/index.test.ts.
import { node } from "../../../../src/configs/plugins/node/index.js";

// B: tests/configs/node.test.ts.
import { node } from "../../src/configs/plugins/node/index.js";
```

**Concrete A migration:** Move the nineteen existing flat single-plugin suites into `tests/configs/plugins/<feature>/index.test.ts`, using the already-selected `imports` feature name. Move TypeScript's existing two tests under `tests/configs/plugins/typescript/`, and Svelte's extra script suite to `tests/configs/plugins/svelte/scripts.test.ts`. Keep `tests/configs/core/index.test.ts`; move its two category tests under `tests/configs/core/rules/`. Move the exceptions suite to `tests/configs/exceptions/index.test.ts`. Move file-scope, import-peer, and plugin-policy unit suites into `tests/utilities/`. Extract only the pure override-filter cases and their three case-data declarations into `tests/utilities/type-aware.test.ts`; retain the temporary project, cleanup, and factory/typed-scope cases in `tests/policy/type-aware-scope.test.ts`. Move the commonjs and parameterized code-quality suites to `tests/policy/`, and the generated-type suite to `tests/scripts/typegen.test.ts`. Move the two shared helpers into `tests/support/` as shown, along with the lint helper's own test; update incoming imports without changing their APIs. This is thirty-three existing test-file moves and two helper moves, plus one new file containing extracted existing utility cases. Keep the remaining factory, policy, package, script, and root Vitest-config suites in their existing groups.

**Coverage standard under either choice:** Preserve the shared builder contract and all its parameterized cases. During implementation, add a focused Comments directive regression with an offending and a valid control case, using the owning feature's actual policy rather than repeating its generic setup assertions. Add direct global-ignore behavior coverage for root/nested default directories, caller additions, and the supported negation/order boundary, including D14's approved `.next` and `.svelte-kit` behavior when that policy is implemented. Under A these belong in `tests/configs/plugins/comments/index.test.ts` and `tests/configs/ignores/index.test.ts`; under B use `tests/configs/comments.test.ts` and `tests/configs/ignores.test.ts`. Reuse existing coverage if a later check finds the exact behavior already protected; do not create empty suites, mirror every policy literal, duplicate the twelve-builder contract, or impose a test file for every source leaf. Test locations are the choice here; preserving existing coverage and adding justified regressions are common to both options.

**Rationale:** A gives equivalent owned modules a predictable test location (principle 1) and makes their unit versus integration responsibilities visible (principle 2). The support folder distinguishes helpers used by tests from tests of production utilities. The explicit integration groups preserve meaningful behavioral ownership rather than forcing an artificial one-to-one source mapping. B trades that path consistency for fewer moves and shallower imports. Neither choice changes consumer lint scopes, test-runner filename conventions, or policy. D17's retained rule scopes are independent of this repository layout.

**Implementation boundaries:** Preserve assertion bodies, parameterized case data, valid/invalid controls, temporary-project lifetimes and cleanup, suite/test names, timeouts, virtual lint filenames, package-test classification, source scopes, and all existing effective snapshots. Relative import rewrites must account for D18.1's already-approved source-folder rename. Adjust both `new URL(..., import.meta.url)` references and the built-module import in the moved typegen suite. Update the explicit generated-declaration watcher target in `vitest.config.ts` and both renamed test targets in the watcher regression's lists/expectations; keep its package/UI filters and rebuild behavior. The existing recursive `tests/**/*.test.ts` include and rebuild glob accommodate nested paths. See the official [Vitest include configuration](https://vitest.dev/config/include) and [manual watch mappings](https://vitest.dev/config/watchtriggerpatterns). Keep fixture disk locations and Knip's explicit fixture entries intact, and verify discovery/analysis after implementation. Update current contributor links and example commands to the selected paths; preserve historical audit paths as evidence. Shared-helper relocation does not authorize R4's separate cast consolidation, API/default renaming, or helper deduplication. Do not bulk-rewrite literal virtual paths such as `tests/utilities.ts`, which existing lint cases use independently of a physical file. Do not add a layout-enforcement dependency or test merely to assert that directories exist.

**Focused verification:** A static in-memory proposal checked all thirty-five existing-file moves for unique, absent destinations and preserved the existing five-file package-test classification. It checked 138 relative imports/URL targets across test modules, with sixty-three proposed import rewrites and two relative-URL rewrites; the planned `imports/` source destination was accounted for. The moved typegen import and its two declaration URLs still target the same built/generated artifacts, whose current availability was not asserted. The pure utility extraction preserved both original top-level describe bodies exactly, without copying the integration project's setup. The proposed modules parsed with TypeScript 6.0.3, and four explicit watcher-path replacements were identified. A temporary directory containing only planned filenames verified that the existing Node rebuild glob finds all sixty-five proposed test paths: the original sixty-two, one extracted utility suite, and two reserved paths for the focused Comments/ignores coverage. Those placeholder files exercised path discovery only; they were not runnable regressions and were removed. No build, Vitest run/watch cycle, new behavior test, Knip analysis, or packed-consumer validation was claimed. This worktree still has no `node_modules` or build output; existing primary-checkout dependencies were read-only. All static assertions passed. Every test/helper move, import/watch rewrite, new regression, and contributor-documentation change remains deferred to implementation.

**Maintainer choice:** A — organize tests by their implementation owner, following source paths for dedicated feature/utility suites and keeping explicit policy, factory, package, script, and support groups. Confirmed by the maintainer on 20 October 2026. Apply the concrete migration above, including the pure type-aware utility extraction and shared helpers in `tests/support/`, with the required import, file-URL, watcher, and contributor-reference updates. Preserve assertion bodies, parameterized cases, integration setup/cleanup, virtual lint filenames, package classification, helper APIs, effective snapshots, and consumer policy/scopes. Keep the shared twelve-feature contract and add the justified Comments/ignores regressions without duplicating existing coverage or creating a test for every source leaf. R4 helper consolidation/API changes and layout-enforcement dependencies remain outside this decision. Every physical move, new regression, reference update, and documentation change remains recorded for implementation; no test, helper, source path, watcher setting, fixture, snapshot, or contributor instruction has changed during decision gathering.

#### D18.6: the ambient dependency-declaration directory

**Current evidence:** `src/types.ts` defines the package's public option/type API and is re-exported by `src/index.ts` through `./types.js`. The separate `src/types/` directory contains one authored declaration file, `eslint-plugin-promise.d.ts`, whose only statement is `declare module "eslint-plugin-promise";`. The pinned Promise plugin 7.3.0 has no `types` or `typings` manifest entry; the declaration currently allows its imported value to remain `any`, with targeted unsafe-assignment explanations in the builder and generator. This file is a project-level ambient module declaration, not an exported public-options module. The generated `src/typegen.d.ts` is a third, distinct owner: the rule-option declarations written by `scripts/typegen.ts`.

The shared `types` stem is legal and causes no observed module-resolution failure. The question is whether the directory name should make the different ownership clearer. No code imports or triple-slash references target the ambient file's path. The project's `src/**/*` include discovers it; the repository has no custom `typeRoots` pointing to this folder.

**Recommendation:** A — move the single authored ambient declaration to `src/ambient/eslint-plugin-promise.d.ts` and remove the empty `src/types/` directory. Use `src/ambient/` for this kind of project-wide dependency declaration, while keeping public exported types in their owning source module. Retain `src/types.ts`, its exports/imports, and the generated `src/typegen.d.ts` location. Add the ownership distinction to the contributor guide.

```text
A: separate public types from ambient dependency declarations by name.

src/types.ts                            public option/type API
src/typegen.d.ts                        generated rule-option declarations
src/ambient/eslint-plugin-promise.d.ts   ambient dependency declaration
```

**Alternative:** B — retain the current `src/types/` directory and document it explicitly as the home for ambient dependency declarations, distinct from the public `src/types.ts` module. This keeps the current paths and avoids a move while requiring contributors to remember the file-versus-directory ownership distinction.

```text
B: keep the shared stem and document its two owners.

src/types.ts                            public option/type API
src/typegen.d.ts                        generated rule-option declarations
src/types/eslint-plugin-promise.d.ts     ambient dependency declaration
```

The ambient declaration statement stays identical under both layouts:

```ts
declare module "eslint-plugin-promise";
```

For a separate source file importing the plugin, the focused comparisons produced the same result:

```text
                                              A              B
Current tsconfig discovers the declaration:   yes            yes
Missing-declaration diagnostic for import:    none           none
Imported plugin's existing type:              any            any
Representative compiler output:               identical      identical
```

**Rationale:** A gives the ambient directory one explicit responsibility (principle 1) and makes it easier to distinguish the internal compiler shim from public API types and generated rule-option declarations (principle 2). It is a one-file ownership rename without a new abstraction or dependency. B remains a valid documented convention and has the same compiler behavior in the focused check. Neither directory name improves the imported plugin's type precision; replacing the permissive declaration with verified types would be a separate change.

**Implementation boundaries:** Move only the authored ambient file, preserving its declaration statement and targeted `import-x/unambiguous` suppression. Keep it a non-module declaration file: do not add a top-level import, `export {}`, runtime side-effect import, barrel, or new public package subpath. Top-level module syntax changes an ambient module declaration into module augmentation, as the official [TypeScript module reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html#ambient-modules) explains. Preserve the exact declared package name and existing plugin imports/registration, public type exports, generated output path, compiler settings, formatter/lint scopes, typed boundaries, and dependency versions. The current recursive include already covers either location; do not introduce `typeRoots`, `paths`, an explicit include exception, or a compiler relaxation merely to support this move. Keep D15's publication policy and D18.5's generator-test/watch-path decisions intact. Check current references and compiler discovery before applying the move, update contributor ownership guidance, and verify the build/typecheck and packed public declarations during implementation. No dedicated test is needed solely to assert this directory name.

**Focused verification:** Node.js 26.12.0 and TypeScript 6.0.3 loaded this worktree's actual compiler configuration and byte-identical copies of the existing ambient file in two isolated A/B layouts, using the pinned Promise 7.3.0 package from read-only primary dependencies. Both layouts were discovered by the unchanged include patterns, produced no compiler diagnostics for a representative ESM plugin import, retained its existing `any` type, and yielded identical captured compiler outputs. Two negative controls, omitting the shim and adding `export {}` to it, each produced the expected TS7016 missing-declaration diagnostic. Source inspection also resolved the package entry's `./types.js` reference to the existing `src/types.ts` and found no direct ambient-path callers to rewrite. The first temporary-program attempt lacked the temporary project's compiler context and could not locate `@types/node`; setting the config filename and compiler-host working directory corrected that probe setup without changing repository compiler options. All final assertions passed, and temporary files/symlinks were removed. These are isolated compiler/discovery checks, not a full repository typecheck, tsdown build, generator run, ESLint run, or packed-consumer validation. No source file, compiler setting, dependency, test, generated file, or contributor instruction has changed during decision gathering.

**Maintainer choice:** A — move the authored dependency declaration from `src/types/eslint-plugin-promise.d.ts` to `src/ambient/eslint-plugin-promise.d.ts`, removing the empty old directory and documenting the ownership distinction. Confirmed by the maintainer on 21 October 2026. Preserve the exact ambient declaration, its non-module semantics and targeted suppression, the existing plugin type boundary, and all plugin imports/registration. Keep `src/types.ts`, its public imports/exports, and the generated `src/typegen.d.ts` location unchanged. Retain compiler settings and discovery patterns, lint scopes, package exports, dependency versions, and the independently approved publication/test decisions. The file move and contributor-documentation change remain recorded for implementation; no source path, declaration content, compiler setting, dependency, generated file, or contributor instruction has changed during decision gathering.

### D19: explicit updates and assignment expressions

**Maintainer request:** Add a new audit finding that prohibits `++` and `--` and uses explicit arithmetic updates such as `count = count + 1` and `count = count - 1`, consistent with the prohibition on compound assignments. The supplied `-+` example is interpreted as `-=` in that operator family. Apply the convention to this repository and consumer code within the existing linted source scope.

**Confirmed policy:** Reject prefix and postfix increment and decrement, including updates inside `for` loop update clauses. Reject all arithmetic, bitwise, and logical compound assignment operators: `+=`, `-=`, `*=`, `/=`, `%=`, `**=`, `<<=`, `>>=`, `>>>=`, `&=`, `|=`, `^=`, `&&=`, `||=`, and `??=`. Prefer explicit assignments or explicit conditional assignment, preserving the operation's semantics.

**Enforcement:** Use the existing native rule owners with these settings:

```ts
"no-plusplus": ["error", { allowForLoopAfterthoughts: false }],
"operator-assignment": ["error", "never"],
"logical-assignment-operators": ["error", "never"],
```

**Current gap:** Only `no-plusplus` requires a policy change. The two compound-assignment rules already use `"never"`, and the competing Unicorn assignment rules are already disabled with ownership comments. The enabled increment/decrement rule belongs in the appropriate existing rule group; update its group and composition counts and remove the obsolete comment preferring counter shorthand during implementation.

**Examples of rejected forms:**

```js
count++;
--count;
count += 1;
total *= factor;
value ??= fallback;
```

**Preferred forms for ordinary numeric counters and local variables:**

```js
count = count + 1;
count = count - 1;
total = total * factor;

if (value === null || value === undefined) {
  value = fallback;
}

for (let index = 0; index < limit; index = index + 1) {
  processIndex(index);
}
```

**Migration guardrails:** Preserve prefix/postfix result values, numeric coercion, BigInt operand types, short-circuit evaluation, and evaluation of property receivers and keys. A bare `count + 1` does not update a variable. A mechanical `++` to `+ 1` rewrite can change behavior for string-valued counters, and BigInt counters require `1n`. Compound property updates must not evaluate a receiver, computed key, or getter more often after expansion. Logical assignment expansion must preserve conditional writes; do not replace it indiscriminately with an unconditional assignment that invokes a setter. Existing bitwise restrictions still apply to expanded bitwise expressions. The native `no-plusplus` rule provides no automatic fix, so implementation must migrate affected code deliberately rather than add a blanket replacement.

**Rationale:** The maintainer prefers explicit, readable updates and a consistent assignment form for counters and other values (principles 1 and 2), accepting additional syntax over brevity (principle 9). Reuse the native rule owners instead of adding duplicate custom checks. Include relevant counter updates in the existing composed-policy convergence coverage when implementing the policy.

**Focused verification:** Thirty isolated checks used ESLint 10.12.0. Twenty-one rejected forms covered four prefix/postfix updates, two `for`-loop updates, twelve arithmetic/bitwise compound assignment operators, and three logical compound assignment operators. Nine accepted forms covered explicit arithmetic assignments, an explicit `for` update, conditional logical assignments, and a BigInt update using `1n`. All assertions passed. These probes verify the three-rule combination, not full repository or consumer validation. See the official [increment/decrement rule](https://eslint.org/docs/latest/rules/no-plusplus), [operator-assignment rule](https://eslint.org/docs/latest/rules/operator-assignment), and [logical-assignment rule](https://eslint.org/docs/latest/rules/logical-assignment-operators) documentation.

**Maintainer choice:** Confirmed by direct instruction on 20 October 2026. This section records the added audit finding and approved policy; runtime configuration changes and code migration remain part of the implementation phase.

## Implementation acceptance and closure — 23 October 2026

**Status:** Implementation complete through Stage 14. The original dated findings, isolated
probes, and decision-review status above remain historical evidence. The final
implementation record is maintained in
[the execution guide](AUDIT_RESULT_FOLLOW_UP_IMPLEMENTATION.md#stage-14--final-consumer-verification-and-closure).
Implementation began at `008a08207f28441297a2476b4798136aeb1023de`;
Stage 14 began at `da99a5b3f595a684fb767ae1252a9e18034238bc` with a clean tree.

### Reconciled implementation evidence

These are actual commits in the current branch's ancestry. Their current
regressions are rerun by the final validation gate; the earlier handoffs alone
are not acceptance evidence.

| Stage | Implementation commit                                                                                      | Decisions/findings and current verification                                                                                                                                                                                                                                                                                                    |
| ----- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | [`48ed7d1`](https://github.com/cravingmaker/eslint-config/commit/48ed7d1548a79465b0bd70d048ccf187c1d049e7) | P1–P3 harness: [combined fixes](tests/policy/fix-convergence.test.ts), overlap controls, real typed projects, and isolated warning capture. All temporary defect characterizations are gone.                                                                                                                                                   |
| 2     | [`e432539`](https://github.com/cravingmaker/eslint-config/commit/e4325397d3ee57c150114d523536da643afcb4f1) | D1/D2: uppercase escapes and minimum import spacing; original and mixed convergence cases.                                                                                                                                                                                                                                                     |
| 3     | [`311598b`](https://github.com/cravingmaker/eslint-config/commit/311598b92d56630842fa0b4056f0b6741ae77dc0) | D3: [function semantics](tests/configs/core/function-style.test.ts), [padding/documentation](tests/policy/function-layout.test.ts), and repeated fixes.                                                                                                                                                                                        |
| 4     | [`90a360a`](https://github.com/cravingmaker/eslint-config/commit/90a360aed94bd2b006b6b21463002cf611b830a4) | D4–D7 and AST follow-up/P2: passing configuration files, conditional metadata, callbacks, [typed TSX names](tests/configs/plugins/typescript/naming.test.ts), negative controls, and installed consumers.                                                                                                                                      |
| 5     | [`ae66847`](https://github.com/cravingmaker/eslint-config/commit/ae66847b3ceaa1da85100c1c0c444dc9fbf85a39) | D8.1–D8.12/P3/P5: [ownership, unique coverage, and safe fixes](tests/policy/rule-ownership.test.ts), [feature/override boundaries](tests/policy/overlaps.test.ts), and packed Buffer/RegExp regressions.                                                                                                                                       |
| 6     | [`d1fb5e3`](https://github.com/cravingmaker/eslint-config/commit/d1fb5e3edba78e918fb8e81871ebfc84c0010588) | D9–D11/P4/P5: [opaque-return review](tests/configs/plugins/typescript/promise-function-async.test.ts), Security in tests, HTML boundaries, Markdown trigger corpus, and supported Svelte routing.                                                                                                                                              |
| 7     | [`8273526`](https://github.com/cravingmaker/eslint-config/commit/8273526416e19aa001fa73250e217aa1f8c971a1) | D12–D14/D19/P6–P8/P11: [limits](tests/policy/maintainability-limits.test.ts), [deprecated inheritance](tests/policy/deprecated-rules.test.ts), [explicit options](tests/policy/rule-options.test.ts), [generated directories and caller negations](tests/configs/ignores/index.test.ts), and [updates](tests/policy/explicit-updates.test.ts). |
| 8     | [`e820001`](https://github.com/cravingmaker/eslint-config/commit/e82000143424c9fb4a513d30b058ce530492fbcc) | D15/R7: [build contract](tests/package/contract.test.ts), five-file tarball/installed contents, and declarations. Includes the separately recorded Vitest security patch.                                                                                                                                                                      |
| 9     | [`cba23af`](https://github.com/cravingmaker/eslint-config/commit/cba23af137a75d901e564ba28367d4e21a8559cd) | D18.1–D18.6/R11: source/test/ambient ownership, [Node tuple identity](tests/configs/plugins/node/index.test.ts), Comments scope, ignores discovery, type checking, Knip, and watch mappings.                                                                                                                                                   |
| 10    | [`10405a6`](https://github.com/cravingmaker/eslint-config/commit/10405a60a3a9f6be868d72bc25a6af106b4bc5cc) | R1/R2: record guard/shared builders and [ordered Svelte negations](tests/configs/plugins/svelte/scripts.test.ts). Negations are an intentional scoped correction beyond snapshot scenarios.                                                                                                                                                    |
| 11    | [`abf27fe`](https://github.com/cravingmaker/eslint-config/commit/abf27fe77c21dd54a371e051508fa17266c64244) | R3–R5: authored typed guards, [shared result boundary](tests/support/resolved-config.test.ts), [lint helper](tests/support/lint.test.ts), and operation-level suppression review.                                                                                                                                                              |
| 12    | [`e350a69`](https://github.com/cravingmaker/eslint-config/commit/e350a69e55843d3acb931d0b6886d11de794e4cb) | R6/R8: dead entries removed, Knip, release/script composition, and mandatory hooks. Script alignment also landed in [`f30fa41`](https://github.com/cravingmaker/eslint-config/commit/f30fa41363f4a278a686998d8f1c91107939cc07).                                                                                                                |
| 13    | [`da99a5b`](https://github.com/cravingmaker/eslint-config/commit/da99a5b3f595a684fb767ae1252a9e18034238bc) | R9/R10/D16/D17/P9: current documentation, [all eighteen AWS checks and twenty test checks](tests/configs/plugins/sonarjs/scope.test.ts), workspace/optional dependencies, alternate filenames, negative controls, typed guards, and overrides.                                                                                                 |
| 14    | This change                                                                                                | Final all-language convergence matrix, packed/external-cwd consumers, optional-peer absence, minimum peers, cumulative review, P10 compiler-contract guard, and this closure record.                                                                                                                                                           |

### Cumulative policy, scopes, and artifacts

The report against the implementation starting SHA contains **25 changed and
8 unchanged snapshots**, with no new, removed, or failed snapshots. The report
against Stage 14's entry SHA contains **33 unchanged snapshots** and identical
locked packages. No snapshot is edited or regenerated in Stage 14.

The following groups account for all **52 changed rule IDs** and options in the
cumulative report. Plugin registration/count summaries follow these entries;
the private plugin adds no public feature option or export.

| Decision            | Reviewed cumulative change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1/D2               | `regexp/letter-case` hexadecimal/Unicode escapes become uppercase; `import-x/newline-after-import` sets `considerComments: false`, `exactCount: false`, retaining `count: 1` and import ordering.                                                                                                                                                                                                                                                                                                           |
| D3                  | Private arrow/starred-documentation/Svelte-padding owners and native selector padding replace `func-style`, `prefer-arrow-callback`, and Unicorn's no-asterisk rule. `perfectionist/sort-modules` retains sorting with module spacing ignored pending restoration evidence.                                                                                                                                                                                                                                 |
| D4/D5/D6            | Disable `unicorn/no-top-level-side-effects` and `functional/prefer-tacit`; private conditional peer metadata replaces unconditional `package-json/require-peerDependenciesMeta`.                                                                                                                                                                                                                                                                                                                            |
| D7                  | Typed `.tsx` naming adds PascalCase for function-valued consts/functions within the existing typed scope; data and other extensions retain their naming contract.                                                                                                                                                                                                                                                                                                                                           |
| D8.1/D8.2/D8.3/D8.5 | Disable `no-eq-null`, `security/detect-eval-with-expression`, `unicorn/no-unnecessary-nested-ternary`, and `no-control-regex` in favor of the confirmed owners. Intentional constructor control escapes remain accepted.                                                                                                                                                                                                                                                                                    |
| D8.7/D8.10          | Native direct-Buffer syntax restriction replaces `security/detect-new-buffer` and `unicorn/no-new-buffer`, preserving global/import/type restrictions. TypeScript's `prefer-regexp-exec` is scalar off to prevent the verified unsafe fix; RegExp remains active.                                                                                                                                                                                                                                           |
| D11.1/D11.2/D11.3   | HTML closing-tag options preserve custom-element boundaries; the five recorded Markdown crash rules are scalar off; Svelte parsing is limited to supported suffixes while `.svelte.mjs`/`.svelte.mts` remain ordinary modules.                                                                                                                                                                                                                                                                              |
| D12/D13.2           | The changed limit severities are `complexity`, native/TypeScript `max-params`, `unicorn/max-nested-calls`, and `@html-eslint/max-element-depth`. All twelve reviewed limits are warnings with unchanged thresholds; TypeScript's redundant `maximum` alias is removed and the annotation-spacing guard remains.                                                                                                                                                                                             |
| D13.1               | Remove deprecated `no-return-await`; Stylistic `jsx-indent`, `jsx-props-no-multi-spaces`, `jsx-sort-props`; SonarJS `conditional-indentation`, `confidential-information-logging`, `frame-ancestors`, `hidden-files`, `no-intrusive-permissions`, `no-ip-forward`, `no-mixed-content`, `no-redundant-parentheses`, `no-tab`, `no-unsafe-unzip`, `os-command`, `useless-string-operation`, and `web-sql-database`. Earlier consumer deprecated entries remain inherited; later explicit overrides still win. |
| D14/D19             | Root/nested `.next/` and `.svelte-kit/` become default global ignores with caller negations retained; native `no-plusplus` is enabled without a loop exception, beside the existing explicit-assignment policy.                                                                                                                                                                                                                                                                                             |
| D15/R7              | Clean builds contain only runtime/declaration bundles; published contents add only `LICENSE`, `README.md`, and `package.json`. No maps, map references, or original-source directory.                                                                                                                                                                                                                                                                                                                       |
| D18/R1–R6/R8–R11    | Ownership, builder/helper/derived-map consolidation, dead-entry cleanup, hooks, documentation, and options retain effective values/order/scopes. Git comparisons confirm no snapshot changes in Stages 1 and 9–13. R1's ordered Svelte-negation correction has direct integration coverage. Stage 13 changes emitted documentation separately from executable/type structure.                                                                                                                               |

D8.4/D8.6/D8.8/D8.9/D8.11/D8.12 retain their complementary checks and distinct
coverage. D9/D10 retain opaque-return and Security review signals, including
matching tests. D16/D17 retain broad SonarJS coverage. Current authored-map,
deprecation, schema/option, generated-type, feature-toggle, narrowed/ignored-file,
typed/untyped, and consumer-override suites check these boundaries.

The lockfile's nine cumulative package-path differences belong to Stage 8's
documented security patch: Vitest/UI and four internal Vitest packages move
5.0.3 → 5.0.5, `obug` moves 2.2.1 → 3.0.0, and two nested `obug@3.0.0`
copies are deduplicated. Stage 14 changes no dependency or peer range.

### P10 and retained follow-up boundaries

P10 is closed as an explicitly unapproved expansion: the consumer compiler
contract remains `strict`, `noImplicitReturns`, and
`allowUnreachableCode: false`. The [README consumer test](tests/package/readme.test.ts)
pins those three options and checks that README/repository/fixture/React consumer
configurations do not enable `noUncheckedIndexedAccess`,
`verbatimModuleSyntax`, or `noFallthroughCasesInSwitch`. Unchecked-index typing
does not validate a key's trust or replace Security review.

Implementation completion does not restore temporarily excluded behavior:

- D3's module-spacing restoration requires the corrected dependency combination
  to preserve starred/unstarred paragraphs and mixed fix/format convergence.
- D8.10's TypeScript RegExp execution preference requires inherited-global-flag,
  result-array, computed-access, unique-diagnostic, and repeated-fix proof.
- D11.2's five Markdown rules require every recorded GFM trigger, especially
  `[https://example.com]`, plus unique diagnostics/fixes and feature/override
  coverage against the corrected dependency combination.
- D11.1 preserves manual custom-element boundary review and void-element fixes;
  it does not promise automatic correction of malformed custom elements.
- The independent minimum-peer consumer audit still reports **seven vulnerable
  package entries: three high, one moderate, three low**, including propagated
  parent entries. The reproduced graph uses `deepmerge-ts@7.1.6`,
  `katex@0.16.47`, and the deliberately selected `svelte@5.0.0` minimum.
  [The existing dependency-review finding](DEPENDENCY_REVIEW.md#consumer-audit-findings)
  remains open for separate dependency work; root overrides do not propagate to
  installed consumers. Passing compatibility checks is not a clean consumer
  security audit.

### Final acceptance results

`npm run release:check` passes on Node.js **24.22.0**: the repository audit has
**zero findings**; full validation passes **75 files / 2,857 tests**, including
packed external-cwd and README consumers, followed by Publint, ATTW's ESM-only
profile, and the five-file dry-run tarball. The test phase takes **517.60 seconds**
with a 4 GiB Node heap, one Vitest worker, and `UV_THREADPOOL_SIZE=16`, without
retries or skipped coverage. Runtime/declaration bundles, generated rule types,
manifests, lockfile, compiler configuration, and coding principles match Stage
14's entry bytes.

Node.js **24.15.0** runs the advertised minimum-peer CI consumer protocol locally:
ESLint **10.4.0**, HTML React/Svelte **0.60.0**, Express Security **1.2.0**, React
Hooks **7.1.0**, React Refresh **0.5.0**, React **19.0.0**, Svelte **5.0.0**, and
Svelte ESLint Parser **1.6.0**. `npm ls --all`, optional integration loading, and
JSX/Svelte/JavaScript parsing pass; the separate seven-entry consumer security
finding above remains open. Node.js **26.12.0** passes the convergence, package
contract, and external-cwd linked-consumer smoke suites: **3 files / 160 tests**.
These focused runtime checks do not substitute for full validation of those
two runtime matrices.

Every confirmed decision has an implemented, currently tested disposition;
every finding has a resolved implementation or an explicit retained/out-of-scope
boundary above. Stage 14 adds acceptance coverage and closure records, with
**zero production-policy, dependency, compiler-contract, or emitted-bundle
changes**. The Stage 14 handoff records the commands and full scope. Final
closure text is formatted/linted separately after recording these results.
Full remote CI on Node 24.15.0 and Node 26, including its minimum-peer job, has
not been evaluated in this record. Requested commit/push/PR delivery does not
authorize a release or merge.
