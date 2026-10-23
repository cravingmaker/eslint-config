import type { Linter } from "eslint";

import process from "node:process";

import { ESLint } from "eslint";
import { builtinRules } from "eslint/use-at-your-own-risk";
import { describe, expect, it } from "vitest";

import { createConfig } from "../../dist/index.mjs";
import { replacementRules } from "../../src/configs/plugins/typescript/replacements.js";
import { isRecord } from "../../src/utilities/is-record.js";
import { getResolvedConfig } from "../support/resolved-config.js";

type UnknownRecord = Readonly<Record<string, unknown>>;
const rootDirectory = process.cwd();
const filePaths = [
  "data.json",
  "data.json5",
  "data.jsonc",
  "index.html",
  "package.json",
  "README.md",
  "src/Component.svelte",
  "src/example.js",
  "src/example.jsx",
  "src/example.ts",
  "src/example.tsx",
  "src/state.svelte.ts",
] as const;
const isObjectOptionExplicit = (
  schema: UnknownRecord,
  value: UnknownRecord,
): boolean => {
  const properties = isRecord(schema.properties) ? schema.properties : {};
  return (
    (schema.additionalProperties !== false ||
      Object.keys(value).every((key) => {
        return Object.hasOwn(properties, key);
      })) &&
    Object.keys(properties).every((key) => {
      const hasMaximumAlias = key === "maximum" && Object.hasOwn(value, "max");
      const hasThisAlias =
        key === "countVoidThis" && Object.hasOwn(value, "countThis");
      return hasMaximumAlias || hasThisAlias || Object.hasOwn(value, key);
    })
  );
};

const isUnknownArray = (value: unknown): value is readonly unknown[] => {
  return Array.isArray(value);
};

const isMatchingScalarShape = (
  schema: UnknownRecord,
  value: unknown,
): boolean => {
  if (isUnknownArray(schema.enum) && !schema.enum.includes(value)) {
    return false;
  }
  if (schema.const !== value && Object.hasOwn(schema, "const")) {
    return false;
  }
  if (schema.type === "object" && !isRecord(value)) {
    return false;
  }
  if (typeof value !== "string" && schema.type === "string") {
    return false;
  }
  return true;
};

// This selects an option form; ESLint performs the full schema validation below.
const isMatchingOptionShape = (schema: unknown, value: unknown): boolean => {
  if (typeof value === "undefined" || !isRecord(schema)) {
    return true;
  }
  if (!isMatchingScalarShape(schema, value)) {
    return false;
  }
  return (
    !isRecord(value) ||
    !isRecord(schema.properties) ||
    Object.keys(value).every((key) => {
      return Object.hasOwn(schema.properties ?? {}, key);
    })
  );
};

const objectSchemas = (schema: unknown): readonly UnknownRecord[] => {
  if (!isRecord(schema)) {
    return [];
  }
  const alternatives = schema.oneOf ?? schema.anyOf;
  if (isUnknownArray(alternatives)) {
    return alternatives.flatMap((alternative: unknown = false) => {
      return objectSchemas(alternative);
    });
  }
  return schema.type === "object" || isRecord(schema.properties)
    ? [schema]
    : [];
};

const isOptionExplicit = (
  schema: unknown,
  options: readonly unknown[],
  index: number,
): boolean => {
  const objects = objectSchemas(schema);
  const value: unknown = options.at(index);
  return (
    Object.hasOwn(options, index) &&
    (!isRecord(value) ||
      objects.length === 0 ||
      objects.some((object) => {
        return isObjectOptionExplicit(object, value);
      }))
  );
};

const optionSchemas = (schema: unknown): ReadonlyArray<readonly unknown[]> => {
  if (isUnknownArray(schema)) {
    return [schema];
  }
  if (!isRecord(schema)) {
    return [[]];
  }
  const alternatives = schema.oneOf ?? schema.anyOf;
  if (isUnknownArray(alternatives)) {
    return alternatives.flatMap((alternative: unknown = false) => {
      return optionSchemas(alternative);
    });
  }
  if (isUnknownArray(schema.items)) {
    return [schema.items];
  }
  // Variadic lists hold user-selected matches or sorting configurations. They
  // can deliberately have no entries, such as require-attrs and no-restricted-syntax.
  return [[]];
};

// The second SonarJS option is the internal "silence-issues" mode, which suppresses
// diagnostics. The numeric threshold alone is the public reporting option form.
const hasCognitiveComplexityReportingOptions = (
  id: string,
  candidates: ReadonlyArray<readonly unknown[]>,
): boolean => {
  return (
    id === "sonarjs/cognitive-complexity" &&
    candidates.every((options) => {
      return options.length === 1 && typeof options[0] === "number";
    })
  );
};

const missingOptions = (
  id: string,
  rule: unknown,
  declarations: ReadonlyArray<readonly [string, unknown]>,
): readonly string[] => {
  if (!isRecord(rule) || !isRecord(rule.meta)) {
    return [];
  }
  const candidates = declarations
    .filter(([ruleId, entry]) => {
      const severity = isUnknownArray(entry) ? entry[0] : entry;
      return ruleId === id && severity !== "off" && severity !== 0;
    })
    .map(([, value]) => {
      return isUnknownArray(value) ? value.slice(1) : [];
    });
  if (candidates.length === 0) {
    return [];
  }
  // The core reference deliberately selects these rules' default option forms.
  if (
    ["curly", "radix"].includes(id) &&
    candidates.some((options) => {
      return options.length === 0;
    })
  ) {
    return [];
  }
  // Its schema requires an active export check whenever options are supplied.
  if (id === "import-x/no-unused-modules") {
    return [];
  }
  if (hasCognitiveComplexityReportingOptions(id, candidates)) {
    return [];
  }
  const schemas = optionSchemas(rule.meta.schema);
  const missing = candidates.flatMap((options) => {
    return schemas
      .filter((form) => {
        return (
          form.length === 0 ||
          options.every((value, index) => {
            return (
              index < form.length &&
              isMatchingOptionShape(form.at(index), value)
            );
          })
        );
      })
      .map((form) => {
        return form.flatMap((schema, index) => {
          return isOptionExplicit(schema, options, index)
            ? []
            : `${id} option ${String(index + 1)}`;
        });
      });
  });
  return missing.some((entries) => {
    return entries.length === 0;
  })
    ? []
    : (missing.at(0) ?? [`${id} option form`]);
};

