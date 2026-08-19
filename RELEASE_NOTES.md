# Release Notes

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
