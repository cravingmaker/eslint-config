const javascriptFiles = ["**/*.{js,mjs,cjs,jsx,mjsx}"] as const;
const typescriptFiles = ["**/*.{ts,mts,cts,tsx,mtsx}"] as const;
// JavaScript and TypeScript sources, which share the core and code-quality rules.
const sourceFiles = [...javascriptFiles, ...typescriptFiles] as const;

export { javascriptFiles, sourceFiles, typescriptFiles };
