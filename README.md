# @cravingmaker/eslint-config

A highly opinionated, modern, and elegant ESLint configuration crafted by [the cravingmaker](https://github.com/cravingmaker).

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

Export it from an `eslint.config.{js,mjs,ts,mts}` file:

```javascript
import cravingmakerConfig from "@cravingmaker/eslint-config";

export default [
  ...cravingmakerConfig
  // Add your own overrides here
];
```

## License

MIT © [cravingmaker](https://github.com/cravingmaker)
