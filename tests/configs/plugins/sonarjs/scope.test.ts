import type { Linter } from "eslint";
import type { Options } from "../../../../src/types.js";

import {
  mkdir,
  mkdtemp,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import { createConfig } from "../../../../dist/index.mjs";
import { getResolvedRules } from "../../../support/resolved-config.js";

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "eslint-config-sonarjs-scope-"),
);
// eslint-disable-next-line security/detect-non-literal-fs-filename -- Resolve only this suite's newly created temporary project.
const directory = await realpath(temporaryDirectory);
afterAll(async () => {
  await rm(directory, { force: true, recursive: true });
});

const fixtures = {
  "check.test.ts": "export {};\n",
  "package.json": JSON.stringify({
    private: true,
    type: "module",
    workspaces: ["packages/*"],
  }),
  "packages/optional/package.json": JSON.stringify({
    optionalDependencies: { "aws-cdk-lib": "2.0.0" },
    type: "module",
  }),
  "packages/regular/package.json": JSON.stringify({
    dependencies: { "aws-cdk-lib": "2.0.0" },
    type: "module",
  }),
  "src/check.ts": "export {};\n",
  "test/check.ts": "export {};\n",
  "__tests__/check.ts": "export {};\n",
  "tsconfig.json": JSON.stringify({
    compilerOptions: {
      allowUnreachableCode: false,
      module: "nodenext",
      noEmit: true,
      noImplicitReturns: true,
      strict: true,
      target: "esnext",
      types: ["node"],
    },
    include: ["**/*.ts"],
  }),
} as const;
await Promise.all(
  Object.entries(fixtures).map(async ([fileName, content]) => {
    const filePath = path.join(directory, fileName);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Create parents of the fixed fixture keys under this suite's temporary root.
    await mkdir(path.dirname(filePath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Write only the fixed fixture keys under this suite's temporary root.
    await writeFile(filePath, content);
  }),
);
// eslint-disable-next-line security/detect-non-literal-fs-filename -- Link installed Node types into the fixed node_modules child of the temporary project.
await symlink(
  path.join(process.cwd(), "node_modules"),
  path.join(directory, "node_modules"),
  "junction",
);

const awsRuleIds = [
  "sonarjs/aws-apigateway-public-api",
  "sonarjs/aws-ec2-rds-dms-public",
  "sonarjs/aws-ec2-unencrypted-ebs-volume",
  "sonarjs/aws-efs-unencrypted",
  "sonarjs/aws-iam-all-privileges",
  "sonarjs/aws-iam-all-resources-accessible",
  "sonarjs/aws-iam-privilege-escalation",
  "sonarjs/aws-iam-public-access",
  "sonarjs/aws-opensearchservice-domain",
  "sonarjs/aws-rds-unencrypted-databases",
  "sonarjs/aws-restricted-ip-admin-access",
  "sonarjs/aws-s3-bucket-granted-access",
  "sonarjs/aws-s3-bucket-insecure-http",
  "sonarjs/aws-s3-bucket-public-access",
  "sonarjs/aws-s3-bucket-versioning",
  "sonarjs/aws-sagemaker-unencrypted-notebook",
  "sonarjs/aws-sns-unencrypted-topics",
  "sonarjs/aws-sqs-unencrypted-queue",
] as const;
const testRuleSeverities = {
  "sonarjs/assertions-in-test-cases": 2,
  "sonarjs/assertions-in-tests": 1,
  "sonarjs/async-test-assertions": 2,
  "sonarjs/explicit-test-skip": 2,
  "sonarjs/hooks-before-test-cases": 2,
  "sonarjs/no-debug-commands-in-ui-tests": 2,
  "sonarjs/no-duplicate-parameterized-test-case": 2,
  "sonarjs/no-duplicate-test-title": 2,
  "sonarjs/no-empty-parameterized-test-dataset": 2,
  "sonarjs/no-empty-test-file": 2,
  "sonarjs/no-empty-test-title": 2,
  "sonarjs/no-exclusive-tests": 2,
  "sonarjs/no-fixed-wait-in-tests": 2,
  "sonarjs/no-skipped-tests": 1,
  "sonarjs/parameterized-tests": 1,
  "sonarjs/stable-tests": 2,
  "sonarjs/test-check-exception": 2,
  "sonarjs/testing-library-prefer-query-by-disappearance": 2,
  "sonarjs/testing-library-query-assertion": 2,
  "sonarjs/vitest-mock-at-module-scope": 2,
} as const;

const createEngine = async (
  options: Options = {},
  userConfigs: readonly Linter.Config[] = [],
) => {
  return new ESLint({
    cwd: directory,
    overrideConfig: await createConfig(
      { projectRootDirectory: directory, ...options },
      ...userConfigs,
    ),
    overrideConfigFile: true,
  });
};

const typed = await createEngine();
const untyped = await createEngine({ typescript: { typeChecked: false } });

const lint = async (engine: ESLint, code: string, filePath: string) => {
  const results = await engine.lintText(code, { filePath });
  expect(results).toHaveLength(1);
  const [result] = results;
  expect(
    result.messages.filter(({ fatal, ruleId }) => {
      return fatal === true || typeof ruleId !== "string";
    }),
  ).toEqual([]);
  return result.messages;
};

describe("SonarJS AWS scope", () => {
  it.each([
    [".", "packages/regular/stack.js"],
    [".", "packages/optional/stack.js"],
    ["packages/optional", "packages/optional/stack.js"],
  ])("checks CDK with root %s and source %s", async (root, filePath) => {
    const engine = await createEngine({
      projectRootDirectory: path.join(directory, root),
    });
    const rules = new Map(
      Object.entries((await getResolvedRules(engine, filePath)) ?? {}),
    );
    expect(
      Object.fromEntries(
        awsRuleIds.map((ruleId) => {
          return [ruleId, rules.get(ruleId)];
        }),
      ),
    ).toEqual(
      Object.fromEntries(
        awsRuleIds.map((ruleId) => {
          return [ruleId, [2]];
        }),
      ),
    );
    const source =
      'import { Bucket } from "aws-cdk-lib/aws-s3";\nexport const bucket = new Bucket(scope, "Artifacts", { enforceSSL: false });\n';
    expect(await lint(engine, source, filePath)).toContainEqual(
      expect.objectContaining({
        ruleId: "sonarjs/aws-s3-bucket-insecure-http",
        severity: 2,
      }),
    );
    await Promise.all(
      [
        source.replace("enforceSSL: false", "enforceSSL: true"),
        source.replace("aws-cdk-lib/aws-s3", "unrelated-library"),
      ].map(async (safe) => {
        expect(await lint(engine, safe, filePath)).not.toContainEqual(
          expect.objectContaining({
            ruleId: "sonarjs/aws-s3-bucket-insecure-http",
          }),
        );
      }),
    );
  });

  it.each([
    { sonarjs: false },
    { sonarjs: { files: ["other/**"] } },
    { sonarjs: { ignores: ["packages/**"] } },
    {
      sonarjs: { overrides: { "sonarjs/aws-s3-bucket-insecure-http": "off" } },
    },
  ] satisfies readonly Options[])(
    "honors AWS feature boundaries: %j",
    async (options) => {
      const engine = await createEngine(options);
      expect(
        await lint(
          engine,
          'import { Bucket } from "aws-cdk-lib/aws-s3";\nexport const bucket = new Bucket(scope, "Artifacts", { enforceSSL: false });\n',
          "packages/optional/stack.js",
        ),
      ).not.toContainEqual(
        expect.objectContaining({
          ruleId: "sonarjs/aws-s3-bucket-insecure-http",
        }),
      );
    },
  );

  it("allows a later consumer to disable an AWS check", async () => {
    const engine = await createEngine({}, [
      { rules: { "sonarjs/aws-s3-bucket-insecure-http": "off" } },
    ]);
    expect(
      await lint(
        engine,
        'import { Bucket } from "aws-cdk-lib/aws-s3";\nexport const bucket = new Bucket(scope, "Artifacts", { enforceSSL: false });\n',
        "packages/optional/stack.js",
      ),
    ).not.toContainEqual(
      expect.objectContaining({
        ruleId: "sonarjs/aws-s3-bucket-insecure-http",
      }),
    );
  });
});

describe("SonarJS alternate test filenames", () => {
  it("does not report test diagnostics for ordinary typed source", async () => {
    const messages = await lint(
      typed,
      "export const read = (value: number) => { return value + 1; };\n",
      "src/check.ts",
    );
    expect(
      messages.filter(({ ruleId }) => {
        return (
          ruleId === "sonarjs/assertions-in-tests" ||
          ruleId === "sonarjs/no-exclusive-tests"
        );
      }),
    ).toEqual([]);
  });
  it.each([
    "__tests__/check.ts",
    "test/check.ts",
    "check.test.ts",
    "src/check.ts",
  ])(
    "retains the reviewed twenty-rule inventory and typed guard in %s",
    async (filePath) => {
      await Promise.all(
        (
          [
            [typed, true],
            [untyped, false],
          ] as const
        ).map(async ([engine, typeChecked]) => {
          const rules = new Map(
            Object.entries((await getResolvedRules(engine, filePath)) ?? {}),
          );
          expect(
            Object.fromEntries(
              Object.keys(testRuleSeverities).map((ruleId) => {
                return [ruleId, rules.get(ruleId)?.[0]];
              }),
            ),
          ).toEqual({
            ...testRuleSeverities,
            "sonarjs/assertions-in-tests": typeChecked ? 1 : 0,
          });
        }),
      );
    },
  );

  it.each(["__tests__/check.js", "test/check.js", "check.test.js"])(
    "reports exclusive tests beyond the shared filename role: %s",
    async (filePath) => {
      const source =
        'it.only("checks checkout", () => { expect(1).toBe(1); });\n';
      expect(await lint(untyped, source, filePath)).toContainEqual(
        expect.objectContaining({
          ruleId: "sonarjs/no-exclusive-tests",
          severity: 2,
        }),
      );
      expect(
        await lint(untyped, source.replace("it.only", "it"), filePath),
      ).not.toContainEqual(
        expect.objectContaining({ ruleId: "sonarjs/no-exclusive-tests" }),
      );
    },
  );

  it.each(["__tests__/check.ts", "test/check.ts", "check.test.ts"])(
    "warns on missing typed assertions in %s",
    async (filePath) => {
      const source =
        'import { it } from "node:test";\nimport assert from "node:assert/strict";\nit("checks checkout", () => { const value = 1; });\n';
      expect(await lint(typed, source, filePath)).toContainEqual(
        expect.objectContaining({
          ruleId: "sonarjs/assertions-in-tests",
          severity: 1,
        }),
      );
      expect(
        await lint(
          typed,
          source.replace("const value = 1;", "assert.equal(1, 1);"),
          filePath,
        ),
      ).not.toContainEqual(
        expect.objectContaining({ ruleId: "sonarjs/assertions-in-tests" }),
      );
      expect(await lint(untyped, source, filePath)).not.toContainEqual(
        expect.objectContaining({ ruleId: "sonarjs/assertions-in-tests" }),
      );
    },
  );

  it.each([
    { sonarjs: false },
    { sonarjs: { files: ["other/**"] } },
    { sonarjs: { ignores: ["__tests__/**"] } },
    {
      sonarjs: {
        overrides: {
          "sonarjs/assertions-in-tests": "off",
          "sonarjs/no-exclusive-tests": "off",
        },
      },
    },
    { typescript: { filesTypeAware: ["other/**"] } },
    { typescript: { ignoresTypeAware: ["__tests__/**"] } },
  ] satisfies readonly Options[])(
    "preserves feature and typed boundaries: %j",
    async (options) => {
      const engine = await createEngine(options);
      const messages = await lint(
        engine,
        'import { it } from "node:test";\nimport "node:assert/strict";\nit.only("checks checkout", () => { const value = 1; });\n',
        "__tests__/check.ts",
      );
      expect(messages).not.toContainEqual(
        expect.objectContaining({ ruleId: "sonarjs/assertions-in-tests" }),
      );
      expect(
        messages.filter(({ ruleId }) => {
          return ruleId === "sonarjs/no-exclusive-tests";
        }),
      ).toHaveLength(typeof options.typescript === "undefined" ? 0 : 1);
    },
  );

  it("honors later consumer overrides without changing the test-file role", async () => {
    const engine = await createEngine({}, [
      {
        rules: {
          "sonarjs/assertions-in-tests": "off",
          "sonarjs/no-exclusive-tests": "off",
        },
      },
    ]);
    const messages = await lint(
      engine,
      'import { it } from "node:test";\nimport "node:assert/strict";\nit.only("checks checkout", () => { const value = 1; });\n',
      "__tests__/check.ts",
    );
    expect(messages).not.toContainEqual(
      expect.objectContaining({ ruleId: "sonarjs/assertions-in-tests" }),
    );
    expect(messages).not.toContainEqual(
      expect.objectContaining({ ruleId: "sonarjs/no-exclusive-tests" }),
    );
    const rules = new Map(
      Object.entries(
        (await getResolvedRules(typed, "__tests__/check.ts")) ?? {},
      ),
    );
    expect(rules.get("functional/no-expression-statements")?.[0]).toBe(2);
    expect(rules.get("functional/no-return-void")?.[0]).toBe(2);
  });
});
