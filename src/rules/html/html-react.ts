import type { RuleOptionOf, Rules } from "../../types.js";

import eslintPluginHtmlReact from "@html-eslint/eslint-plugin-react";

import { getPluginRules } from "../../utilities/plugin-rules.js";

const classNameOptions = {
  callees: ["classnames", "clsx", "cn", "cva", "tw", "twMerge"],
} satisfies RuleOptionOf<"@html-eslint/react/classname-spacing">;

const htmlReactEslintRules: Rules = {
  ...getPluginRules("@html-eslint/react", eslintPluginHtmlReact.rules ?? {}),

  "@html-eslint/react/classname-spacing": ["error", { ...classNameOptions }],
  "@html-eslint/react/no-duplicate-classname": [
    "error",
    { ...classNameOptions },
  ],
} as const;

export { htmlReactEslintRules };
