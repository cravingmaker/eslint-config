import type { ESLint } from "eslint";

type EffectiveConfig = {
  readonly languageOptions?: unknown;
  readonly linterOptions?: unknown;
  readonly plugins?: UnknownRecord;
  readonly rules?: Readonly<Record<string, readonly unknown[]>>;
  readonly settings?: unknown;
};
type SerializableConfig = {
  readonly toJSON: () => {
    readonly language?: unknown;
    readonly processor?: unknown;
  };
};
type UnknownRecord = Readonly<Record<string, unknown>>;

const severityLevels = { error: 2, off: 0, warn: 1 } as const;

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  return left > right ? 1 : 0;
}
/**
Describes the configuration ESLint resolves for `filePath` as reviewable text:
one line per rule with its severity and options, preceded by the language
settings that decide how the file is parsed.
*/
async function describeEffectiveConfig(
  eslint: ESLint,
  filePath: string,
  rootDirectory: string,
): Promise<string> {
  const isIgnored = await eslint.isPathIgnored(filePath);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ESLint types the calculated config as `any`.
  const config = (await eslint.calculateConfigForFile(filePath)) as
    (EffectiveConfig & SerializableConfig) | undefined;
  const header = [`path: ${filePath}`, `ignored: ${String(isIgnored)}`];
  if (config === undefined) return [...header, "config: none", ""].join("\n");

  const { language, processor } = config.toJSON();
  const rules = Object.entries(config.rules ?? {}).toSorted(([left], [right]) =>
    compareText(left, right),
  );
  const severityCounts = Object.entries(severityLevels).map(
    ([name, level]) =>
      `${name} ${String(rules.filter(([, entry]) => entry[0] === level).length)}`,
  );

  return [
    ...header,
    `language: ${typeof language === "string" ? language : "none"}`,
    `processor: ${typeof processor === "string" ? processor : "none"}`,
    `plugins: ${Object.keys(config.plugins ?? {})
      .toSorted(compareText)
      .join(" ")}`,
    ...describeSection(
      "languageOptions",
      config.languageOptions,
      rootDirectory,
    ),
    ...describeSection("linterOptions", config.linterOptions, rootDirectory),
    ...describeSection("settings", config.settings, rootDirectory),
    `rules: ${String(rules.length)} (${severityCounts.join(", ")})`,
    "",
    ...rules.map(([ruleId, entry]) =>
      describeRule(ruleId, entry, rootDirectory),
    ),
    "",
  ].join("\n");
}
function describeGlobals(globals: unknown): string {
  if (!isRecord(globals)) return String(globals);
  return Object.entries(globals)
    .toSorted(([left], [right]) => compareText(left, right))
    .map(([name, value]) => `${name}:${String(value)}`)
    .join(" ");
}
function describeParser(parser: unknown): string {
  const meta = isRecord(parser) ? parser.meta : undefined;
  const name = isRecord(meta) ? meta.name : undefined;
  return `[Parser ${typeof name === "string" ? name : "unnamed"}]`;
}
function describeRule(
  ruleId: string,
  entry: readonly unknown[],
  rootDirectory: string,
): string {
  const [level, ...options] = entry;
  const severity = Object.entries(severityLevels).find(
    ([, candidate]) => candidate === level,
  )?.[0];
  const description = `${ruleId}: ${severity ?? String(level)}`;
  if (options.length === 0) return description;
  return `${description} ${stringify(options, rootDirectory)}`;
}
function describeSection(
  title: string,
  value: unknown,
  rootDirectory: string,
): readonly string[] {
  if (!isRecord(value)) return [`${title}: ${stringify(value, rootDirectory)}`];
  return [
    `${title}:`,
    ...Object.entries(value)
      .toSorted(([left], [right]) => compareText(left, right))
      .map(
        ([key, item]) =>
          `  ${key}: ${stringifyProperty(key, item, rootDirectory)}`,
      ),
  ];
}
function isParser(value: unknown): boolean {
  return (
    isRecord(value) &&
    (typeof value.parseForESLint === "function" ||
      typeof value.parse === "function")
  );
}
function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}
/**
Serializes a config value as stable JSON text. `JSON.stringify` alone would
silently turn `Infinity` into `null` and regular expressions into `{}`, and it
would keep the property order of the source instead of a sorted one.
*/
function stringify(value: unknown, rootDirectory: string): string {
  if (value === undefined || value === null) return "null";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number")
    return Number.isFinite(value)
      ? String(value)
      : JSON.stringify(`[Number ${String(value)}]`);
  if (typeof value === "string")
    return JSON.stringify(value.replaceAll(rootDirectory, "<root>"));
  if (typeof value === "function") return JSON.stringify("[Function]");
  if (value instanceof RegExp)
    return JSON.stringify(`[RegExp ${String(value)}]`);
  if (Array.isArray(value))
    return `[${value.map((item) => stringify(item, rootDirectory)).join(",")}]`;
  if (!isRecord(value)) return JSON.stringify(`[${typeof value}]`);
  if (isParser(value)) return JSON.stringify(describeParser(value));

  const properties = Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .toSorted(([left], [right]) => compareText(left, right))
    .map(
      ([key, item]) =>
        `${JSON.stringify(key)}:${stringifyProperty(key, item, rootDirectory)}`,
    );
  return `{${properties.join(",")}}`;
}
function stringifyProperty(
  key: string,
  value: unknown,
  rootDirectory: string,
): string {
  return key === "globals" && isRecord(value)
    ? JSON.stringify(describeGlobals(value))
    : stringify(value, rootDirectory);
}

export { describeEffectiveConfig };
