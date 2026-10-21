/* eslint-disable n/no-unsupported-features/node-builtins -- module.registerHooks() is a release candidate since Node.js 24.13.1, older than the supported range. */

import type { ResolveFnOutput, ResolveHookContext } from "node:module";
import { registerHooks } from "node:module";
import process from "node:process";

/**
 * Resolves an import of a TypeScript module that names its `.js` file to the `.ts` source when
 * there is no `.js` file. The modules of this repository import each other by their `.js` names,
 * as the compiler expects, but Node.js, which strips the types of a `.ts` file, looks for the
 * name as it is written.
 */
const resolveTypeScriptSource = (
  specifier: string,
  context: Readonly<ResolveHookContext>,
  nextResolve: (
    specifier: string,
    context?: Readonly<Partial<ResolveHookContext>>,
  ) => ResolveFnOutput,
): ResolveFnOutput => {
  try {
    return nextResolve(specifier, context);
  } catch (error) {
    const isTypeScriptImport =
      context.parentURL?.endsWith(".ts") === true &&
      /^\.{1,2}\/.*\.js$/u.test(specifier);
    if (!isTypeScriptImport) {
      // eslint-disable-next-line functional/no-throw-statements -- Any other failure must stay visible.
      throw error;
    }
    return nextResolve(specifier.replace(/\.js$/u, ".ts"), context);
  }
};

const hooks = registerHooks({ resolve: resolveTypeScriptSource });
const { runPolicyDiff } = await import("./policy-diff/report.js");
const exitCode = await runPolicyDiff(process.argv.slice(2));
hooks.deregister();

// eslint-disable-next-line functional/immutable-data, functional/no-expression-statements -- The exit status tells a script whether the report is complete, without cutting off its output as process.exit() can.
process.exitCode = exitCode;
