import type { ESLint } from "eslint";

import { getResolvedConfig } from "../support/resolved-config.js";

type UnknownRecord = Readonly<Record<string, unknown>>;
const severityLevels = { error: 2, off: 0, warn: 1 } as const;
const compareText = (left: string, right: string): number => {
  if (left < right) {
    return -1;
  }
  return left > right ? 1 : 0;
};

// Serialization also describes arrays as sections; this boundary deliberately accepts them.
const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === "object" && value !== null;
};

const describeGlobals = (globals: unknown): string => {
  if (!isRecord(globals)) {
    return String(globals);
  }
  return Object.entries(globals)
    .toSorted(([left], [right]) => {
      return compareText(left, right);
    })
    .map(([name, value]) => {
      return `${name}:${String(value)}`;
    })
    .join(" ");
};

const describeParser = (parser: unknown): string => {
  if (!isRecord(parser)) {
    return "[Parser unnamed]";
  }
  // Espree exposes its name on the module itself instead of `meta`.
  const name = isRecord(parser.meta) ? parser.meta.name : parser.name;
  return `[Parser ${typeof name === "string" ? name : "unnamed"}]`;
};

const isParser = (value: unknown): boolean => {
  return (
    isRecord(value) &&
    (typeof value.parseForESLint === "function" ||
      typeof value.parse === "function")
  );
};

const stringifyPrimitive = (
  value: unknown,
  rootDirectory: string,
): string | false => {
  if (value === null) {
    return "null";
  }
  if (typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "function") {
    return JSON.stringify("[Function]");
  }
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? String(value)
      : JSON.stringify(`[Number ${String(value)}]`);
  }
  if (typeof value === "string") {
    return JSON.stringify(value.replaceAll(rootDirectory, "<root>"));
  }
  return typeof value === "undefined" ? "null" : false;
};

/**
 * Serializes a config value as stable JSON text, retaining non-JSON values and sorted keys.
 */
const stringify = (
  value: unknown,
  rootDirectory: string,
  key?: string,
): string => {
  if (key === "globals" && isRecord(value) && !Array.isArray(value)) {
    return JSON.stringify(describeGlobals(value));
  }
  const primitive = stringifyPrimitive(value, rootDirectory);
  if (typeof primitive === "string") {
    return primitive;
  }
  if (value instanceof RegExp) {
    return JSON.stringify(`[RegExp ${String(value)}]`);
  }
  if (Array.isArray(value)) {
    return `[${value
      .map((item) => {
        return stringify(item, rootDirectory);
      })
      .join(",")}]`;
  }
  if (!isRecord(value)) {
    return JSON.stringify(`[${typeof value}]`);
  }
  if (isParser(value)) {
    return JSON.stringify(describeParser(value));
  }
  const properties = Object.entries(value)
    .filter(([, item]): boolean => {
      return typeof item !== "undefined";
    })
    .toSorted(([left], [right]) => {
      return compareText(left, right);
    })
    .map(([name, item]) => {
      return `${JSON.stringify(name)}:${stringify(item, rootDirectory, name)}`;
    });
  return `{${properties.join(",")}}`;
};

const describeRule = (
  ruleId: string,
  entry: readonly unknown[],
  rootDirectory: string,
): string => {
  const [level, ...options] = entry;
  const severity = Object.entries(severityLevels).find(([, candidate]) => {
    return candidate === level;
  })?.[0];
  const description = `${ruleId}: ${severity ?? String(level)}`;
  return options.length === 0
    ? description
    : `${description} ${stringify(options, rootDirectory)}`;
};

const describeSection = (
  title: string,
  value: unknown,
  rootDirectory: string,
): readonly string[] => {
  if (!isRecord(value)) {
    return [`${title}: ${stringify(value, rootDirectory)}`];
  }
  return [
    `${title}:`,
    ...Object.entries(value)
      .toSorted(([left], [right]) => {
        return compareText(left, right);
      })
      .map(([key, item]) => {
        return `  ${key}: ${stringify(item, rootDirectory, key)}`;
      }),
  ];
};

/**
 * Describes the configuration ESLint resolves for `filePath` as reviewable text:
 * one line per rule with its severity and options, preceded by the language settings that decide how the file is parsed.
 */
const describeEffectiveConfig = async (
  eslint: ESLint,
  filePath: string,
  rootDirectory: string,
): Promise<string> => {
  const isIgnored = await eslint.isPathIgnored(filePath);

  const config = await getResolvedConfig(eslint, filePath);
  const header = [`path: ${filePath}`, `ignored: ${String(isIgnored)}`];
  if (typeof config === "undefined") {
    return [...header, "config: none", ""].join("\n");
  }
  const { language, processor } = config.toJSON();
  const rules = Object.entries(config.rules ?? {}).toSorted(
    ([left], [right]) => {
      return compareText(left, right);
    },
  );
  const severityCounts = Object.entries(severityLevels).map(([name, level]) => {
    return `${name} ${String(
      rules.filter(([, entry]) => {
        return entry[0] === level;
      }).length,
    )}`;
  });
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
    ...rules.map(([ruleId, entry]) => {
      return describeRule(ruleId, entry, rootDirectory);
    }),
    "",
  ].join("\n");
};

export { describeEffectiveConfig };
