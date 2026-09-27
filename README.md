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

React, Svelte, and Express integrations are optional and activate only when their corresponding peer packages are installed.

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
  // Optional: Set the tsconfig root when type-checked rules are enabled
  tsconfigRootDir: import.meta.dirname,
  // Optional: Add custom ignores
  ignores: ["dist/**"],
  // Optional: Override rules
  rules: {
    ts: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
});
```

## License

MIT © [cravingmaker](https://github.com/cravingmaker)
