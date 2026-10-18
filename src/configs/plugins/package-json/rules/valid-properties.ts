import type { Rules } from "../../../../types.js";

const validPropertiesRules: Rules = {
  // --- Rules with default options (41/41) ---------------------------------------------------------------------------------------------------------.
  "package-json/valid-author": "error", // Automatically fixable by the --fix command.
  "package-json/valid-bin": "error",
  "package-json/valid-browser": "error",
  "package-json/valid-bugs": "error",
  "package-json/valid-bundleDependencies": "error",
  "package-json/valid-config": "error",
  "package-json/valid-contributors": "error",
  "package-json/valid-cpu": "error",
  "package-json/valid-dependencies": "error",
  "package-json/valid-description": "error",
  "package-json/valid-devDependencies": "error",
  "package-json/valid-devEngines": "error",
  "package-json/valid-directories": "error",
  "package-json/valid-engines": "error",
  "package-json/valid-exports": "error",
  "package-json/valid-files": "error",
  "package-json/valid-funding": "error",
  "package-json/valid-gypfile": "error",
  "package-json/valid-homepage": "error",
  "package-json/valid-keywords": "error",
  "package-json/valid-libc": "error",
  "package-json/valid-license": "error",
  "package-json/valid-main": "error",
  "package-json/valid-man": "error",
  "package-json/valid-module": "error",
  "package-json/valid-name": "error",
  "package-json/valid-optionalDependencies": "error",
  "package-json/valid-os": "error",
  "package-json/valid-packageManager": "error",
  "package-json/valid-peerDependencies": "error",
  "package-json/valid-peerDependenciesMeta": "error",
  "package-json/valid-peerDependenciesMeta-relationship": "error", // Manually fixable by editor suggestions.
  "package-json/valid-private": "error",
  "package-json/valid-publishConfig": "error",
  "package-json/valid-repository": "error",
  "package-json/valid-repository-directory": "error", // Manually fixable by editor suggestions.
  "package-json/valid-scripts": "error",
  "package-json/valid-sideEffects": "error",
  "package-json/valid-type": "error",
  "package-json/valid-version": "error",
  "package-json/valid-workspaces": "error",
} as const;

export { validPropertiesRules }; // 41 rules, 1 automatically fixable, 2 editor suggestions fixable.
