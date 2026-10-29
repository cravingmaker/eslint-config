import type { Linter } from "eslint";
import type { Context, Options } from "./types.js";

import { defineConfig } from "eslint/config";

import { core } from "./configs/core/index.js";
import { exceptions } from "./configs/exceptions/index.js";
import { ignores } from "./configs/ignores/index.js";
import { linterOptions } from "./configs/linter-options/index.js";
import { comments } from "./configs/plugins/comments/index.js";
import { enforcePackageType } from "./configs/plugins/enforce-package-type/index.js";
import { express } from "./configs/plugins/express/index.js";
import { functional } from "./configs/plugins/functional/index.js";
import { html } from "./configs/plugins/html/index.js";
import { imports } from "./configs/plugins/imports/index.js";
import { json } from "./configs/plugins/json/index.js";
import { markdown } from "./configs/plugins/markdown/index.js";
import { node } from "./configs/plugins/node/index.js";
import { packageJson } from "./configs/plugins/package-json/index.js";
import { perfectionist } from "./configs/plugins/perfectionist/index.js";
import { promise } from "./configs/plugins/promise/index.js";
import { react } from "./configs/plugins/react/index.js";
import { regexp } from "./configs/plugins/regexp/index.js";
import { security } from "./configs/plugins/security/index.js";
import { sonarjs } from "./configs/plugins/sonarjs/index.js";
import { stylistic } from "./configs/plugins/stylistic/index.js";
import { svelte } from "./configs/plugins/svelte/index.js";
import { typescript } from "./configs/plugins/typescript/index.js";
import { unicorn } from "./configs/plugins/unicorn/index.js";
import { unusedImports } from "./configs/plugins/unused-imports/index.js";
import { prepareConfig } from "./context.js";

// A disabled feature contributes no blocks; rule ownership stays in the owning maps.
const buildFeature = <
  Settings,
  Result extends Linter.Config[] | Promise<Linter.Config[]>,
>(
  settings: Settings | undefined,
  build: (settings: Settings, context: Context) => Result,
  context: Context,
): Result | [] => {
  return typeof settings === "undefined" ? [] : build(settings, context);
};

/**
 * Builds the ESLint flat config. It is TypeScript first: TypeScript files get typescript-eslint's strict rules, with type information unless `typescript.typeChecked` is `false`. Frameworks are detected from the project manifest, and all other features are on unless explicitly disabled. Rule ownership is declared in each feature's map. File-role exceptions follow the features, then user configs apply in the order supplied.
 */
const createConfig = async (
  options: Options = {},
  // eslint-disable-next-line functional/functional-parameters, functional/prefer-immutable-types -- The public signature takes user configs as rest arguments of ESLint's mutable config type.
  ...userConfigs: Linter.Config[]
): Promise<Linter.Config[]> => {
  const { context, resolved } = await prepareConfig(options);
  const [typescriptConfigs, reactConfigs, svelteConfigs, expressConfigs] =
    await Promise.all([
      buildFeature(resolved.typescript, typescript, context),
      buildFeature(resolved.react, react, context),
      buildFeature(resolved.svelte, svelte, context),
      buildFeature(resolved.express, express, context),
    ]);

  return defineConfig([
    ...ignores(resolved.ignores),
    ...linterOptions,
    ...core(resolved.javascript, context),
    ...buildFeature(resolved.comments, comments, context),
    ...buildFeature(resolved.node, node, context),
    ...buildFeature(resolved.security, security, context),
    ...buildFeature(resolved.sonarjs, sonarjs, context),
    ...buildFeature(resolved.imports, imports, context),
    ...buildFeature(resolved.unusedImports, unusedImports, context),
    ...buildFeature(resolved.promise, promise, context),
    ...buildFeature(resolved.regexp, regexp, context),
    ...buildFeature(resolved.unicorn, unicorn, context),
    ...buildFeature(resolved.functional, functional, context),
    ...buildFeature(resolved.perfectionist, perfectionist, context),
    ...buildFeature(resolved.stylistic, stylistic, context),
    ...typescriptConfigs,
    ...reactConfigs,
    ...svelteConfigs,
    ...expressConfigs,
    ...buildFeature(resolved.html, html, context),
    ...buildFeature(resolved.json, json, context),
    ...buildFeature(resolved.packageJson, packageJson, context),
    ...buildFeature(resolved.packageJson, enforcePackageType, context),
    ...buildFeature(resolved.markdown, markdown, context),
    ...exceptions(resolved),
    ...userConfigs,
  ]);
};

export { createConfig };
