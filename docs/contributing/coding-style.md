# Coding style

Discript uses modern Node.js ESM modules and favors small, single-purpose modules. Keep implementation files easy to map to their tests: a module in `src/` should normally have a corresponding test module under `tests/`.

Use the repository's existing formatting and naming conventions: two-space indentation, semicolons, descriptive camelCase names, and explicit error handling. Reuse shared helpers from `/usr/src/eliware/common` when they are already appropriate instead of creating parallel utilities.

Keep CLI output stable. Human-readable output may evolve deliberately, but JSON output, exit statuses, and error codes are contracts used by agents and shell scripts. Never print tokens or other secrets in errors, examples, fixtures, or debug logs.

When adding a feature, update the implementation, its focused tests, the relevant `.ds` examples, and the linked documentation together. Use `npm run docs:check` and `git diff --check` before committing.

See [testing](tests.md), [documentation style](documentation-style.md), and the [developer architecture guide](../developers/architecture.md).
