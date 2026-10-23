import type { ESLint } from "eslint";

import { getResolvedConfig } from "./resolved-config.js";

// The language, the plugin names, and the severity of `ruleId` that ESLint resolves for a file.
const describeFile = async (
  eslint: ESLint,
  filePath: string,
  ruleId: string,
): Promise<unknown> => {
  const config = await getResolvedConfig(eslint, filePath);
  const rules = new Map(Object.entries(config?.rules ?? {}));
  return {
    language: config?.toJSON().language,
    plugins: Object.keys(config?.plugins ?? {}).toSorted((left, right) => {
      return left.localeCompare(right);
    }),
    severity: rules.get(ruleId)?.[0],
  };
};

export { describeFile };
