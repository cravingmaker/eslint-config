import { isDeepStrictEqual } from "node:util";

/**
A change between two descriptions: a setting, by its name, or a rule, by its ID. A side
without a value has no such setting or rule.
*/
type Change = RuleChange | SettingChange;
/**
A snapshot that the current scenarios describe: its text, or why it could not be calculated.
With `ruleIdPrefix`, the snapshot keeps only the rules whose ID starts with it.
*/
type CurrentSnapshot = {
  readonly description:
    | {
        readonly error: string;
      }
    | {
        readonly text: string;
      };
  readonly filePath: string;
  readonly path: string;
  readonly scenario: string;

  readonly ruleIdPrefix?: string;
};
/**
A description of the configuration that ESLint resolves for a file, as
`describeEffectiveConfig` writes it: the settings in their order, sections flattened to
`section.key`, and the entry of each rule. A file without a configuration has no rules.
*/
type Description = {
  readonly settings: ReadonlyMap<string, string>;

  readonly rules?: ReadonlyMap<string, RuleEntry>;
};
type RuleChange = {
  readonly kind: "rule";
  readonly name: string;

  readonly after?: RuleEntry;
  readonly before?: RuleEntry;
};
/**
The severity of a rule and its options as JSON text, empty without options.
*/
type RuleEntry = {
  readonly options: string;
  readonly severity: string;
};
type SettingChange = {
  readonly kind: "setting";
  readonly name: string;

  readonly after?: string;
  readonly before?: string;
};
/**
The comparison of one snapshot with the baseline. A new snapshot has no baseline, and a
removed one has no current scenario.
*/
type SnapshotResult = {
  readonly label: string;
  readonly outcome:
    | {
        readonly changes: readonly Change[];
        readonly status: "changed";
      }
    | {
        readonly reason: string;
        readonly status: "failed";
      }
    | {
        readonly status: "new";
      }
    | {
        readonly status: "removed";
      }
    | {
        readonly status: "unchanged";
      };
  readonly path: string;
};
const settingPattern = /^(?<key>\w+): (?<value>.*)$/u;
const sectionPattern = /^(?<key>\w+):$/u;
const nestedSettingPattern = /^ {2}(?<key>\S+): (?<value>.*)$/u;
// A rule ID and its entry: the severity, then the options, when there are any, after a space.
const rulePattern = /^(?<ruleId>\S+): (?<entry>\S.*)$/u;
const ruleCountPattern =
  /^(?<total>\d+) \(error (?<error>\d+), off (?<off>\d+), warn (?<warn>\d+)\)$/u;
