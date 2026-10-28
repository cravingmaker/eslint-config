# Coding principles

These principles guide decisions about code style, architecture, linter rules, formatter settings, and development scripts in this project.

## Priority order

Evaluate approaches against the goals below, in priority order. When goals conflict, prefer the approach that serves the higher-priority goal and explain the trade-off.

| Priority | Goal                           | Definition                                                                                          |
| -------- | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| **1**    | **Deterministic & Consistent** | Equivalent problems should produce the same preferred coding patterns, structures, and conventions. |
| **2**    | **Readable & Maintainable**    | Code should be easy to understand, debug, modify, test, and extend.                                 |
| **3**    | **Secure**                     | Prevent vulnerabilities, unsafe operations, and insecure patterns.                                  |
| **4**    | **Performant & Efficient**     | Minimize unnecessary computational, memory, and resource costs.                                     |
| **5**    | **Non-obsolete**               | Avoid outdated programming approaches superseded by better alternatives.                            |
| **6**    | **Non-deprecated**             | Avoid APIs, features, and dependencies officially marked as deprecated.                             |
| **7**    | **Non-redundant**              | Eliminate unnecessary operations, abstractions, duplication, and code.                              |
| **8**    | **Modern**                     | Prefer stable, current language features, APIs, and established practices.                          |
| **9**    | **Elegant & Concise**          | Express intent clearly with minimal unnecessary complexity or verbosity.                            |

## Applying the principles

- **Code style and architecture:** Use a consistent preferred pattern for equivalent problems. Choose structures and abstractions that make code easy to understand, debug, modify, test, and extend. Evaluate new patterns against the priority order before adopting them.
- **Linter:** Choose ESLint rules and options that enforce the preferred patterns and detect unsafe, inefficient, obsolete, deprecated, or redundant code. Review diagnostics and automatic fixes against these goals, and explain the reason for policy exceptions.
- **Formatter:** Use Prettier to apply consistent layout automatically. Keep ESLint and formatter settings compatible so that both tools produce a stable result.
- **Scripts:** Use shared scripts for repeatable building, linting, formatting, testing, and validation. Keep equivalent local and automated tasks consistent, and minimize unnecessary work and duplicated commands.

Use code review to apply principles that tools cannot reliably enforce. Document the reasoning behind trade-offs and exceptions so future changes can follow the same decisions.
