import type { Linter } from "eslint";
import type { Rules } from "../types.js";

type UnknownRecord = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}
// Older optional peers can lack a rule or an option that the current policy declares.
// Only the declared policy is considered: upstream additions never become settings.
function supportedPluginPolicy(
  pluginName: string,
  policy: Readonly<Rules>,
  pluginRules: unknown,
): Rules {
  const available = new Map(
    isRecord(pluginRules) ? Object.entries(pluginRules) : [],
  );
  return Object.fromEntries(
    Object.entries(policy)
      .filter(([id]) => available.has(id.slice(pluginName.length + 1)))
      .map(([id, entry]) => [
        id,
        supportedRuleOptions(
          entry,
          available.get(id.slice(pluginName.length + 1)),
        ),
      ]),
  );
}
function supportedRuleOptions(
  entry: Readonly<Linter.RuleEntry> | undefined,
  rule: unknown,
): Linter.RuleEntry | undefined {
  if (!isUnknownArray(entry)) return entry;
  const schema =
    isRecord(rule) && isRecord(rule.meta) && isUnknownArray(rule.meta.schema)
      ? rule.meta.schema
      : undefined;
  const entries: readonly unknown[] =
    schema === undefined ? entry : entry.slice(0, schema.length + 1);
  // eslint-disable-next-line @typescript-eslint/promise-function-async -- Rule option values are opaque synchronous configuration data.
  const values = entries.map((value, index): unknown => {
    const optionSchema = schema?.at(index - 1);
    if (
      index === 0 ||
      !isRecord(value) ||
      !isRecord(optionSchema) ||
      optionSchema.additionalProperties !== false ||
      !isRecord(optionSchema.properties)
    )
      return value;
    const { properties } = optionSchema;
    return Object.fromEntries(
      Object.entries(value).filter(([key]) => Object.hasOwn(properties, key)),
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Filtering option properties preserves the declared severity and tuple positions.
  return values as Linter.RuleEntry;
}

export { supportedPluginPolicy, supportedRuleOptions };
