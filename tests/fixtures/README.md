# Fixtures

Valid files of each type that the configuration lints. `tests/policy/fixtures.test.ts` lints them with every feature on, with and without typed linting, and expects no messages in any of them.

| File type                      | Fixture                   |
| ------------------------------ | ------------------------- |
| JavaScript                     | `format-date.js`          |
| JavaScript module              | `parse-version.mjs`       |
| JSX, without React imports     | `react/Greeting.jsx`      |
| TypeScript                     | `temperature.ts`          |
| TypeScript module              | `settle.mts`              |
| TypeScript declarations        | `format-date.d.ts`        |
| TSX                            | `react/Counter.tsx`       |
| React hook in TypeScript       | `react/use-toggle.ts`     |
| Svelte component, TypeScript   | `svelte/Counter.svelte`   |
| Svelte component, JavaScript   | `svelte/Toggle.svelte`    |
| Svelte rune module, JavaScript | `svelte/visits.svelte.js` |
| Svelte rune module, TypeScript | `svelte/theme.svelte.ts`  |
| HTML                           | `index.html`              |
| JSON                           | `data.json`               |
| JSONC                          | `tsconfig.json`           |
| JSON5                          | `data.json5`              |
| Package manifest               | `package.json`            |
| Markdown                       | `README.md`               |

The files in `react/` are linted without type information, and `tsconfig.json` leaves them out. React ships no type declarations, and with them, typed linting reports the components themselves, which the rewrite plan records under stage 4.

To cover a new file type, add one valid file of that type here and list it in the test:

```ts
const fixtures: readonly Fixture[] = [
  { fileType: "JavaScript", path: "format-date.js" },
  // One entry per file type
];
```
