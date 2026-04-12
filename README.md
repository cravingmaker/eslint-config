# @cravingmaker/eslint-config

A highly opinionated, modern, and elegant ESLint configuration crafted by cravingmaker. ESM only. Best to be used with Prettier for the code formatter.

## Installation

Install the configuration along with ESLint and Prettier using your favorite package manager:

```bash
npm install --save-dev eslint prettier @cravingmaker/eslint-config @cravingmaker/prettier-config
```

```bash
yarn add --dev eslint prettier @cravingmaker/eslint-config @cravingmaker/prettier-config
```

```bash
pnpm add -D eslint prettier @cravingmaker/eslint-config @cravingmaker/prettier-config
```

```bash
bun add -D eslint prettier @cravingmaker/eslint-config @cravingmaker/prettier-config
```

## Usage

Create or update your `eslint.config.js` file:

```javascript
import cravingmakerConfig from '@cravingmaker/eslint-config';

export default [
	...cravingmakerConfig,
	// Add your own overrides here
];
```

## License

MIT © [cravingmaker](https://github.com/cravingmaker)
