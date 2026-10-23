import type { ESLint, Linter } from "eslint";

type ParserDescription = {
  readonly meta?: { readonly name?: string };
  readonly name?: string;
};
type ResolvedConfig = ResolvedConfigData & SerializableConfig;
type ResolvedConfigData = {
  readonly languageOptions?: {
    readonly parser?: ParserDescription;
    readonly parserOptions?: Readonly<Record<string, unknown>> & {
      readonly parser?: ParserDescription;
    };
    readonly sourceType?: string;
  };
  readonly linterOptions?: unknown;
  readonly plugins?: Readonly<Record<string, ResolvedPlugin>>;
  readonly rules?: ResolvedRules;
  readonly settings?: Readonly<Record<string, unknown>>;
};
type ResolvedPlugin = {
  readonly rules?: Readonly<
    Record<
      string,
      {
        readonly meta?: {
          readonly deprecated?: unknown;
          readonly docs?: { readonly requiresTypeChecking?: boolean };
          readonly languages?: readonly string[];
        };
      }
    >
  >;
};
type ResolvedRules = Readonly<
  Record<string, readonly [Linter.Severity, ...unknown[]]>
>;
type SerializableConfig = {
  readonly toJSON: () => {
    readonly language?: string;
    readonly processor?: string;
  };
};

/**
 * Describes only the ESLint output fields these tests inspect. ESLint normalizes rule entries and supplies toJSON; this assertion does not validate plugin metadata or rule-option values.
 * Ignored and unmatched paths remain undefined, and configuration errors still reject.
 */
const getResolvedConfig = async (
  eslint: ESLint,
  filePath: string,
): Promise<ResolvedConfig | undefined> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint returns any; the shared boundary models its resolved fields while keeping rule options unknown.
  return (await eslint.calculateConfigForFile(filePath)) as
    ResolvedConfig | undefined;
};

const getResolvedRules = async (
  eslint: ESLint,
  filePath: string,
): Promise<ResolvedRules | undefined> => {
  const config = await getResolvedConfig(eslint, filePath);
  return config?.rules;
};

export { getResolvedConfig, getResolvedRules };
export type { ResolvedConfig, ResolvedRules };
