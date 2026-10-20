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

- **`@typescript-eslint/promise-function-async` with `allowAny: false`** (`src/configs/plugins/typescript/rules-type-aware.ts:223-233`). Every function whose return type is `unknown` or `any` is reported with "Functions that return promises must be async.", such as `const parse = (raw: string): unknown => { return JSON.parse(raw); };`. In a React project without `@types/react`, every component is reported too. The repository disables the rule in `src/utilities/plugin-policy.ts:49` for that reason. The message is wrong for these functions, and `@typescript-eslint/no-unsafe-return` already reports a function that returns `any`. The upstream default, `allowAny: true`, keeps every report on a real promise.
- **`security/detect-non-literal-fs-filename` and `security/detect-object-injection`.** They report any path or key that is not a literal. In this repository, 28 disable comments name them, and each explains why the path or key is safe: it is fixed, temporary, limited by a type, or chosen by the caller. 18 of them disable a rule for a whole file, all in `tests/`, which hides any later report in those files as well (2, 3). The decisions add a file-role exception only with evidence: 16 test files, and one test helper, that disable `security/detect-non-literal-fs-filename` for the whole file are such evidence for the test-files role.

### P5: open issues that break code or runs

**Principles:** 1, 3. **Decision:** D11.

The README lists these as known issues and the record as open questions. Each one either changes what code does or stops ESLint, and each has a small fix in this package, so documenting them works against principles 1 and 3:

- **Custom elements become self-closing.** `@html-eslint/require-closing-tags` with `selfClosingCustomPatterns: ["-"]` fixes `<my-element></my-element>` to `<my-element />`, which a browser reads as a start tag, so the content that follows moves inside the element. The fix changes the page. `selfClosingCustomPatterns: []` keeps the end tags; Prettier keeps either form.
- **A bracketed URL stops the run.** `[https://example.com]` in a Markdown file makes five rules of `@eslint/markdown` 8.0.3 throw, and ESLint stops for every file. Until the upstream fix, turning the five rules off keeps `eslint .` running.
- **`.svelte.mjs` and `.svelte.mts` do not parse.** `svelteFiles` matches them, but svelte-eslint-parser reads them as components. Leaving them out of `svelteFiles` makes them ordinary sources.

### P6: severities follow no single rule

**Principles:** 1. **Decision:** D12.

The README says of SonarJS: "Checks that need human review, such as complexity thresholds and suspected hardcoded secrets, warn." The core thresholds do not follow it: `complexity` and `@typescript-eslint/max-params` are errors, while `max-depth`, `max-lines`, `max-lines-per-function`, `max-nested-callbacks`, `sonarjs/cognitive-complexity`, and `sonarjs/expression-complexity` warn. Equivalent checks should get the same severity, by a rule that `CONTRIBUTING.md` states for every map.

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

### P8: generated framework output is linted

**Principles:** 4, 1. **Decision:** D14.

The global ignores are `**/dist/`, `**/build/`, and `**/coverage/` (`src/configs/ignores/index.ts:9`). The config detects React, Next.js, Vite, and Svelte, but `eslint .` lints `.next/` and `.svelte-kit/`: `isPathIgnored` is `false` for `.next/server/page.js` and `.svelte-kit/generated/root.js`. Results then depend on whether a build ran (1), and a run lints generated bundles (4). The previous audit listed this under "Not planned".

### P9: rules that run where they cannot report

**Principles:** 4. **Decision:** D16, D17.

Linting this repository, 169 typed source files, took 10.0 seconds of rule time in one run with `TIMING=all`. SonarJS took 2.2 seconds of it, and two groups of its rules cannot report anything in most of the files where they run:

- **18 AWS CDK rules,** such as `sonarjs/aws-s3-bucket-insecure-http`, are errors in every source and took 0.77 seconds (7.7%) in a repository that does not use AWS CDK. They report only code that builds AWS CDK resources.
- **18 test rules,** such as `sonarjs/assertions-in-tests`, `no-skipped-tests`, and `no-duplicate-test-title`, run in every source and took 0.72 seconds (7.2%). They report only test code, and the test-files role already names those files.

Turning the AWS rules on only when the manifest declares `aws-cdk-lib`, as the frameworks are detected, and scoping the test rules to the test files would save about 15% of the rule time in a project like this one, and more in a project with fewer tests.

### P10: the tsconfig that the README asks for

**Principles:** 1, 3. A question, not a finding.

The README asks for `strict`, `noImplicitReturns`, and `allowUnreachableCode: false`, and turns off the rules whose checks those options make. The same reasoning could cover more compiler options, so that the compiler owns more checks: `noFallthroughCasesInSwitch` overlaps `no-fallthrough`, `verbatimModuleSyntax` overlaps `@typescript-eslint/consistent-type-imports`, and `noUncheckedIndexedAccess` is a stronger check than `security/detect-object-injection` for index access. Each would change what consumers must set, so this is for the maintainer to weigh.

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
| `src/configs/plugins/react/rules/html-best-practice.ts` and `html-best-practices.ts` | Two modules with almost one name, because upstream labels 8 rules "Best Practice" and 1 rule "Best Practices"; the second label is an upstream typo                                                                                                                  |
| `src/configs/plugins/unicorn/rules/other.ts` and `package-json/rules/other-rules.ts` | Two names for the module of uncategorized rules                                                                                                                                                                                                                      |
| `src/configs/plugins/node/rules.ts`                                                  | Exports `typeAwareRules` itself, while `functional`, `sonarjs`, and `typescript` keep those rules in `rules-type-aware.ts`                                                                                                                                           |
| `src/configs/plugins/comments/` and `src/configs/ignores/`                           | No test file of their own: `tests/configs/code-quality.test.ts` covers `comments`, and the snapshots of `dist/generated.js` cover the global ignores                                                                                                                 |
| Tests of `src/utilities/`                                                            | In three places: `tests/configs/file-scope.test.ts` and `type-aware-scope.test.ts`, `tests/factory/import-peer.test.ts`, and `tests/plugin-policy.test.ts` at the top                                                                                                |
| `src/types.ts` and `src/types/eslint-plugin-promise.d.ts`                            | A module and a folder with one name, for public types and for an ambient declaration                                                                                                                                                                                 |

A rule written in `CONTRIBUTING.md`, such as "folders, block names, and test files use the feature name; tests mirror the path of the module they test", would decide each case, and a test could check it, as `tests/factory/factory.test.ts` already checks the block names.

## Recommendations

### Decisions for the maintainer

Each recommendation follows the priority order; the last column says which principle decides it.

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
6. **Conventions and cost:** D12, D13, D14, D16, D17, with the matching `CONTRIBUTING.md` sections.
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
