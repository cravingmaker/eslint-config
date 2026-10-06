import type { Linter } from "eslint";
import type { Options } from "./types.js";

import { defineConfig } from "eslint/config";

import { comments } from "./configs/comments.js";
import { express } from "./configs/express.js";
import { functional } from "./configs/functional.js";
import { html } from "./configs/html.js";
import { ignores } from "./configs/ignores.js";
import { imports } from "./configs/imports.js";
import { javascript } from "./configs/javascript/index.js";
import { json } from "./configs/json.js";
import { markdown } from "./configs/markdown.js";
import { node } from "./configs/node.js";
import { packageJson } from "./configs/package-json.js";
import { perfectionist } from "./configs/perfectionist.js";
import { promise } from "./configs/promise.js";
import { react } from "./configs/react.js";
import { regexp } from "./configs/regexp.js";
import { security } from "./configs/security.js";
import { svelte } from "./configs/svelte.js";
import { typescript } from "./configs/typescript/index.js";
import { unicorn } from "./configs/unicorn.js";
import { unusedImports } from "./configs/unused-imports.js";
import { createContext, detectFeatures } from "./context.js";
import { resolveOptions } from "./options.js";

/**
Builds the ESLint flat config. Every feature is on unless it is `false`, except `react`,
`svelte`, and `express`, which are on when the project uses them. The blocks come in a fixed
order: global ignores, JavaScript and the code-quality plugins, TypeScript, frameworks, and
file formats, followed by `userConfigs` in the order given.
*/
async function createConfig(
  options: Options = {},
  // eslint-disable-next-line functional/functional-parameters, functional/prefer-immutable-types -- The public signature takes user configs as rest arguments of ESLint's mutable config type.
  ...userConfigs: Linter.Config[]
): Promise<Linter.Config[]> {
  const context = await createContext(options);
  const resolved = resolveOptions(
    options,
    detectFeatures(context.dependencies),
  );
  const [typescriptConfigs, reactConfigs, svelteConfigs, expressConfigs] =
    await Promise.all([
      resolved.typescript === undefined
        ? []
        : typescript(resolved.typescript, context),
      resolved.react === undefined ? [] : react(resolved.react),
      resolved.svelte === undefined ? [] : svelte(resolved.svelte, context),
      resolved.express === undefined ? [] : express(resolved.express),
    ]);

  return defineConfig([
    ...ignores(resolved.ignores),

    ...javascript(resolved.javascript, context),
    ...(resolved.comments === undefined ? [] : comments(resolved.comments)),
    ...(resolved.node === undefined ? [] : node(resolved.node, context)),
    ...(resolved.security === undefined ? [] : security(resolved.security)),
    ...(resolved.imports === undefined
      ? []
      : imports(resolved.imports, context)),
    ...(resolved.unusedImports === undefined
      ? []
      : unusedImports(resolved.unusedImports)),
    ...(resolved.promise === undefined ? [] : promise(resolved.promise)),
    ...(resolved.regexp === undefined ? [] : regexp(resolved.regexp)),
    ...(resolved.unicorn === undefined ? [] : unicorn(resolved.unicorn)),
    ...(resolved.functional === undefined
      ? []
      : functional(resolved.functional, context)),
    ...(resolved.perfectionist === undefined
      ? []
      : perfectionist(resolved.perfectionist)),

    ...typescriptConfigs,

    ...reactConfigs,
    ...svelteConfigs,
    ...expressConfigs,

    ...(resolved.html === undefined ? [] : html(resolved.html)),
    ...(resolved.json === undefined ? [] : json(resolved.json)),
    ...(resolved.packageJson === undefined
      ? []
      : packageJson(resolved.packageJson)),
    ...(resolved.markdown === undefined ? [] : markdown(resolved.markdown)),

    ...userConfigs,
  ]);
}

export { createConfig };
