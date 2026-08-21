# AGENTS.md

## Project purpose

Discript is an ESM Node.js scripting language and CLI for Discord automation. It serves human developers and AI agents through direct commands, `.ds` files, stdin, a reusable local daemon, and MCP transports.

## Repository map

- `bin/` — executable CLI entry point.
- `src/parser/` — tokenizer, syntax parsing, operators, and parser errors.
- `src/` — evaluator, runtime, Discord adapter, CLI, broker, and MCP integration.
- `tests/` — deterministic unit tests with implementation-to-test mapping.
- `examples/` — runnable `.ds` tutorials and workflow templates.
- `docs/` — maintained user, language, Discord, agent, developer, MCP, operations, and contributor guides.
- `specs/` and `SPEC.md` — product requirements and behavior contracts.

## Development commands

```bash
npm install
npm test
npm run test:gaps
npm run lint
npm run docs:check
npm run package:check
```

Default tests must not require a Discord token, a live guild, or a user's home `.env`. Opt-in live checks use `TEST_GUILD` and isolated credentials.

## Implementation guidance

Keep modules small and single-purpose. Preserve the parser public entry point, shared Discord adapter boundary, structured JSON output, stable error/exit codes, and cleanup on every success and failure path. Do not duplicate Discord API logic in CLI handlers or transports.

All transports must preserve the same safety model: mutations support dry-run, destructive operations require explicit `--yes`/`-y` or script-level approval, and secrets are redacted from output. Daemon and MCP work must account for connection reuse, bounded concurrency, authentication, TLS, and graceful shutdown.

## Tests and documentation

Prefer one test file per implementation module under the matching `tests/` path. Add focused tests for success, validation, error, cleanup, safety, and transport behavior; do not add tests only to inflate coverage. User-visible changes also update relevant specs, examples, and docs. Run `npm run docs:check` after link or example changes.

## Security and release

Never commit `.env` files, bot tokens, webhook URLs, TLS private keys, or raw sensitive Discord payloads. Review package contents with `npm pack --dry-run` and follow `docs/operations/release.md` and `docs/contributing/release-checklist.md` before publishing. Do not bump versions, tag, or publish unless explicitly requested.
