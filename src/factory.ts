import type { Linter } from "eslint";
import type { Context, Options } from "./types.js";

import { defineConfig } from "eslint/config";

import { comments } from "./configs/comments.js";
import { core } from "./configs/core/index.js";
import { exceptions } from "./configs/exceptions.js";
import { express } from "./configs/express.js";
import { functional } from "./configs/functional.js";
import { html } from "./configs/html/index.js";
import { ignores } from "./configs/ignores.js";
import { imports } from "./configs/imports/index.js";
import { json } from "./configs/json.js";
import { markdown } from "./configs/markdown.js";
import { node } from "./configs/node.js";
import { packageJson } from "./configs/package-json.js";
import { perfectionist } from "./configs/perfectionist/index.js";
import { promise } from "./configs/promise.js";
import { react } from "./configs/react.js";
import { regexp } from "./configs/regexp.js";
import { security } from "./configs/security.js";
import { svelte } from "./configs/svelte.js";
import { typescript } from "./configs/typescript/index.js";
import { unicorn } from "./configs/unicorn.js";
import { unusedImports } from "./configs/unused-imports.js";
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
Builds the ESLint flat config. Frameworks are detected from the project manifest, and all other
features are on unless explicitly disabled. Rule ownership is declared in each feature's map.
File-role exceptions follow the features, then user configs apply in the order supplied.
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
    ...core(resolved.javascript, context),
    ...buildFeature(resolved.comments, comments, context),
    ...buildFeature(resolved.node, node, context),
    ...buildFeature(resolved.security, security, context),
    ...buildFeature(resolved.imports, imports, context),
    ...buildFeature(resolved.unusedImports, unusedImports, context),
    ...buildFeature(resolved.promise, promise, context),
    ...buildFeature(resolved.regexp, regexp, context),
    ...buildFeature(resolved.unicorn, unicorn, context),
    ...buildFeature(resolved.functional, functional, context),
    ...buildFeature(resolved.perfectionist, perfectionist, context),
    ...typescriptConfigs,
    ...reactConfigs,
    ...svelteConfigs,
    ...expressConfigs,
    ...buildFeature(resolved.html, html, context),
    ...buildFeature(resolved.json, json, context),
    ...buildFeature(resolved.packageJson, packageJson, context),
    ...buildFeature(resolved.markdown, markdown, context),
    ...exceptions(resolved),
    ...userConfigs,
  ]);
};

export { createConfig };
