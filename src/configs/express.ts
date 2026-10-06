import type { Rules } from "../types.js";

// Policy for eslint-plugin-express-security, an optional peer.
const expressRules: Rules = {
  "express-security/no-cors-credentials-wildcard": "error",
  "express-security/no-express-unsafe-regex-route": "error",
  "express-security/no-graphql-introspection-production": "error",
  "express-security/no-insecure-cookie-options": "error",
  "express-security/no-permissive-cors": "error",
  "express-security/require-csrf-protection": "error",
  "express-security/require-express-body-parser-limits": "error",
  "express-security/require-helmet": "error",
  "express-security/require-rate-limiting": "error",

  "express-security/no-exposed-debug-endpoints": "off", // Project specific
} as const;

export { expressRules };
