# Release Notes

This file describes the cumulative product history represented by the published
Git tags. Each section starts with the first-release baseline and then records
what the next release added or changed.

## 1.0.10 — 2026-08-21

Built on the 1.0.9 language, documentation, and agent-workflow foundation.

- Expanded the language with indexed/computed access and assignment, compound
  assignment, modulo, exponentiation, null-coalescing, conditional and optional
  access, spread values, destructuring, loop control, `throw`, `try/catch/finally`,
  and deferred cleanup.
- Added script arguments, parser source locations, escaped single-quoted strings,
  explicit module exports, aliased imports, per-execution module isolation and
  caching, lexical closures, script call stacks, cancellable timers/events, and
  stronger cancellation propagation.
- Added bounded standard-library helpers for text, collections, timeouts, retries,
  concurrency, and async result coordination.
- Added language compatibility metadata and feature/version checks.
- Added script capability policies with hierarchical read/write/admin controls,
  environment configuration, and script-level capability introspection.
- Added hybrid daemon transport documentation, concurrent broker execution
  coverage, and a shared execution-result contract across transports.
- Expanded examples into commented runnable mini-tutorials for language, Discord,
  agent, MCP, safety, optimization, and deployment workflows; added block comments.
- Added focused tests for command dispatch, configuration, channel lifecycle,
  examples, and new language/runtime behavior. The release gate recorded 508
  passing tests with 9 skipped; strict 100x4 was explicitly waived.

## 1.0.9 — 2026-08-21

Built on the 1.0.8 hermetic MCP test foundation.

- Completed REST method compatibility needed by daemon startup and corrected the
  Discord REST v2 request adapter.
- Fixed evaluator member-method binding so native string helpers such as
  `startsWith` work correctly in scripts.
- Made tests hermetic by preventing user-home configuration from affecting test
  connection, daemon, authentication, or port settings.
- Added agent examples for structured announcement planning and prefix-based
  channel cleanup, and expanded exit-code branching guidance across scripts,
  CLI, MCP, and harnesses.

## 1.0.8 — 2026-08-21

Built on the 1.0.7 MCP and daemon release.

- Made MCP end-to-end and CLI mode tests hermetic across CI environments by
  avoiding implicit local Discord credentials and Gateway startup.

## 1.0.7 — 2026-08-21

Built on the 1.0.6 cross-platform configuration release.

- Added MCP server and client modes over stdio, HTTP, and HTTPS.
- Added configurable static, passthrough, and OAuth2 authentication, TLS,
  CORS/origin controls, health checks, bounded concurrency/output, timeouts,
  cancellation, reconnect behavior, and graceful lifecycle cleanup.
- Added MCP discovery metadata, instructions, help resources, prompts, command
  catalogs, resource templates, structured results, scopes, dry-run previews,
  force approval, sanitized errors, and remote capability preflight.
- Added configured stdio MCP clients and remote inspection, invocation, and piped
  Discript execution, with transport/authentication/failure-path integration tests.
- Added a persistent local Gateway broker with `daemon start|status|stop` and
  `--broker` command/script execution.
- Added Gateway startup cleanup, cross-process identify locking, session-limit
  checks, bounded/reset-aware retry behavior, and broker shutdown coordination.
- Added REST transport foundations, REST-first reads, selected safe REST
  mutations, and source execution through REST where supported.
- Added configurable Gateway intents, redacted connection profiles, dual MCP
  HTTP/HTTPS listeners, cross-platform packaging checks, live test-guild gates,
  and MCP deployment/operations/security/release documentation.

## 1.0.6 — 2026-08-19

Built on the 1.0.5 documentation, testing, CRUD, and provisioning release.

- Added user-level `~/.discript.env` configuration with quiet loading, local
  precedence, and Windows/Linux documentation.
- Hardened synchronous Discord login failure handling.
- Corrected local tarball installation and setup documentation cross-platform.
- Completed additional 100x4 coverage for invite, event, and permission handlers.

## 1.0.5 — 2026-08-19

Built on the 1.0.4 decomposed implementation and language baseline.

- Added comprehensive user, developer, operations, MCP, Discord, language, and
  agent documentation with a maintained documentation tree and drift checks.
- Added runnable examples for language fundamentals, Discord CRUD, safety,
  events, optimization, agent workflows, environment variables, and repeatable
  server provisioning.
- Added script environment-variable access, setting, and clearing.
- Added categorized channel provisioning, text/voice channel lifecycle, category
  movement/removal, ordering, permission overwrites, and repeatable deployments.
- Completed supported Discord CRUD coverage for channels, categories, voice
  channels, roles, messages, members, moderation, threads, invites, scheduled
  events, emojis, stickers, webhooks, permissions, and voice controls.
- Added mutation/destructive-action examples, executable documentation examples,
  docs checks in CI, full docs packaging, runtime/CLI integration tests, mutation
  safety tests, and deterministic live `TEST_GUILD` smoke tests with cleanup.
- Fixed Windows path handling in documentation, example, and archive checks.

## 1.0.4 — 2026-08-19

Built on the initial scripting and Discord automation baseline.

- Decomposed parser, evaluator, Discord API, CLI command, and test suites into
  focused one-to-one modules while preserving public entry points.
- Added command catalogs, aliases, validation, preview, dispatch, and
  compatibility-barrel structure.
- Added broad CLI command-handler, Discord capability, permission, and safety
  coverage.
- Added comments, unary/logical expressions, precedence, grouped callbacks,
  `else if`, explicit `await`, and improved callback isolation.
- Completed 100x4 coverage for evaluator expressions, evaluator control flow, and
  Discord safety at the release checkpoint.

## 1.0.3 — 2026-08-19

Built on the first public scoped package release.

- Fixed the Windows package-install smoke check with platform-specific npm and
  CLI command names.

## 1.0.2 — 2026-08-19

Built on the initial public package.

- Moved npm publishing to the public `@eliware/discript` scope because the
  unscoped `discript` name was unavailable.
- Updated package metadata, installation instructions, and release packaging.

## 1.0.1 — 2026-08-19 — Initial baseline

The first public release established Discript as a Discord-focused scripting
language and CLI for developers, AI agents, and coding harnesses.

- One-shot CLI commands with startup, Discord connection, execution, cleanup,
  shutdown, structured results, and stable process exit codes.
- Reusable `.ds` files, inline `--eval`/`-e` source, and stdin scripts.
- Variables, sequential result reuse, structured values, arrays, objects,
  conditionals, comparisons, arithmetic, loops, functions, returns, imports,
  callbacks, async operations, timers, event handlers, and script exit status.
- Environment-variable access for agent-friendly configuration and secret avoidance.
- Direct Discord operations for guilds, channels, messages, members, roles,
  moderation, threads, invites, scheduled events, emojis, stickers, webhooks,
  permission overwrites, and voice operations.
- Dry-run previews and explicit `--yes`/`-y` approval for destructive operations.
- Discord permission, authorization, role-hierarchy, protected-target, and safety
  safeguards across the supported mutation surface.
- Machine-readable JSON/JSONL output, structured errors, diagnostics, stable error
  and exit codes, command discovery, aliases, typo suggestions, and completions.
- Shared runtime/logging foundations from `@eliware/common`, agent examples,
  usage documentation, Git/npm packaging, and gated `TEST_GUILD` live tests.
