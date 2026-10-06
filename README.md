# @cravingmaker/eslint-config

A highly opinionated, modern, and elegant ESLint configuration crafted by [the cravingmaker](https://github.com/cravingmaker).

## Features

- **Modern Standards**: Designed for ESLint Flat Config and ESM.
- **TypeScript First**: Robust TypeScript support with optional type-checked rules.
- **Wide Language Support**: Includes optimized rules for:
  - JavaScript & TypeScript
  - React (JSX/TSX)
  - Svelte
  - HTML
  - JSON, JSONC, and JSON5
  - `package.json` specific linting
- **Best Practices**: Integrated plugins for security, promise handling, regular expressions, and functional programming.
- **Opinionated & Consistent**: Strict rules for code style and consistency using `perfectionist`, `unicorn`, and more.

## Requirements

- Node.js `>=24.15.0`
- ESLint `>=10.4.0 <11`

React, Svelte, and Express integrations are optional. Each one turns on when the `package.json` at the project root declares `react`, `svelte`, or `express`, and then needs its corresponding peer packages installed. JavaScript and TypeScript files are linted as ES modules, including `.mjs` and `.mts` files. CommonJS is not supported, so the config sets no rules for `.cjs` and `.cts` files.

## Installation

Install the configuration along with ESLint using your favorite package manager:

```bash
npm install --save-dev --save-exact eslint @cravingmaker/eslint-config
```

```bash
yarn add --dev --exact eslint @cravingmaker/eslint-config
```

```bash
pnpm add --save-dev --save-exact eslint @cravingmaker/eslint-config
```

```bash
bun add --dev --exact eslint @cravingmaker/eslint-config
```

## Usage

Create an `eslint.config.js` file in your project root. Type-checked TypeScript rules are disabled by default and must be enabled explicitly with `tsTypeChecked: true`.

```javascript
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  // Optional (default: false): Enable type-checked TypeScript rules
  tsTypeChecked: true,
  // Optional: Set the project root used for framework/package auto-detection
  projectRootDirectory: import.meta.dirname,
  // Optional: Override the tsconfig root; defaults to projectRootDirectory
  tsconfigRootDir: import.meta.dirname,
  // Optional: Enable runtime globals from the bundled globals package
  environments: ["browser"],
  // Optional: Add or override individual globals
  globals: {
    MY_GLOBAL: "readonly",
  },
  // Optional: Add custom ignores
  ignores: ["dist/**"],
  // Optional: Override rules
  rules: {
    markdown: {
      "markdown/no-missing-label-refs": "off",
    },
    ts: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
});
```

## License

MIT © [cravingmaker](https://github.com/cravingmaker)
