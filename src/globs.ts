// ES modules. CommonJS is not supported, so `.cjs` and `.cts` files are left out and get no
// rules. ESLint's default config still matches `.cjs` files and parses them as CommonJS.
const javascriptFiles = ["**/*.{js,mjs,jsx,mjsx}"] as const;
const typescriptFiles = ["**/*.{ts,mts,tsx,mtsx}"] as const;
// JavaScript and TypeScript sources, which share the core and code-quality rules.
const sourceFiles = [...javascriptFiles, ...typescriptFiles] as const;
const jsxFiles = ["**/*.{jsx,mjsx}"] as const;

// Files that can hold React components.
const reactFiles = ["**/*.{jsx,mjsx,tsx,mtsx}"] as const;
// Svelte components and modules that use runes.
const svelteFiles = [
  "**/*.{svelte,svelte.js,svelte.mjs,svelte.ts,svelte.mts}",
] as const;
// ES module sources, where Express apps live.
const expressFiles = ["**/*.{js,mjs,ts,mts}"] as const;

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

// Test files, named with the infix that test runners look for. Like `configFiles`, this matches
// any file type; `configs/exceptions.ts` narrows both to `sourceFiles`.
const testFiles = ["**/*.{test,spec}.*"] as const;
// Config files of tools such as ESLint, Vite, and Vitest.
const configFiles = ["**/*.config.*"] as const;

export {
  configFiles,
  expressFiles,
  htmlFiles,
  javascriptFiles,
  json5Files,
  jsoncFiles,
  jsonFiles,
  jsonIgnores,
  jsxFiles,
  markdownFiles,
  packageJsonFiles,
  reactFiles,
  sourceFiles,
  svelteFiles,
  testFiles,
  typescriptFiles,
};
