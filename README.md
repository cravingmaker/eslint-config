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

Create an `eslint.config.js` file in your project root:

```javascript
import { createConfig } from "@cravingmaker/eslint-config";

export default createConfig({
  // Optional: Enable type-checked rules (defaults to true)
  tsTypeChecked: true,
  // Optional: Set the root directory for tsconfig (defaults to process.cwd())
  tsconfigRootDir: import.meta.dirname,
  // Optional: Add custom ignores
  ignores: ["dist/**"],
  // Optional: Override rules
  rules: {
    ts: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
});
```

## License

MIT © [cravingmaker](https://github.com/cravingmaker)
