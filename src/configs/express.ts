import type { Linter } from "eslint";
import type { FeatureOptions, Rules } from "../types.js";

import { expressFiles } from "../globs.js";
import { narrowFiles } from "../utilities/file-scope.js";
import { importPeer } from "../utilities/import-peer.js";
import { supportedPluginPolicy } from "../utilities/plugin-policy.js";

// Policy for eslint-plugin-express-security, an optional peer.
const expressRules: Rules = {
  "express-security/no-client-controlled-authorization": [
    "off",
    { extraProperties: [] },
  ], // Not part of the enabled policy.
  "express-security/no-disabled-helmet-protections": [
    "off",
    { allowDisabled: [] },
  ], // Not part of the enabled policy.
  "express-security/no-error-details-in-response": [
    "off",
    { allowInDev: false, allowMessage: true },
  ], // Not part of the enabled policy.
  "express-security/no-host-header-in-links": [
    "off",
    { allowedHosts: [], checkMailCallees: ["sendMail", "send"] },
  ], // Not part of the enabled policy.
  "express-security/no-idor-resource-access": [
    "off",
    {
      lookupMethods: [
        "findById",
        "findByPk",
        "findOne",
        "findUnique",
        "findFirst",
        "findByIdAndUpdate",
        "findByIdAndDelete",
        "findByIdAndRemove",
        "getById",
        "deleteOne",
        "deleteById",
        "updateOne",
        "replaceOne",
      ],
    },
  ], // Not part of the enabled policy.
  "express-security/no-permissive-trust-proxy": [
    "off",
    {
      hopCount: 1,

      appReceiverNames: [
        "app",
        "server",
        "router",
        "express",
        "api",
        "apiRouter",
        "routes",
      ],
    },
  ], // Not part of the enabled policy.
  "express-security/no-sensitive-data-in-query": [
    "off",
    {
      allowedParams: [],
      extraPatterns: [],
      sensitiveParams: [],
    },
  ], // Not part of the enabled policy.
  "express-security/no-static-root-exposure": ["off", { allowedRoots: [] }], // Not part of the enabled policy.
  "express-security/no-unsafe-csp-directives": ["off", { checkStyleSrc: true }], // Not part of the enabled policy.
  "express-security/no-user-controlled-redirect": [
    "off",
    { requestObjects: [], responseObjects: [] },
  ], // Not part of the enabled policy.
  "express-security/no-user-controlled-render-locals": [
    "off",
    { allowSanitizers: [] },
  ], // Not part of the enabled policy.
  "express-security/require-case-insensitive-path-guard": [
    "off",
    {
      checkAllPaths: false,
      protectedPaths: ["admin", "api", "dashboard", "internal", "private"],
    },
  ], // Not part of the enabled policy.
  "express-security/require-query-type-guard": [
    "off",
    { coercers: ["String"], validators: ["parse", "safeParse"] },
  ], // Not part of the enabled policy.
  "express-security/require-route-authentication": [
    "off",
    {
      authMiddleware: [],
      criticalPaths: [
        "password",
        "credential",
        "secret",
        "apikey",
        "api-key",
        "user",
        "account",
        "profile",
        "role",
        "permission",
        "grant",
        "payment",
        "billing",
        "invoice",
        "charge",
        "refund",
        "transfer",
        "withdraw",
        "order",
        "config",
        "setting",
        "export",
        "import",
        "mfa",
        "2fa",
        "otp",
        "deploy",
        "migrate",
        "backup",
        "restore",
        "internal",
        "private",
      ],
      publicPaths: [
        "login",
        "signin",
        "sign-in",
        "logout",
        "signup",
        "sign-up",
        "register",
        "forgot",
        "reset",
        "confirm",
        "verify",
        "recover",
        "recovery",
        "unlock",
        "challenge",
        "enroll",
        "enrol",
        "enrollment",
        "activate",
        "activation",
        "resend",
        "consent",
        "webhook",
        "hook",
        "health",
        "healthz",
        "readyz",
        "livez",
        "ping",
        "status",
        "public",
        "static",
        "assets",
        "favicon",
        "robots",
        "callback",
        "oauth",
        "sso",
        "docs",
        "swagger",
        "openapi",
      ],

      appReceiverNames: [
        "app",
        "server",
        "router",
        "express",
        "api",
        "apiRouter",
        "routes",
      ],
    },
  ], // Not part of the enabled policy.
  "express-security/require-strict-transport-security": [
    "off",
    { minMaxAge: 15_552_000, requireSubDomains: true },
  ], // Not part of the enabled policy.

  "express-security/no-cors-credentials-wildcard": [
    "error",
    { allowInTests: false },
  ],
  "express-security/no-express-unsafe-regex-route": [
    "error",
    { allowInTests: false },
  ],
  "express-security/no-graphql-introspection-production": [
    "error",
    { allowInDevelopment: true, allowInTests: true },
  ],
  "express-security/no-insecure-cookie-options": [
    "error",
    {
      acceptableSameSiteValues: ["strict", "lax"],
      allowInTests: false,
      requireHttpOnly: true,
      requireSameSite: true,
      requireSecure: true,
    },
  ],
  "express-security/no-permissive-cors": [
    "error",
    { allowedOrigins: [], allowInTests: false, allowOriginTrue: false },
  ],
  "express-security/require-csrf-protection": [
    "error",
    {
      allowInTests: false,
      ignorePatterns: [],
      protectedMethods: ["post", "put", "patch", "delete"],
    },
  ],
  "express-security/require-express-body-parser-limits": [
    "error",
    {
      allowInTests: false,
      excessiveLimits: [
        "10mb",
        "50mb",
        "100mb",
        "500mb",
        "1gb",
        "1GB",
        "10MB",
        "50MB",
        "100MB",
        "500MB",
      ],
      maxLimit: 5_242_880,
    },
  ],
  "express-security/require-helmet": [
    "error",
    {
      allowInTests: false,
      alternativeMiddleware: [],
      assumeHelmetMiddleware: false,
    },
  ],
  "express-security/require-rate-limiting": [
    "error",
    {
      allowInTests: false,
      alternativeMiddleware: [],
      appReceiverNames: [
        "app",
        "server",
        "router",
        "express",
        "api",
        "apiRouter",
        "routes",
      ],
      assumeRateLimiting: false,
    },
  ],

  "express-security/no-exposed-debug-endpoints": [
    "off",
    {
      endpoints: [
        "/debug",
        "/__debug__",
        "/admin",
        "/_admin",
        "/test",
        "/health",
      ],
      ignoreFiles: [],
    },
  ], // Project specific
} as const;

// Builds the flat config for Express apps. A missing eslint-plugin-express-security fails with a
// message that names it.
async function express({
  files,
  ignores = [],
  overrides = {},
}: FeatureOptions = {}): Promise<Linter.Config[]> {
  const plugin = await importPeer<{
    readonly default: NonNullable<Linter.Config["plugins"]>[string];
  }>("eslint-plugin-express-security", "express");

  return [
    {
      files: narrowFiles(expressFiles, files),
      ignores: [...ignores],
      name: "@cravingmaker/eslint-config/express/rules",
      plugins: { "express-security": plugin.default },
      rules: {
        ...supportedPluginPolicy(
          "express-security",
          expressRules,
          plugin.default.rules,
        ),
        ...overrides,
      },
    },
  ];
}

export { express };
