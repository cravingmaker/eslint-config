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
import { typeAwareConfig } from "../../utilities/type-aware.js";

/**
Builds the flat config for TypeScript files: the typescript-eslint parser, the core rules that
the compiler checks or that extension rules replace, and the typescript-eslint rules. The rules
that need type information are off. With typed linting on, the parser reads type information in
the type-aware scope, and those rules are on there in a separate block.
*/
async function typescript(
  options: TypeScriptOptions = {},
  context: Context = defaultContext,
): Promise<Linter.Config[]> {
  const {
    files = typescriptFiles,
    ignores = [],
    overrides = {},
    overridesTypeAware = {},
  } = options;
  const [parserConfigs, { configs, plugin }] = await Promise.all([
    typescriptParser(options, context),
    import("typescript-eslint"),
  ]);
  // Off as in typescript-eslint's `disableTypeChecked` config. The plugin's type omits its rules.
  const typeAwareRulesOff = disableConfigRules(
    "@typescript-eslint",
    "rules" in plugin ? plugin.rules : {},
    configs.disableTypeChecked.rules,
  );

  return [
    ...parserConfigs,
    {
      files: [...files],
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/typescript/rules",
      rules: {
        ...compilerCheckedRules,
        ...replacementRules,
        ...typescriptRules,
        ...typeAwareRulesOff,
        ...overrides,
      },
    },
    ...(context.typeAware === undefined
      ? []
      : [
          typeAwareConfig("typescript", context.typeAware, options, {
            ...typeAwareReplacementRules,
            ...typescriptTypeAwareRules,
            ...overrides,
            ...overridesTypeAware,
          }),
        ]),
  ];
}

export { typescript };
