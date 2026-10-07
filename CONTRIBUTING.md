# Contributing

## Setup

Development and the published configuration require Node.js 24.15.0 or newer.

Use the contributor Node.js version pinned in [.nvmrc](.nvmrc). If you use
nvm, run:

```bash
nvm install
nvm use
```

From a local checkout, run:

```bash
npm ci
npm run prepare
```

The repository disables installation scripts, so run `npm run prepare`
explicitly once per checkout to activate Husky hooks.

See [README.md](README.md) for the runtime configuration and supported
integrations.

### Claude Code cloud sessions

The cloud image of Claude Code ships Node.js 20, 21, and 22. To install
Node.js 24 next to them, paste this into the **Setup script** field of
the environment at [claude.ai/code](https://claude.ai/code). It runs as
root before Claude Code starts, and its result is cached for later
sessions:

```bash
#!/bin/bash
set -euo pipefail

# Keep in sync with .nvmrc.
NODE_VERSION=24.21.0

case "$(uname -m)" in
  x86_64) NODE_ARCH=x64 ;;
  aarch64) NODE_ARCH=arm64 ;;
  *) echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;;
esac

mkdir -p /opt/node24
curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.gz" \
  | tar -xz --strip-components=1 -C /opt/node24
```

The script does not change the default `node`, which stays first on
`PATH`, so [CLAUDE.md](CLAUDE.md) tells Claude to put `/opt/node24/bin`
first on `PATH` in every command. Without the script, Claude installs
Node.js 24 itself at the start of each session.

## Making changes

Create a branch from the latest `main` and keep each pull request focused.
Use a conventional pull request title, such as `fix: ...`, `test: ...`, or
`docs: ...`. Describe the problem and resulting behavior, including
before/after examples when lint diagnostics or fixes change.

Add relevant regression tests for behavior changes. The tests for a
feature live in `tests/configs/`, in the file named after its module in
`src/configs/`. For configuration or plugin changes, exercise packed
consumers in `tests/package/` as well.

## Things to know

- **Build before linting and testing.** `eslint.config.js` and most
  tests import `./dist/index.mjs`. After changing `src/`, run
  `npm run build` first, or you lint and test the previous build.
- **Internal builders are tested from source.** Feature builders are not
  exported from the package root. Tests for them import from `src/`, as
  `tests/configs/javascript/index.test.ts` does.
- **Snapshots record the policy.** `tests/policy/__snapshots__/` holds
  the configuration that ESLint resolves for representative paths, one
  rule per line. A changed line is a changed policy: update the snapshots
  with `npx vitest run tests/policy -u`, read the diff, commit it with
  the change that caused it, and say in the commit message what changed
  and why. A dependency update that brings new or changed rules shows up
  the same way. Never edit a snapshot by hand. The snapshots are `.txt`
  files, which keeps ESLint and Prettier away from them.
- **`functional/prefer-immutable-types` shares a cache across files.** It
  checks parameters shallowly, which gives the same result whatever files
  are linted together, except for a parameter whose type is a mapped type
  that copies modifiers, such as `Partial<Readonly<T>>`. Write
  `Readonly<Partial<T>>` instead, and do not add a disable comment: in
  the runs where the rule stays silent, the comment is reported as
  unused. The cache is off while `NODE_ENV` is `test`, so a Vitest test
  that lints in its own process cannot show such a difference;
  `tests/policy/parameter-immutability.test.ts` lints in a child process.
  Check both `npx eslint .` and `npx eslint <the files you changed>`
  before committing.
- **`eslint --fix` reorders literals.** Perfectionist sorts object keys
  and some arrays. Do not encode meaning in the order of an array literal
  that a fix may sort.
- **A severity-only entry keeps earlier options.** When a later block
  sets a rule to only `"off"` or `"error"`, ESLint keeps the options from
  an earlier block, and the snapshots record them. Inside one block, an
  object spread replaces the whole entry instead. This is why moving a
  rule between blocks can change a snapshot line even when the rule stays
  off.
- **A `files` pattern also decides which files `eslint .` lints.** ESLint
  lints every file that a block's `files` matches, unless the pattern is
  `*` or ends in `/*` or `/**`. A block for files selected by name, such
  as `**/*.config.*`, therefore needs an AND pattern with an extension
  glob, as `configs/exceptions.ts` does. Without it, `eslint .` parses
  the `.txt` snapshots as JavaScript and fails. ESLint's own default
  config also matches `**/*.js`, `**/*.mjs`, and `**/*.cjs`, so such a
  file is linted even when no block of this config matches it, with only
  the blocks that have no `files`. That is why `.cjs` files are still
  parsed, while `.cts` files are skipped.
- **The defaults detect frameworks from this repository's manifest.**
  `"auto"` reads the manifest at `projectRootDirectory`, which defaults
  to the working directory. A test that runs in this repository with the
  defaults therefore has React and Svelte on, because this repository's
  manifest declares `react` and `svelte`, and Express and React Refresh
  off. With React on, the hooks rules apply to every JavaScript and
  TypeScript file, and with Svelte on, `createContext()` carries the
  Svelte components, which `defaultContext` does not. A test that needs
  a framework sets it, or points `projectRootDirectory` at a temporary
  project root whose manifest declares it, as
  `tests/factory/feature-toggles.test.ts` does.
- **Svelte components are sources too.** While the Svelte feature is on,
  the features for JavaScript and TypeScript sources take
  `withSvelteComponents(sourceFiles, context.svelteComponents)`, or
  `typescriptFiles` for the TypeScript scopes, as their default files. A
  new block for sources must do the same: with `sourceFiles` alone it
  misses components, and with `**/*.svelte` alone it reaches components
  that svelte-eslint-parser does not read, which espree then fails to
  parse.
- **import-x parses imported modules with the importing file's parser.**
  For a Svelte file, that is svelte-eslint-parser, which reads every file
  but a rune module as a component, so the Svelte block maps `.js`,
  `.mjs`, and `.cjs` to espree with `import-x/parsers`. A block that sets
  a parser which cannot read plain JavaScript modules needs the same
  setting.
- **A rule that is on needs its plugin in every file it reaches.** ESLint
  rejects the configuration of a file where a rule is on but no block
  registers its plugin, with `Could not find plugin`; a rule that is only
  `"off"` passes. A block that reaches more files than the blocks that
  register its feature's other plugins must not spread all of the
  feature's `overrides`, which is why `react/hooks` takes only the
  `react-hooks/*` overrides. `calculateConfigForFile` shows the error, so
  a test of the resolved configuration catches it.
- **Type information follows the type-aware scope.** Only
  `typescript/parser-type-aware` sets `projectService`, over
  `context.typeAware`, which stays within the files that
  `typescript/parser` parses. A rule that needs type information crashes
  the whole run in a file without it, with "You have used a rule which
  requires type information", so a feature's type-aware block takes its
  files from `narrowTypeAwareScope`, through `typeAwareConfig`, and never
  from its own `files` alone.
- **TypeScript files outside the TypeScript feature do not parse.** The
  JavaScript and code-quality blocks match `.ts` files through
  `sourceFiles`, but only `typescript/parser` reads TypeScript. With
  `typescript: false`, or for a file outside `typescript.files` or in
  `typescript.ignores`, ESLint lints the file with espree and reports
  `Parsing error: Unexpected token :`. A test of those options that only
  compares resolved configurations does not show this; lint real
  TypeScript source with `lintText`.
- **A missing peer needs a consumer.** Every optional peer is a dev
  dependency of this repository, so a test that runs in this repository
  always finds them. A test of a missing or partial peer set runs in a
  consumer from `tests/package/smoke.test.ts`, whose `node_modules` links
  only the packages the test lists, or in one from
  `tests/package/install.test.ts`, which installs them from the registry.
  The links point into this repository, so a linked peer still finds its
  own dependencies here, and npm installs the required peers of a peer,
  as it does `svelte-eslint-parser` with
  `@html-eslint/eslint-plugin-svelte`. Check a peer set that npm can
  produce with a real install.
- **The formatter test guards layout.** Prettier formats, so
  `tests/policy/formatter.test.ts` fails when a rule that
  `eslint-config-prettier` turns off is on, apart from its listed
  exceptions, or when an @html-eslint plugin has a style rule that is
  neither off as layout nor kept with a reason. A dependency update can
  bring such a rule. Turn it off in its rule map with the reason, or, if
  it cannot conflict with Prettier, list it with that reason; check the
  claim by formatting a sample with Prettier and linting the result.
- **The fixtures are a project of their own.** `tests/fixtures/` has its
  own `package.json` and `tsconfig.json`. The repository's `eslint .`
  ignores the folder and the root tsconfig leaves it out, so
  `tests/policy/fixtures.test.ts` is what lints it, and it fails on a
  file that it does not list. A fixture must lint without messages with
  every feature on, with and without typed linting, and Prettier formats
  it, `.svelte` files included.
- **The README examples run.** `tests/package/readme.test.ts` installs
  what the `npm install` commands of the README name, writes each
  JavaScript block of the README as the `eslint.config.js` of a project
  in that consumer, type-checks it, and lints the fixtures with it. A
  block that must not run, such as the options of 0.1.0, follows an
  `<!-- eslint-skip -->` comment. The install commands must name ESLint,
  the package, and every optional peer but React and Svelte.
- **A rule test checks this package, not the plugin.** If the sample of
  a rule test is reported the same with the rule reset to its plugin's
  defaults, the test repeats upstream behavior; test an option, a
  decision such as a rule that stays off, or wiring instead. A negative
  test needs a sample that the rule reports when it is on, or it cannot
  fail.
- **Doc comments between module members.** `perfectionist/sort-modules`
  counts a blank line inside a documentation comment as spacing between
  the members around it, and its fix cannot remove it. A function that
  follows another function in the same group needs a doc comment without
  a paragraph break.

## Validation

Before opening a pull request, run:

```bash
npm run validate
```

This runs formatting checks, a build, typechecking, linting, tests, and
package integrity checks. Package tests exercise the tarball in temporary
consumer projects. Some install it from the npm registry, so the tests need
network access.

For faster feedback, run `npm run test:unit` for unit tests or
`npm run test:package` for package consumer tests. Both commands build the
package first; their `:built` variants reuse an existing build.

To browse the configuration that `eslint.config.js` resolves, run
`npm run inspect`. It builds the package and opens
`@eslint/config-inspector` at <http://localhost:7777>.

The pre-commit hook runs `npm run check:commit`, which invokes
`npm run lint:staged` to build the package and apply Prettier and ESLint
fixes to staged files. The pre-push hook runs the full test suite through
`npm test`. Full validation runs through `npm run validate` and in CI.

## Releases

Before preparing a release, run:

```bash
npm run release:check
```

This runs a dependency security audit, full validation, and a dry run of the
package tarball.

Update `package.json` and `package-lock.json` to the intended version.
Include consumer-facing migration guidance when rule defaults or
configuration behavior change.

Create a matching `vX.Y.Z` tag from a commit on `main` and publish a GitHub
Release. The [npm publishing workflow](.github/workflows/publish.yml)
verifies the tag matches `package.json`, confirms the tagged commit is
reachable from `main`, and checks that the version has not already been
published. It then validates and publishes the packed artifact using npm
Trusted Publishing. Prereleases do not trigger publishing.

## Reporting issues

For linting bugs, open a
[GitHub issue](https://github.com/cravingmaker/eslint-config/issues) with a
minimal input, the configuration used, actual and expected diagnostics or
fixes, and the package, Node.js, ESLint, and optional plugin versions.

Report vulnerabilities privately using [SECURITY.md](SECURITY.md).
