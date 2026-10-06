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

## Making changes

Create a branch from the latest `main` and keep each pull request focused.
Use a conventional pull request title, such as `fix: ...`, `test: ...`, or
`docs: ...`. Describe the problem and resulting behavior, including
before/after examples when lint diagnostics or fixes change.

Add relevant regression tests for behavior changes. Rule tests live in
`tests/rules/`. For configuration or plugin changes, exercise packed
consumers in `tests/package.smoke.test.ts` as well.

## Validation

Before opening a pull request, run:

```bash
npm run validate
```

This runs formatting checks, a build, typechecking, linting, tests, and
package integrity checks. Package smoke tests exercise the tarball in
temporary consumer projects.

The pre-commit hook runs ESLint fixes and Prettier on staged files, and the
pre-push hook runs `npm test`. Full validation runs through
`npm run validate` and in CI.

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