describe("explicit rule options", () => {
  it("omits the redundant TypeScript parameter alias before compatibility filtering", () => {
    const entry = replacementRules["@typescript-eslint/max-params"];
    expect(entry).toEqual(["warn", { countVoidThis: false, max: 4 }]);
    expect(Array.isArray(entry) ? entry[1] : undefined).not.toHaveProperty(
      "maximum",
    );
  });

  it("declares enabled rules' canonical options or explicitly leaves them unset", async () => {
    const config = await createConfig({
      express: true,
      react: { refresh: "generic" },
      svelte: true,
      typescript: { tsconfigRootDir: rootDirectory, typeChecked: true },
    });
    const plugins = new Map(
      config.flatMap((entry) => {
        return Object.entries(entry.plugins ?? {});
      }),
    );
    const definitions = [
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- Audit the installed core rule schemas as well as plugins.
      [...builtinRules],
      [...plugins].flatMap(([prefix, plugin]) => {
        return Object.entries(plugin.rules ?? {}).map(
          ([name, rule]): readonly [string, unknown] => {
            return [`${prefix}/${name}`, rule];
          },
        );
      }),
    ].flat();
    const declarations = config.flatMap((entry) => {
      return Object.entries(entry.rules ?? {});
    });
    const missing = definitions.flatMap(([id, rule]) => {
      return missingOptions(id, rule, declarations);
    });
    expect(
      missing.toSorted((left, right) => {
        return left.localeCompare(right);
      }),
    ).toEqual([]);
  });
  it.each([{ entry: "off" }, { entry: 0 }, { entry: ["off"] }, { entry: [0] }])(
    "does not require options for disabled entry $entry",
    ({ entry }) => {
      expect(
        missingOptions(
          "example",
          {
            meta: {
              schema: [
                {
                  additionalProperties: false,
                  properties: { enabled: { type: "boolean" } },
                  type: "object",
                },
              ],
            },
          },
          [["example", entry]],
        ),
      ).toEqual([]);
    },
  );
  it.each(["warn", "error", 1, 2])(
    "requires explicit options for enabled entry %j",
    (entry) => {
      expect(
        missingOptions(
          "example",
          {
            meta: {
              schema: [
                {
                  additionalProperties: false,
                  properties: { enabled: { type: "boolean" } },
                  type: "object",
                },
              ],
            },
          },
          [["example", entry]],
        ),
      ).toEqual(["example option 1"]);
    },
  );
});
const getOffRuleIds = async (
  eslint: ESLint,
  filePath: string,
): Promise<readonly string[]> => {
  const config = await getResolvedConfig(eslint, filePath);
  const language = config?.toJSON().language;
  const unsupported = new Set(
    Object.entries(config?.plugins ?? {}).flatMap(([prefix, plugin]) => {
      return Object.entries(plugin.rules ?? {})
        .filter(([, rule]) => {
          const languages = rule.meta?.languages;
          return (
            typeof language !== "undefined" &&
            typeof languages !== "undefined" &&
            !languages.includes("*") &&
            !languages.includes(language)
          );
        })
        .map(([name]) => {
          return `${prefix}/${name}`;
        });
    }),
  );
  return Object.entries(config?.rules ?? {})
    .filter(([id, entry]) => {
      return entry[0] === 0 && entry.length > 1 && !unsupported.has(id);
    })
    .map(([ruleId]) => {
      return ruleId;
    });
};

/*
ESLint validates rule options only while a rule is enabled, and a later config that enables a rule with a bare severity keeps the options configured before.
Options retained on an off rule must still be valid when a consumer enables it.
Bare off entries do not need options; consumers choose options when enabling them.
*/
describe.each([false, true])(
  "rule options with typed linting %s",
  (typeChecked) => {
    it.each(filePaths)(
      "keep supplied options valid when a later config enables an off rule in %s",
      async (filePath) => {
        const config = await createConfig({
          express: true,
          projectRootDirectory: rootDirectory,
          react: { refresh: "generic" },
          svelte: true,
          typescript: { tsconfigRootDir: rootDirectory, typeChecked },
        });
        const offRuleIds = await getOffRuleIds(
          new ESLint({ overrideConfig: config, overrideConfigFile: true }),
          filePath,
        );
        const enableOffRules: Linter.Config = {
          files: ["**/*"],
          name: "test/enable-off-rules",
          rules: Object.fromEntries(
            offRuleIds.map((ruleId) => {
              return [ruleId, "error"];
            }),
          ),
        };
        const eslint = new ESLint({
          overrideConfig: [...config, enableOffRules],
          overrideConfigFile: true,
        });
        await expect(
          getResolvedConfig(eslint, filePath),
        ).resolves.toBeDefined();
      },
    );
  },
);
