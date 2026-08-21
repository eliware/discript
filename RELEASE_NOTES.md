# Release Notes

## 1.0.8

- Made MCP end-to-end and CLI mode tests hermetic across CI environments by avoiding implicit local Discord credentials and Gateway startup.

## 1.0.7

- Added MCP server and client modes over stdio, HTTP, and HTTPS with configurable authentication, TLS, OAuth2 delegation, health checks, bounded concurrency, and lifecycle cleanup.
- Added MCP discovery metadata, help, command catalogs, examples, resources, prompts, structured execution results, scopes, dry-run previews, force approval, and sanitized errors.
- Added remote MCP capability preflight, REST-first direct and source execution, cross-platform packaging checks, live test-guild gates, and dedicated CI coverage.
- Expanded MCP configuration, deployment, operations, security, release, and agent workflow documentation.

## Unreleased

- Added REST-first command execution for read-only operations and selected safe mutations.
- Added a persistent local Gateway broker with `daemon start|status|stop` and `--broker` command/script execution.
- Added Gateway startup cleanup, cross-process identify locking, session-limit checks, bounded retry behavior, and reset-aware errors.

## 1.0.6

- Added user-level `~/.discript.env` configuration with quiet, cross-platform loading and local environment precedence.
- Hardened synchronous Discord login failure handling and completed additional CLI 100×4 coverage for invite, event, and permission handlers.
- Corrected local tarball installation and setup documentation for Windows and Linux users.

## 1.0.5

- Added runtime and CLI integration coverage, mutation safety matrix coverage, and complete direct command-handler tests.
- Added deterministic live smoke coverage against `TEST_GUILD`, including reversible mutation cleanup and bounded Discord login failures.
- Added documentation drift checks to CI, executable example tests, and npm packaging for the full `docs/` tree.
- Fixed Windows path handling in documentation, executable-example, and package archive verification checks.

## 1.0.4

- Decomposed parser, evaluator, Discord API, CLI command, and test modules into focused one-to-one files.
- Added CLI command handler test coverage and completed 100x4 coverage for evaluator expressions, evaluator control flow, and Discord safety.
- Added command validation, preview, dispatch, and compatibility-barrel structure for maintainable CLI evolution.

## 1.0.3

Fix the package-install smoke check on Windows runners by using the platform-specific npm and CLI command names.

## 1.0.2

First public npm release under the available `@eliware/discript` package scope after the unscoped `discript` name was rejected by npm.

## 1.0.1

Initial public release of Discript, a Discord-focused scripting language and CLI for developers and AI agents.

- One-shot CLI commands, inline/stdin/file scripts, structured JSON and JSONL output
- Variables, control flow, functions, imports, callbacks, timers, event handlers, and script exit status
- Dry-run previews and explicit force approval for state-changing operations
- Guild, channel, message, member, role, moderation, thread, invite, event, emoji, sticker, webhook, permission, and voice operations
- Permission, hierarchy, protected-target, and authorization safeguards
- Agent-oriented diagnostics, command discovery, shell completions, examples, and live test gates