const identifierPattern = /^[$A-Z_a-z][\w$]*$/u;
const compareText = (left: string, right: string): number => {
  if (left < right) {
    return -1;
  }
  return left > right ? 1 : 0;
};
const countSeverity = (
  rules: ReadonlyMap<string, RuleEntry>,
  severity: string,
): string => {
  return String(
    rules
      .values()
      .filter((entry) => {
        return entry.severity === severity;
      })
      .toArray().length,
  );
};
const formatJsonPath = (path: string, key: number | string): string => {
  if (typeof key === "number") {
    return `${path}[${String(key)}]`;
  }
  return identifierPattern.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`;
};
const formatRule = (
  ruleId: string,
  { options, severity }: RuleEntry,
): string => {
  return options === ""
    ? `${ruleId}: ${severity}`
    : `${ruleId}: ${severity} ${options}`;
};
const isJson = (text: string): boolean => {
  try {
    return typeof JSON.parse(text) !== "undefined";
  } catch {
    return false;
  }
};
const isJsonList = (text: string): boolean => {
  try {
    return Array.isArray(JSON.parse(text));
  } catch {
    return false;
  }
};
const isRecord = (
  value: unknown,
): value is Readonly<Record<string, unknown>> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};
/**
Lists the words of a space-separated list that one side has and the other does not, as `+word`
and `-word`, in the order of each list.
*/
const listWordChanges = (before: string, after: string): readonly string[] => {
  const previous = new Set(
    before.split(" ").filter((word) => {
      return word !== "";
    }),
  );
  const next = new Set(
    after.split(" ").filter((word) => {
      return word !== "";
    }),
  );
  const added = next.difference(previous);
  const removed = previous.difference(next);
  return [
    ...added.values().map((word) => {
      return `+${word}`;
    }),
    ...removed.values().map((word) => {
      return `-${word}`;
    }),
  ];
};
/**
Fails on a description that `describeEffectiveConfig` cannot have written, such as a truncated
file.
*/
const malformed = (reason: string): never => {
  // eslint-disable-next-line functional/no-throw-statements -- A description that cannot be read must not compare as unchanged.
  throw new Error(`Not a description of an effective configuration: ${reason}`);
};
/**
Reads rule lines. `lineOffset` is the number of lines before them in the file, for messages.
*/
const parseRules = (
  lines: readonly string[],
  lineOffset: number,
): ReadonlyMap<string, RuleEntry> => {
  const entries = lines.map((line, index): readonly [string, RuleEntry] => {
    const rule = rulePattern.exec(line)?.groups;
    if (typeof rule === "undefined") {
      return malformed(
        `line ${String(lineOffset + index + 1)} is not a rule: ${line}`,
      );
    }
    const space = rule.entry.indexOf(" ");
    const severity = space === -1 ? rule.entry : rule.entry.slice(0, space);
    const options = space === -1 ? "" : rule.entry.slice(space + 1);
    return options === "" || isJsonList(options)
      ? [rule.ruleId, { options, severity }]
      : malformed(`the options of ${rule.ruleId} are not a JSON list`);
  });
  const rules = new Map(entries);
  return rules.size === entries.length
    ? rules
    : malformed("a rule is listed more than once");
};
/**
Reads the settings before the rules: `key: value` lines, and sections whose `  key: value`
lines become `section.key`, with a JSON value.
*/
const parseSettings = (
  lines: readonly string[],
): ReadonlyMap<string, string> => {
  return new Map(
    lines.flatMap((line, index): ReadonlyArray<readonly [string, string]> => {
      const setting = settingPattern.exec(line)?.groups;
      if (typeof setting !== "undefined") {
        return [[setting.key, setting.value]];
      }
      if (sectionPattern.test(line)) {
        return [];
      }
      const nested = nestedSettingPattern.exec(line)?.groups;
      const sectionLine = lines.slice(0, index).findLast((previous) => {
        return !previous.startsWith("  ");
      });
      const section = sectionPattern.exec(sectionLine ?? "")?.groups;
      if (typeof nested === "undefined" || typeof section === "undefined") {
        return malformed(`line ${String(index + 1)} is not a setting: ${line}`);
      }
      const name = `${section.key}.${nested.key}`;
      return isJson(nested.value)
        ? [[name, nested.value]]
        : malformed(`the value of ${name} is not JSON`);
    }),
  );
};
/**
Reads a description that `describeEffectiveConfig` wrote. With `ruleIdPrefix`, the description
holds only the lines of the rules whose ID starts with it, as a snapshot that keeps the rules of
one plugin does.
*/
const parsePrefixedDescription = (
  lines: readonly string[],
  prefix: string,
): Description => {
  const rules = parseRules(lines, 0);
  const otherRule = rules.keys().find((ruleId) => {
    return !ruleId.startsWith(prefix);
  });
  return typeof otherRule === "undefined"
    ? { rules, settings: new Map() }
    : malformed(`${otherRule} does not start with ${prefix}`);
};
const isDescriptionHeader = (
  lines: readonly string[],
  settings: ReadonlyMap<string, string>,
): boolean => {
  return /^path: ./u.test(lines.at(0) ?? "") && settings.has("ignored");
};
const parseConfigDescription = (lines: readonly string[]): Description => {
  const separator = lines.indexOf("");
  const settings = parseSettings(
    separator === -1 ? lines : lines.slice(0, separator),
  );
  if (!isDescriptionHeader(lines, settings)) {
    return malformed(
      "it does not start with the path and whether it is ignored",
    );
  }
  if (settings.get("config") === "none") {
    return separator === -1
      ? { settings }
      : malformed("a file without a configuration has rules");
  }
  const ruleCount = ruleCountPattern.exec(settings.get("rules") ?? "")?.groups;
  if (separator === -1 || typeof ruleCount === "undefined") {
    return malformed("it has neither rules nor `config: none`");
  }
  const rules = parseRules(lines.slice(separator + 1), separator + 1);
  const actualCount = {
    error: countSeverity(rules, "error"),
    off: countSeverity(rules, "off"),
    total: String(rules.size),
    warn: countSeverity(rules, "warn"),
  };
  return isDeepStrictEqual({ ...ruleCount }, actualCount)
    ? { rules, settings }
    : malformed(
        `it counts ${String(settings.get("rules"))}, but lists ${actualCount.total} rules`,
      );
};
const parseDescription = (text: string, ruleIdPrefix?: string): Description => {
  if (!text.endsWith("\n")) {
    return malformed("it does not end with a line break");
  }
  const lines = text.slice(0, -1).split("\n");
  if (typeof ruleIdPrefix === "string") {
    return parsePrefixedDescription(text === "\n" ? [] : lines, ruleIdPrefix);
  }
  return parseConfigDescription(lines);
};
/**
The keys of two maps, those of `left` first, each in the order of its map.
*/
const unionOfKeys = (
  left: ReadonlyMap<string, unknown>,
  right: ReadonlyMap<string, unknown>,
): readonly string[] => {
  const keys = new Set(left.keys());
  return keys.union(new Set(right.keys())).values().toArray();
};
/**
Lists the settings and rules that differ between two descriptions, settings first in the order
of the descriptions, then rules by ID. Rules are compared only when both files have a
configuration; otherwise the `rules` setting shows the change.
*/
const compareDescriptions = (
  before: Description,
  after: Description,
): readonly Change[] => {
  const settingChanges = unionOfKeys(before.settings, after.settings).flatMap(
    (name): readonly Change[] => {
      const previous = before.settings.get(name);
      const next = after.settings.get(name);
      return previous === next
        ? []
        : [{ after: next, before: previous, kind: "setting", name }];
    },
  );
  if (
    typeof before.rules === "undefined" ||
    typeof after.rules === "undefined"
  ) {
    return settingChanges;
  }
  const previousRules = before.rules;
  const nextRules = after.rules;
  const ruleChanges = unionOfKeys(previousRules, nextRules)
    .toSorted(compareText)
    .flatMap((ruleId): readonly Change[] => {
      const previous = previousRules.get(ruleId);
      const next = nextRules.get(ruleId);
      return isDeepStrictEqual(previous, next)
        ? []
        : [{ after: next, before: previous, kind: "rule", name: ruleId }];
    });
  return [...settingChanges, ...ruleChanges];
};
const compareSnapshot = (
  baseline: ReadonlyMap<string, string>,
  { description, filePath, path, ruleIdPrefix, scenario }: CurrentSnapshot,
): SnapshotResult => {
  const label = `${scenario}: ${filePath}`;
  const baselineText = baseline.get(path);
  if ("error" in description) {
    return {
      label,
      outcome: { reason: description.error, status: "failed" },
      path,
    };
  }
  if (typeof baselineText === "undefined") {
    return { label, outcome: { status: "new" }, path };
  }
  try {
    const changes = compareDescriptions(
      parseDescription(baselineText, ruleIdPrefix),
      parseDescription(description.text, ruleIdPrefix),
    );
    return {
      label,
      outcome:
        changes.length === 0
          ? { status: "unchanged" }
          : { changes, status: "changed" },
      path,
    };
  } catch (error) {
    return {
      label,
      outcome: {
        reason: Error.isError(error) ? error.message : String(error),
        status: "failed",
      },
      path,
    };
  }
};
/**
Compares each current snapshot with the baseline snapshot at the same path, and adds the
baseline snapshots that no scenario describes any more, by path. A snapshot that cannot be
described or read fails, and is never reported as unchanged.
*/
const compareSnapshots = (
  baseline: ReadonlyMap<string, string>,
  current: readonly CurrentSnapshot[],
): readonly SnapshotResult[] => {
  const currentPaths = new Set(
    current.map(({ path }) => {
      return path;
    }),
  );
  const removed = baseline
    .keys()
    .filter((path) => {
      return !currentPaths.has(path);
    })
    .toArray()
    .toSorted(compareText)
    .map((path): SnapshotResult => {
      return {
        label: path,
        outcome: { status: "removed" },
        path,
      };
    });
  return [
    ...current.map((snapshot) => {
      return compareSnapshot(baseline, snapshot);
    }),
    ...removed,
  ];
};
/**
Lists the differences between two JSON values by path: the keys of objects, and the items of
arrays of the same length. Any other difference shows both values.
*/
const listJsonChanges = (
  path: string,
  before: unknown,
  after: unknown,
): readonly string[] => {
  if (isDeepStrictEqual(before, after)) {
    return [];
  }
  if (isRecord(before) && isRecord(after)) {
    const previous = new Map(Object.entries(before));
    const next = new Map(Object.entries(after));
    return unionOfKeys(previous, next)
      .toSorted(compareText)
      .flatMap((key) => {
        const keyPath = formatJsonPath(path, key);
        if (!next.has(key)) {
          return [`- ${keyPath}: ${JSON.stringify(previous.get(key))}`];
        }
        if (!previous.has(key)) {
          return [`+ ${keyPath}: ${JSON.stringify(next.get(key))}`];
        }
        return listJsonChanges(keyPath, previous.get(key), next.get(key));
      });
  }
  if (
    Array.isArray(before) &&
    Array.isArray(after) &&
    before.length === after.length
  ) {
    return before.flatMap((item: unknown, index) => {
      return listJsonChanges(
        formatJsonPath(path, index),
        item,
        after.at(index),
      );
    });
  }
  return [`~ ${path}: ${JSON.stringify(before)} → ${JSON.stringify(after)}`];
};
const formatRuleChange = ({
  after,
  before,
  name,
}: RuleChange): readonly string[] => {
  if (typeof before === "undefined") {
    return typeof after === "undefined" ? [] : [`+ ${formatRule(name, after)}`];
  }
  if (typeof after === "undefined") {
    return [`- ${formatRule(name, before)}`];
  }
  const severity =
    before.severity === after.severity
      ? after.severity
      : `${before.severity} → ${after.severity}`;
  // Both descriptions were read, so their options are JSON.
  const options = listJsonChanges(
    "options",
    JSON.parse(before.options === "" ? "[]" : before.options),
    JSON.parse(after.options === "" ? "[]" : after.options),
  );
  return [
    `~ ${name}: ${severity}`,
    ...options.map((line) => {
      return `    ${line}`;
    }),
  ];
};
const formatSettingChange = ({
  after,
  before,
  name,
}: SettingChange): readonly string[] => {
  if (typeof before === "undefined") {
    return typeof after === "undefined" ? [] : [`+ ${name}: ${after}`];
  }
  if (typeof after === "undefined") {
    return [`- ${name}: ${before}`];
  }
  if (name === "plugins") {
    return [`~ plugins: ${listWordChanges(before, after).join(" ")}`];
  }
  // The settings of a section were read as JSON.
  if (name === "languageOptions.globals") {
    const words = listWordChanges(
      String(JSON.parse(before)),
      String(JSON.parse(after)),
    );
    return [`~ ${name}: ${words.join(" ")}`];
  }
  return name.includes(".")
    ? listJsonChanges(name, JSON.parse(before), JSON.parse(after))
    : [`~ ${name}: ${before} → ${after}`];
};
/**
Formats the changes of one snapshot, one line each, marked `+` for added, `-` for removed, and
`~` for changed. A changed rule lists its changed options below it, by path.
*/
const formatChanges = (changes: readonly Change[]): readonly string[] => {
  return changes.flatMap((change) => {
    return change.kind === "rule"
      ? formatRuleChange(change)
      : formatSettingChange(change);
  });
};
export type { CurrentSnapshot, SnapshotResult };
export {
  compareDescriptions,
  compareSnapshots,
  compareText,
  formatChanges,
  isRecord,
  parseDescription,
  unionOfKeys,
};
