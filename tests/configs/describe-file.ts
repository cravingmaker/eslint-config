import type { ESLint } from "eslint";

type EffectiveConfig = {
  readonly language?: string;
  readonly plugins?: Readonly<Record<string, unknown>>;
  readonly rules?: Readonly<Record<string, readonly unknown[]>>;
};
type SerializableConfig = {
  readonly toJSON: () => { readonly language?: unknown };
};

// The language, the plugin names, and the severity of `ruleId` that ESLint resolves for a file.
async function describeFile(
  eslint: ESLint,
  filePath: string,
  ruleId: string,
): Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    (EffectiveConfig & SerializableConfig) | undefined;
  const rules = new Map(Object.entries(config?.rules ?? {}));
  return {
    language: config?.toJSON().language,
    plugins: Object.keys(config?.plugins ?? {}).toSorted((left, right) =>
      left.localeCompare(right),
    ),
    severity: rules.get(ruleId)?.[0],
  };
}

export { describeFile };
