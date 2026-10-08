# Audit follow-up

This is the to-do list that came out of the audit of the config rewrite (pull requests #59 to #62 and #64 to #75) at commit `df14104`, on 8 October 2026. Two independent audits agreed on five findings, and one of them found eight more. Each step below fixes one or more of them and is one pull request. Line numbers refer to `df14104`. The problems that [the rewrite record](record.md) already lists are not repeated here.

## How to use it

Work the steps one at a time, each with an agent and one of the [prompts](#prompts) at the end. The checklist is in the order to work in: step 1 makes local validation pass on macOS, and steps 2 to 4 close two crashes and a wrong result in typed linting. Seven steps can start now: 1, 2, 5, 6, 7, 8, and 11.

A step is in one of three states:

- **Not blocked.** It can start now.
- **Blocked by a step.** It builds on another step's change, or edits the same code. It can start when that step's box is ticked, which happens when its pull request is merged.
- **Blocked by a decision.** The maintainer chooses first, and the choice goes into the [decisions](#decisions) table. An agent does not choose.

## Checklist

- [x] **Step 1.** Use real paths for the temporary directories of the install tests. Not blocked. [#77](https://github.com/cravingmaker/eslint-config/pull/77)

- [x] **Step 2.** Keep the type-aware scope whole under every option. Not blocked. [#78](https://github.com/cravingmaker/eslint-config/pull/78)

- [x] **Step 3.** Apply overrides of type-aware rules only where type information is read. Blocked by step 2. [#79](https://github.com/cravingmaker/eslint-config/pull/79)

- [ ] **Step 4.** Keep an overlap exemption inside the files that its override reaches. Blocked by step 2.

- [ ] **Step 5.** Separate the files of the JSON and JSONC blocks. Not blocked.

- [ ] **Step 6.** Reject options that `createConfig` does not know. Not blocked.

- [ ] **Step 7.** Resolve the root directories to absolute paths. Not blocked.

- [ ] **Step 8.** Give each React override to the block that has its plugin. Not blocked.

- [ ] **Step 9.** Make the rules that come back for an owner fit together. Blocked by decision D1.

- [ ] **Step 10.** Settle what a feature's `files` means. Blocked by decision D2, and by steps 2 to 4.

- [ ] **Step 11.** Document the TypeScript range and two limits. Not blocked.

- [ ] **Step 12.** Close out. Blocked by every other step.

## Decisions

The maintainer fills in the last column. Each option is described in the step that the decision blocks.

| ID  | Question                                                                     | Recommended                                                            | Decision |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------- |
| D1  | Which replaced rules come back when their owner is off or leaves a file out? | Option A of step 9: checks come back, sorting and style rules stay off | Open     |
| D2  | Does a feature's `files` replace its default files or narrow them?           | Option A of step 10: narrow                                            | Open     |

## Rules for every step

1. Read `CLAUDE.md` and "Things to know" in `CONTRIBUTING.md` before anything else.
2. Work in a copy of your own: a fresh clone or worktree at the latest `origin/main`. Do not build or test in the maintainer's main checkout. Other sessions run there, and `npm run build` deletes `dist/`, which their tests import.
3. Check the state of the step. If it is blocked by a step, that step's box must be ticked on `main`. If it is blocked by a decision, the decision must be in the table, or in the prompt, and then you write it into the table in your pull request. Otherwise stop and report. Never choose for the maintainer.
4. Reproduce first. Turn the step's reproduction into a failing test before you change the source. If it does not reproduce on `origin/main`, stop and report.
5. Stay inside the step. Report another problem that you find; do not fix it in the same pull request.
6. Leave the default policy alone. The files under `tests/policy/__snapshots__` do not change unless the step says so. Where it does, update them with `npx vitest run tests/policy -u` and explain each changed line in the pull request.
7. Update `README.md`, `CONTRIBUTING.md`, and the record where the step changes what they describe. `tests/package/readme.test.ts` runs every JavaScript block of the README.
8. Run `npm run validate` in your copy, and lint the files that you changed on their own as well. Until step 1 is merged, two tests of `tests/package/install.test.ts` fail on macOS; run with `TMPDIR="$(cd "$TMPDIR" && pwd -P)"` in front of the command there.
9. Open one pull request with the title that the step gives. Describe the result before and after for each reproduction. In the same pull request, tick the step's box and add the pull request number after it. Do not merge it, and never merge the Release Please pull request, create a tag, or publish.
10. Report what you changed, the evidence, the result of `npm run validate`, and what you left open.

The reproductions of steps 2 to 4 use one small project: a `package.json` with `"type": "module"`, a `tsconfig.json` that includes only `src`, a file `src/a.ts`, and a file `scripts/build.ts` that no tsconfig includes. `tests/factory/workspaces.test.ts` shows how to write such a project to a temporary directory and lint real files in it. Each snippet shows the options of `createConfig`; `projectRootDirectory` is that project.

## Steps

### Step 1: Use real paths for the temporary directories of the install tests

**State.** Not blocked. Do it first: until it is merged, `npm test` and `npm run validate` fail on macOS, and so does the pre-push hook.

**Pull request title.** `test: resolve the temporary directories of the package tests to real paths`

**Problem.** `tests/package/install.test.ts` creates its consumers under `os.tmpdir()` (line 52). On macOS that is `/var/folders/…`, a symlink to `/private/var/folders/…`. The ESLint child process reports the real path of each file, so `path.relative(directory, filePath)` in `lint()` (line 104) returns `../../…/private/var/…/fixtures/data.json` where the test expects `fixtures/data.json`. Two tests fail although no fixture has a message: "lints the fixtures that need no peer, the JSX component among them, without messages" and "lints the React fixtures without React Refresh, which needs a bundler that the project does not declare". CI runs on Linux only, where the temporary directory is not a symlink.

**Reproduce.** On macOS, `npx vitest run tests/package/install.test.ts` fails 2 of 10 tests. On any system, a `TMPDIR` that is a symlink does the same. Build first; the test installs from the npm registry.

```bash
mkdir -p /tmp/real-tmp && ln -sfn /tmp/real-tmp /tmp/link-tmp
TMPDIR=/tmp/link-tmp npx vitest run tests/package/install.test.ts
```

**Change.** Resolve the temporary directory with `realpath` right after `mkdtemp`, so that every path derived from it is the one that a child process reports. `tests/package/readme.test.ts` has the same pattern (lines 87 and 133). There it only garbles the file name in a failure message; fix it the same way. A helper in `tests/package/consumers.ts` keeps the package tests alike. Leave the CI workflow alone.

**Done when.** The command above passes with the symlinked `TMPDIR`, and `npm run validate` passes on macOS without setting `TMPDIR`.

### Step 2: Keep the type-aware scope whole under every option

**State.** Not blocked.

**Pull request title.** `fix: keep the type-aware blocks inside the type-aware scope`

**Problem.** The README promises that no rule that needs type information runs without it, and that Svelte components never get type information. `tests/policy/type-information.test.ts` checks this for the default options only. Three kinds of options break it:

1. A negated pattern in a feature's `ignores` undoes `ignoresTypeAware`. `narrowTypeAwareScope` (`src/utilities/type-aware.ts:27`) returns `ignores: [...typeAware.ignores, ...ignores]`. ESLint reads an ignore list in order, so a later `!scripts/**` brings back files that the type-aware scope left out. The feature's type-aware rules then run in a file whose parser reads no type information.
2. The same happens inside the TypeScript feature. `resolveTypeAwareScope` (`src/options.ts:189`) puts `typescript.ignores` before `ignoresTypeAware`, and `narrowTypeAwareScope` appends `typescript.ignores` once more after them. A negated pattern there wins over `ignoresTypeAware`.
3. Svelte components stay out of typed linting only because the default `typescriptFiles` glob does not match them. A `typescript.files` that names them puts them in the type-aware scope.

**Reproduce.** First, lint `scripts/build.ts` with the content `export const values = [1]; values.push(2);`. ESLint throws "You have used a rule which requires type information". Expected: it lints, and `functional/no-expression-statements` is off in that file.

```js
createConfig({
  functional: { ignores: ["**/*", "!scripts/**"] },
  typescript: { ignoresTypeAware: ["scripts/**"], typeChecked: true },
});
```

Second, resolve the configuration of `src/generated/keep.ts`. `parserOptions.projectService` is `true` and `@typescript-eslint/no-floating-promises` is on. Expected: neither.

```js
createConfig({
  typescript: {
    ignores: ["**/generated/**", "!**/generated/keep.ts"],
    ignoresTypeAware: ["**/generated/keep.ts"],
    typeChecked: true,
  },
});
```

Third, lint a component `src/Counter.svelte` that has a `<script lang="ts">`. It fails with a parsing error: "was not found by the project service because the extension for the file (`.svelte`) is non-standard". Expected: it parses, `projectService` is not set, and `@typescript-eslint/no-explicit-any` is still on.

```js
createConfig({
  svelte: true,
  typescript: { files: ["src/**/*.{ts,svelte}"], typeChecked: true },
});
```

**Change.** Two ordered ignore lists cannot be intersected by joining them. Express a scope with `files` alone instead, so that nothing appended later can undo an exclusion. Walking an ignore list in order, a file is left in when this holds: start from true, each plain pattern `p` adds "and not `p`", and each negated pattern `!n` adds "or `n`". Written out, that is a short list of terms to AND with each `files` entry:

```js
function compileIgnores(ignores) {
  let terms = [[]];
  for (const pattern of ignores) {
    terms = pattern.startsWith("!")
      ? [...terms, [pattern.slice(1)]]
      : terms.map((term) => [...term, `!${pattern}`]);
  }
  return terms;
}

// compileIgnores(["**/generated/**", "!**/generated/keep.ts"]) returns
// [["!**/generated/**"], ["**/generated/keep.ts"]], so the files `["**/*.ts"]` become
// [["**/*.ts", "!**/generated/**"], ["**/*.ts", "**/generated/keep.ts"]].
```

The audit compared this with the ordered list for ten ignore lists on ESLint 10.11, and both matched the same files. A negated pattern inside a `files` AND-array also works on ESLint 10.4.0, the oldest supported version. Check the order of evaluation yourself in `shouldIgnorePath` of `@eslint/config-array`.

Build the type-aware scope and each feature's own scope this way, and intersect them as `narrowFiles` does. The type-aware blocks are `typescript/parser-type-aware` and the `rules-type-aware` block of `typescript`, `functional`, and `node`; give them no `ignores` that come from options. Leave Svelte components out of the type-aware scope whatever `typescript.files` says, by adding the negated `svelteComponentFiles` glob to each of its entries. Components keep the rules of the feature that need no type information. Another design is fine when it passes the tests below.

**Tests.** Widen the check of `tests/policy/type-information.test.ts` to a list of option shapes, and lint real files, because a resolved configuration does not show a crash. For every file under every shape, ESLint does not throw, and the rules that need type information are on only where `projectService` is on. Include the three reproductions, the first one again with `node` in place of `functional`, and a control whose ignores have no negated pattern. The tests that assert the shape of `typeAware` follow the new shape: `tests/factory/options.test.ts`, `tests/factory/context.test.ts`, and `tests/configs/type-aware-scope.test.ts`.

**Done when.** The three reproductions give the expected results, the snapshots are unchanged, and the bullet "Type information follows the type-aware scope" in `CONTRIBUTING.md` names the helpers that exist.

### Step 3: Apply overrides of type-aware rules only where type information is read

**State.** Blocked by step 2. It changes the same type-aware blocks and extends the same test.

**Pull request title.** `fix: apply overrides of type-aware rules in the type-aware scope only`

**Problem.** A feature spreads its `overrides` into its base block, which covers files without type information. An override that turns a rule that needs type information on there, even only to change its options, stops ESLint in such a file. Turning the rule `"off"` is safe. In 0.1.0, `rules.ts` could tune these rules for TypeScript files, and the README's migration table sends those overrides to the feature's `overrides`. Three places:

- `src/configs/functional.ts:123`: `functional/rules` spreads `overrides` after `typeAwareRulesOff`.
- `src/configs/node.ts:89`: `node/rules-typescript` turns `n/no-sync` off and then spreads `overrides`.
- `src/configs/typescript/index.ts:57`: `typescript/rules` spreads `overrides` after `typeAwareRulesOff`. The option `overridesTypeAware` exists for such rules, but nothing keeps them out of `overrides`.

**Reproduce.** First, lint `src/a.js` with the content `export function add(left, right) { return left + right; }`. ESLint throws "You have used a rule which requires type information". Without `typeChecked`, `src/a.ts` throws as well, and with `ignoresTypeAware: ["scripts/**"]`, so does `scripts/build.ts`.

```js
createConfig({
  functional: {
    overrides: {
      "functional/prefer-immutable-types": [
        "error",
        {
          enforcement: "None",
          ignoreInferredTypes: true,
          parameters: { enforcement: "ReadonlyDeep" },
        },
      ],
    },
  },
  typescript: { typeChecked: true },
});
```

Second, without typed linting, lint a TypeScript file that calls `readFileSync` from `node:fs`. ESLint throws the same error.

```js
createConfig({
  node: {
    overrides: { "n/no-sync": ["error", { allowAtRootLevel: false }] },
  },
});
```

Third, lint any Svelte component. ESLint throws while it loads `@typescript-eslint/no-floating-promises`.

```js
createConfig({
  svelte: true,
  typescript: {
    overrides: {
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: false },
      ],
    },
    typeChecked: true,
  },
});
```

**Change.** Split each feature's `overrides` by whether the rule needs type information. `functional` and `typescript` already have the list: `typeAwareRulesOff`, from the plugin's `disableTypeChecked` config. For `node` it is `n/no-sync`, and only in TypeScript files and Svelte components. In a block that reaches files without type information, keep such an override only when it turns the rule off: `"off"` or `0`, alone or first in an array. Apply the whole override in the feature's type-aware block, as now. `typescript.overridesTypeAware` stays, and applies last. Without typed linting, an override that turns such a rule on does nothing.

**Tests.** Add override shapes to the list of step 2: each reproduction with typed linting on and off, linting a JavaScript file, a TypeScript file inside the type-aware scope, one outside it, and a Svelte component. Nothing throws. Inside the scope the rule has the options of the override, and outside it the rule is off.

**Documentation.** In "Feature values" of the README, say that an override of a rule that needs type information applies only where typed linting does. Check the `overridesTypeAware` row of the TypeScript table and the `rules.ts` row of the migration table against the new behavior.

**Done when.** The three reproductions lint without throwing, the options of the override show in the resolved configuration of a file in the type-aware scope, and the snapshots are unchanged.

### Step 4: Keep an overlap exemption inside the files that its override reaches

**State.** Blocked by step 2. It needs the type-aware scope of that step.

**Pull request title.** `fix: exempt a replaced rule only where its override applies`

**Problem.** `overlapConfigs` (`src/overlaps.ts:144`) counts a replaced rule as set by the user when `typescript.overrides` or `typescript.overridesTypeAware` names it, and then leaves the rule alone in every TypeScript file. But `overridesTypeAware` applies in the type-aware block only. Outside it, and everywhere while `typeChecked` is off, the rule keeps the `"error"` of its rule map, even when the override says `"off"`.

**Reproduce.** Lint `src/x.ts` with the content `const unused = 1;` and `export {};` on two lines. ESLint reports `unused-imports/no-unused-vars` and `@typescript-eslint/no-unused-vars`. Without the override, it reports only the first. With `typeChecked: true` and `ignoresTypeAware: ["scripts/**"]`, the same happens in `scripts/build.ts`. `@typescript-eslint/member-ordering` and `@typescript-eslint/adjacent-overload-signatures` behave the same way.

```js
createConfig({
  typescript: {
    overridesTypeAware: { "@typescript-eslint/no-unused-vars": "off" },
  },
});
```

**Change.** Only `typescript.overrides` exempts a rule in all of the feature's files. Turn a rule that only `overridesTypeAware` names off with the other replaced rules, and then set the user's entry again in a block over the type-aware scope that comes after the overlap block. With `typeChecked` off, there is no such block. In "Rules that replace other rules" of the README, the sentence "For `typescript`, that includes `overridesTypeAware`" then needs "in the files that typed linting covers".

**Tests.** In `tests/policy/overlaps.test.ts`: the reproduction with typed linting off, on inside the scope, and on outside it; and an `overridesTypeAware` entry of `"error"`, which keeps the rule on inside the scope only.

**Done when.** The reproduction reports only `unused-imports/no-unused-vars` outside typed linting, an `overridesTypeAware` entry still decides the rule inside it, and the snapshots are unchanged.

### Step 5: Separate the files of the JSON and JSONC blocks

**State.** Not blocked.

**Pull request title.** `fix: keep json.overrides out of JSONC files`

**Problem.** `**/tsconfig*.json`, `**/.vscode/*.json`, and `**/.devcontainer/*.json` match both `json/rules`, through `**/*.json`, and `json/rules-jsonc` (`src/configs/json.ts:33`). The JSONC block sets most rules with a severity only, and ESLint then keeps the options of the earlier block. The options in `json.overrides` therefore reach these files, although the README says that `json.overrides` apply to JSON files only. `tests/policy/language-separation.test.ts` compares severities, so it does not see this.

**Reproduce.** Lint the content `{"é":1}`, with a precomposed `é` (U+00E9), as `tsconfig.audit.json`, `.vscode/settings.json`, and `.devcontainer/devcontainer.json`. Each is reported, with a fix that rewrites the key. Without the override nothing is reported, and neither is `notes.jsonc` with it.

```js
createConfig({
  json: {
    overrides: { "json/no-unnormalized-keys": ["error", { form: "NFD" }] },
  },
});
```

**Change.** Make the two scopes disjoint: the JSON block leaves out the files of the JSONC block. List the built-in exclusions after the user's patterns, so that a negated pattern in `json.ignores` cannot undo them.

**Tests.** In `tests/policy/language-separation.test.ts`, compare the resolved options of a rule with options, not only its severity, in each of the three files, and check that their language is `json/jsonc`.

**Done when.** The three files are not reported with the override, and the snapshots are unchanged.

### Step 6: Reject options that `createConfig` does not know

**State.** Not blocked.

**Pull request title.** `fix!: reject options that createConfig does not know`

**Problem.** `createConfig` ignores a key that it does not know. A config that still uses the options of 0.1.0 runs without an error, with typed linting off and every rule override dropped. Only `// @ts-check` shows the mistake.

**Reproduce.** This call resolves. The result has no type-aware block, and `no-console` is off.

```js
createConfig({
  reactRefreshVariant: "vite",
  rules: { js: { "no-console": "error" } },
  tsTypeChecked: true,
});
```

**Change.** Validate the options before anything else in `createConfig` (`src/factory.ts:40`), and reject with one message that lists every unknown key:

- For an unknown top-level key, name the valid keys.
- For the five names of 0.1.0, name the replacement from the README's migration table: `tsTypeChecked`, `tsconfigRootDir`, `reactRefreshVariant`, `rules`, and `plugins`.
- For an unknown key inside a feature's object, such as `typescript: { typechecked: true }`, name the valid keys of that feature.

Do not map old names to new ones: the record's decision is a clean break. Keep the lists of valid keys where the compiler checks them against the types in `src/types.ts`, for example with `satisfies Record<keyof Options, …>`, so that a new option cannot be forgotten.

**Tests.** A test file under `tests/factory/`: each case above rejects with its message, and a call with every valid key resolves.

**Documentation.** One sentence in "Options" of the README, and one in "Migrating from 0.1.0": the old names now fail with a message that names the new one.

**Done when.** The reproduction rejects with a message that contains `tsTypeChecked` and `typescript.typeChecked`, and `tests/package/readme.test.ts` still passes.

### Step 7: Resolve the root directories to absolute paths

**State.** Not blocked.

**Pull request title.** `fix: resolve projectRootDirectory and tsconfigRootDir to absolute paths`

**Problem.** A relative `projectRootDirectory` becomes the `tsconfigRootDir` of typescript-eslint as it is, and typescript-eslint takes absolute paths only.

**Reproduce.** With these options, every file in the type-aware scope fails with `Parsing error: parserOptions.tsconfigRootDir must be an absolute path, but received: "."`. A relative `typescript.tsconfigRootDir` does the same.

```js
createConfig({
  projectRootDirectory: ".",
  typescript: { typeChecked: true },
});
```

**Change.** Resolve both with `path.resolve` in `resolveOptions` and `resolveTypeScript` (`src/options.ts:118` and `src/options.ts:207`). That resolves from the working directory, which is already the default of `projectRootDirectory`. Say so in the two rows of the README's option tables.

**Tests.** In `tests/factory/options.test.ts`: a relative value of each option resolves to an absolute path, and an absolute one stays as it is.

**Done when.** The reproduction lints a file of the type-aware scope without a parsing error.

### Step 8: Give each React override to the block that has its plugin

**State.** Not blocked.

**Pull request title.** `fix: apply react-refresh overrides only while React Refresh is on`

**Problem.** `react/html` spreads all of `react.overrides` (`src/configs/react.ts:148`). The `react-refresh` plugin is registered in `react/refresh` only, and that block exists only while React Refresh is on. Since the rewrite, React Refresh is off unless the project declares `next` or `vite`, so an override of its rule stops ESLint.

**Reproduce.** In a project whose `package.json` declares `react` and neither `next` nor `vite`, resolve the configuration of `src/App.tsx`. ESLint throws `Key "rules": Key "react-refresh/only-export-components": Could not find plugin "react-refresh" in configuration`.

```js
createConfig({
  react: {
    overrides: { "react-refresh/only-export-components": "error" },
  },
});
```

**Change.** Split the overrides by plugin, as the hooks block already does: `react-refresh/*` in `react/refresh` only, `react-hooks/*` in `react/hooks` only, and the rest in `react/html`. While React Refresh is off, a `react-refresh/*` override applies nowhere. Add that to the sentence about overrides in the React section of the README.

**Tests.** In `tests/configs/react.test.ts`: the reproduction resolves and the rule is not set; with `refresh: "vite"`, the override applies.

**Done when.** The reproduction resolves without an error, and the snapshots are unchanged.

### Step 9: Make the rules that come back for an owner fit together

**State.** Blocked by decision D1.

**Pull request title.** For option A, `fix!: bring back only the checks that an owner replaces`.

**Problem.** In 0.1.0, a rule that another plugin's rule replaces was always off. Since #62 and #67 it is on in its own feature, and `src/overlaps.ts` turns it off only where its owner lints. So it comes back when the owner is off or leaves a file out. The tests check that it comes back, not that the result can be satisfied. Four cases:

1. `perfectionist: false` turns on core `sort-imports` and `import-x/order`, which contradict each other. The file below passes with the defaults. With `perfectionist: false`, `sort-imports` reports it ("Imports should be sorted alphabetically"), and with the two imports swapped, `import-x/order` does. No order passes.
2. The README's own example, `perfectionist: { ignores: ["src/generated/**"] }` (`README.md:106`), turns on `sort-keys`, `sort-imports`, `import-x/order`, `import-x/first`, `@typescript-eslint/member-ordering`, and `@typescript-eslint/adjacent-overload-signatures` in `src/generated/**`. There, `export const table = { zeta: 1, alpha: 2 };` is reported by `sort-keys`.
3. `imports: false` turns on core `no-duplicate-imports` with `allowSeparateTypeImports: false`. It reports the separate `import type` that the config requires while `imports` is on. It also turns on `n/no-missing-import`, which reports imports that exist. With `imports: false`, two fixtures are reported: `tests/fixtures/temperature.ts` for `./format-date.js`, a JavaScript file with a declaration file, and `tests/fixtures/svelte/Counter.svelte` for `./theme.svelte.js`, which is `theme.svelte.ts`.
4. `unicorn: false`, or a file in `unicorn.ignores`, turns on core `no-warning-comments`, which reports `// TODO: tidy this up later`. With `unicorn` on, `unicorn/expiring-todo-comments` lets that comment pass.

```js
import { readFile } from "node:fs/promises";

import { alpha } from "./local.js";

export const value = [readFile, alpha];
```

**Decision D1.** Which replaced rules come back?

- **Option A, recommended.** Split the table into checks and style. A check comes back as today, when its owner is off and in the files that its owner leaves out: the three rules that `regexp` replaces, the two that `unusedImports` replaces, `no-negated-condition`, `n/no-process-exit`, `n/prefer-node-protocol`, `no-duplicate-imports` with `allowSeparateTypeImports: true`, `n/no-extraneous-import`, `n/file-extension-in-import`, and `n/no-missing-import` where it resolves correctly. A style rule never comes back, and is `"off"` in its rule map as in 0.1.0: everything that `perfectionist` replaces, and `no-warning-comments`. Turning `perfectionist` off then turns sorting off.
- **Option B.** Every rule still comes back, and only the contradictions go. `sort-imports` stays off or gets `ignoreDeclarationSort: true`, `no-duplicate-imports` gets `allowSeparateTypeImports: true`, `n/no-missing-import` is fixed or limited, and the README example changes.
- **Option C.** No change to the code. The README says that turning off or narrowing `perfectionist`, `imports`, or `unicorn` needs overrides of the rules that come back.

**Change, after the decision.** Apply the option to `src/overlaps.ts` and the rule maps, with their "Off while … is on" comments. For `n/no-missing-import`, try its settings first, `tryExtensions` and `typescriptExtensionMap`. If it still cannot resolve the two fixture imports, leave it off in TypeScript files and Svelte components, where the compiler reports a missing module. Update the table and the three bullets of "Rules that replace other rules" in the README.

**Tests.** `tests/policy/overlaps.test.ts` has one case for each row of the table; update them. Add what is missing: with each owner off in turn, the fixtures of `tests/policy/fixtures.test.ts` lint without messages, and so does the file above.

**Snapshots.** The default ones do not change. Under option A, those in `tests/policy/__snapshots__/effective-rules/narrowed-owners/` do; explain each changed line.

**Done when.** With `perfectionist: false`, the file above has no message. Under option A, the README example leaves `src/generated/**` without sorting rules.

### Step 10: Settle what a feature's `files` means

**State.** Blocked by decision D2, and by steps 2 to 4, which change the same scope code.

**Pull request title.** For option A, `feat!: narrow a feature's default files with files`. For option B, `docs: describe what files replaces`.

**Problem.** A feature's `files` replaces its default files. That has three effects:

1. A pattern without an extension, such as `src/**`, reaches the JSON and Markdown files there, and ESLint stops with "The following rules do not support the language". The record lists this under "Found, not changed", and the README warns about it.
2. A feature with `files` no longer lints Svelte components, because they are part of its default files only. With `typescript: { files: ["src/**/*.ts"] }`, a component gets no typescript-eslint rules, and keeps the core rules that TypeScript files turn off, such as `no-undef`. The README's advice to give each pattern an extension leads here.
3. `typescript.filesTypeAware` works the other way. It narrows, "so a directory such as `src/**` is enough".

**Decision D2.** Replace or narrow?

- **Option A, recommended.** `files` narrows the default files: a file is linted when it matches a default pattern and one of `files`, as `narrowFiles` computes. Then `src/**` works, components stay, `react.files` narrows each part of the feature, and `files` agrees with `filesTypeAware`. The cost: `files` can no longer extend a feature to another extension, which then takes a user config.
- **Option B.** `files` keeps replacing, and the README describes effects 2 and 3.

**Change, after the decision.** Under option A, use the narrowed default files where a builder now has `files ?? defaults`, and in `overlapConfigs` and `resolveTypeAwareScope`; `exceptions.ts` and `resolveSvelteComponents` narrow already. In the README, rewrite the `files` bullet of "Feature values", remove the warning about extensions, and check the Monorepos example. In the record, move "`files` without an extension" out of "Found, not changed". Under option B, add effects 2 and 3 to "Feature values" in the README, and change nothing else.

**Tests.** Under option A, `tests/factory/feature-toggles.test.ts` gives every feature a `files` with extensions and must keep passing. Add `files: ["app/**"]` for every feature: the JSON and Markdown files under `app/` lint without an error, and a component under `app/` keeps the feature's rules.

**Done when.** Under option A, `files: ["src/**"]` lints a project with JSON, Markdown, and Svelte files in `src/` without an error, and the snapshots of the default options are unchanged.

### Step 11: Document the TypeScript range and two limits

**State.** Not blocked.

**Pull request title.** `docs: state the TypeScript range and two limits`

Each item is something that the audit reproduced and that no other step changes.

1. **The TypeScript range.** "Requirements" in the README names Node.js and ESLint only. typescript-eslint, a dependency, supports TypeScript from 4.8.4 to below 6.1, and npm installs a version in that range when the project has none. TypeScript 7 is already the `latest` version on npm. With it in a project, `npm install` prints "ERESOLVE overriding peer dependency" and succeeds. ESLint then stops for every file while it loads the config: `TypeError: Cannot read properties of undefined (reading 'Intrinsic')`, from `ts-api-utils`. State the range, and that TypeScript 7 is not supported yet. Take the range from `node_modules/typescript-eslint/package.json`, not from this document.
2. **Path aliases in a monorepo.** The import resolver reads the tsconfig in `tsconfigRootDir` only (`src/configs/imports.ts:148`). With the Monorepos example of the README, an import through the `paths` of a workspace's own tsconfig is reported by `import-x/no-unresolved`, unless the root tsconfig lists that workspace under `references`. Add this to "Monorepos", with the way out: a user config for the workspace's files that sets `import-x/resolver-next` to a resolver with the workspace's tsconfig. Describe it in prose, or mark the code block as `CONTRIBUTING.md` says for a block that must not run.
3. **JSX in `.js` files.** JSX parses in `.jsx`, `.mjsx`, and `.tsx` files only (`src/configs/javascript/index.ts:37`). A `.js` file with JSX, the usual name of a page in a JavaScript Next.js project, fails with `Parsing error: Unexpected token <`. So does a `.mtsx` file, although the globs of the TypeScript and React features list that extension: typescript-eslint reads JSX in `.tsx` files only. Add both to "Limits".
4. **A stale comment.** `src/configs/javascript/suggestions.ts:371` says "Off while unicorn is on" above three rules, but `no-nested-ternary` has been on in every file since #72. Move that rule out from under the comment. Skip this item if step 9 has rewritten these comments.

**Done when.** `npm run validate` passes; it runs the README examples.

### Step 12: Close out

**State.** Blocked by every other step: each box is ticked.

**Pull request title.** `docs: close the audit follow-up`

Run every reproduction of this document against `main`, and confirm that each gives the expected result. Report one that does not; do not fix it in this pull request. Then add the audit and its pull requests to `docs/rewrite/record.md`, move what the steps settled out of its open questions, and tick the last box.

## Not planned

The audit also noticed the following. They are choices about the policy or the project, so no step covers them. Each waits for the maintainer to ask for it.

- A `typescript` peer dependency with the range of typescript-eslint, so that `npm install` fails on TypeScript 7 instead of ESLint. It needs a tested lower bound for the `minimum-peers` job of CI.
- A macOS job in CI, which would have caught the problem of step 1.
- Global ignores for the output of frameworks that the config supports, `.next/` and `.svelte-kit/`. Only `dist/`, `build/`, and `coverage/` are ignored.
- JSX in `.js` files while the React feature is on.
- An error when `filesTypeAware` or `overridesTypeAware` is set while `typeChecked` is not `true`. Today they do nothing.
- The known issues in the README and the open questions in the record. The audit reproduced two of them again: the Markdown URL in square brackets, and the custom element that becomes self-closing. They stay where they are listed.

## Prompts

For one step, with its number in place of `<N>`:

```text
Implement step <N> of docs/rewrite/audit-follow-up.md in this repository, and only that step.

That document is the follow-up plan for an audit of the config rewrite. Each step is one focused pull request. Read CLAUDE.md first, then "Rules for every step" in the document, then the step itself: it gives the reproduction, the change, the tests, and how to tell that it is done.

Reproduce the problem before you change anything. If it does not reproduce on the latest origin/main, or if the step is blocked and what blocks it is not resolved in the document, stop and tell me what you found. Do not work around it.

When the step is done, open a pull request and stop: do not merge it. Then tell me what you changed, the result before and after for each reproduction, the result of npm run validate, and anything you left open.
```

To let the agent pick the step, replace the first line with this one:

```text
Implement the next step of docs/rewrite/audit-follow-up.md in this repository: the first one in its checklist that is not ticked and not blocked. Implement only that step, and tell me which one you picked before you start.
```

For a step that a decision blocks, add this line after the first one:

```text
My decision for <D1 or D2> is option <letter>. Write it into the decisions table in the same pull request.
```
