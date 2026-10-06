import type { Linter } from "eslint";
import type { Context, TypeScriptOptions } from "../../types.js";

import { defaultContext } from "../../context.js";
import { typescriptFiles } from "../../globs.js";
import { typescriptParser } from "./parser.js";
import {
  compilerCheckedRules,
  replacementRules,
  typeAwareReplacementRules,
} from "./replacements.js";
import { typescriptTypeAwareRules } from "./rules-type-aware.js";
import { typescriptRules } from "./rules.js";
import { disableConfigRules } from "../../utilities/all-rules.js";

/**
Builds the flat config for TypeScript files: the typescript-eslint parser, the core rules that
the compiler checks or that extension rules replace, and the typescript-eslint rules. The rules
that need type information are off unless typed linting is on.
*/
async function typescript(
  {
    files = typescriptFiles,
    ignores = [],
    overrides = {},
  }: TypeScriptOptions = {},
  context: Context = defaultContext,
): Promise<Linter.Config[]> {
  const [parserConfig, { configs, plugin }] = await Promise.all([
    typescriptParser({ files, ignores }, context),
    import("typescript-eslint"),
  ]);
  // Off as in typescript-eslint's `disableTypeChecked` config. The plugin's type omits its rules.
  const typeAwareRulesOff = disableConfigRules(
    "@typescript-eslint",
    "rules" in plugin ? plugin.rules : {},
    configs.disableTypeChecked.rules,
  );

  return [
    parserConfig,
    {
      files: [...files],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/typescript/rules",
      rules: {
        ...compilerCheckedRules,
        ...replacementRules,
        ...typescriptRules,
        ...typeAwareRulesOff,
        ...(context.typeAware !== undefined && {
          ...typeAwareReplacementRules,
          ...typescriptTypeAwareRules,
        }),
        ...overrides,
      },
    },
  ];
}

export { typescript };
