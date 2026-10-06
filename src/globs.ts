const javascriptFiles = ["**/*.{js,mjs,cjs,jsx,mjsx}"] as const;
const typescriptFiles = ["**/*.{ts,mts,cts,tsx,mtsx}"] as const;
// JavaScript and TypeScript sources, which share the core and code-quality rules.
const sourceFiles = [...javascriptFiles, ...typescriptFiles] as const;

const htmlFiles = ["**/*.html"] as const;
const markdownFiles = ["**/*.md"] as const;
const packageJsonFiles = ["**/package.json"] as const;

const jsonFiles = ["**/*.json"] as const;
// JSON files that other features or no feature lint.
const jsonIgnores = [
  "**/package-lock.json",
  "**/package.json",
  "**/yarn.lock",
] as const;
const jsoncFiles = [
  "**/.devcontainer/*.json",
  "**/*.jsonc",
  "**/tsconfig*.json",
  "**/.vscode/*.json",
] as const;
const json5Files = ["**/*.json5"] as const;

export {
  htmlFiles,
  javascriptFiles,
  json5Files,
  jsoncFiles,
  jsonFiles,
  jsonIgnores,
  markdownFiles,
  packageJsonFiles,
  sourceFiles,
  typescriptFiles,
};
