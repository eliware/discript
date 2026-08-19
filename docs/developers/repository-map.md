# Repository map

| Path | Responsibility |
| --- | --- |
| `bin/` | Executable entry point. |
| `src/parser/` | Tokenization, parsing, expressions, statements, and parser errors. |
| `src/cli/` | Argument parsing, command catalog, handlers, output, and mutation validation. |
| `src/discord/` | Discord.js adapters, normalization, and resource operations. |
| `src/` runtime files | Client lifecycle, evaluation, configuration, and built-ins. |
| `tests/` | 1:1 module tests plus cross-cutting integration tests. |
| `examples/` | Runnable `.ds` examples by audience and use case. |
| `specs/` | Product requirements and capability checklist. |
| `docs/` | Maintained explanatory and reference documentation. |

Prefer adding a focused module under the appropriate source folder over growing a command or adapter monolith. Add the matching test file at the corresponding test path.

