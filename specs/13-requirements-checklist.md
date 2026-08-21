# Discript Requirements Checklist

Each line represents one requirement and is marked `Fully complete`, `Half complete`, or `Not started`.

- [Fully complete] Discript provides a Discord-focused scripting language.
- [Fully complete] Discript runs as a command-line tool.
- [Fully complete] Discript supports one-shot startup, connection, execution, shutdown, and exit.
- [Fully complete] Discript executes reusable script files, including nested imports resolved relative to each importing file.
- [Fully complete] Discript accepts inline source with `--eval` / `-e`.
- [Fully complete] Discript accepts source through standard input.
- [Fully complete] Discript supports direct resource-operation commands.
- [Fully complete] Discript supports variables and sequential result reuse.
- [Fully complete] Discript scripts can read, set, and clear Node process environment variables through the `env` standard library object.
- [Fully complete] Discript supports structured values, arrays, objects, basic collection helpers, and bounded `for-in` iteration.
- [Fully complete] Discript supports asynchronous operations.
- [Fully complete] Discript supports explicit async helpers including `sleep` and `parallel`.
- [Fully complete] Discript supports conditionals, comparisons, arithmetic, bounded `while` loops, and bounded `for-in` loops.
- [Fully complete] Discript supports arrow callback syntax, callback blocks, and general-purpose async `map`, `filter`, and `reduce` helpers.
- [Fully complete] Discript supports array indexes, computed member access, and assignment to variables, members, and indexes.
- [Fully complete] Discript supports compound assignment, modulo, exponentiation, and null-coalescing operators.
- [Fully complete] Discript supports `break`, `continue`, `throw`, `try/catch/finally`, and reverse-order deferred cleanup callbacks.
- [Fully complete] Discript exposes positional script arguments through the `args` array for file, inline, and stdin execution.
- [Fully complete] Discript supports explicit named exports and aliased imports while preserving legacy shared-scope imports.
- [Fully complete] Discript provides bounded `length`, `keys`, `values`, `range`, `now`, `race`, `allSettled`, and `mapLimit` helpers.
- [Fully complete] Parser tokens and syntax failures include source location metadata when a source position is available.
- [Fully complete] Discript supports lazy conditional expressions and optional member, index, and call access.
- [Fully complete] Discript supports array and object spread expressions with non-mutating composition.
- [Fully complete] Discript supports reusable `fn` functions, `return`, and shared-scope source imports.
- [Fully complete] Discript supports event listener declarations with `on("event") { ... }`, payload binding, persistent runtime wait, and signal-based cleanup.
- [Fully complete] Discript supports `every` and `after` timers, intentional long-running execution, and timer cleanup during shutdown.
- [Fully complete] Finite CLI executions shut down their Discord client.
- [Fully complete] Discript supports API-level and direct CLI dry-run previews with command-field validation, plus opt-in connected target/permission validation via `--validate`; no mutation is made.
- [Fully complete] Destructive operations require explicit `--yes`/`-y` CLI approval or `force: true` inside scripts across the current mutation surface.
- [Fully complete] CLI commands return stable process exit codes, including structured invalid-input failures on stderr.
- [Fully complete] Scripts can capture operation exit codes and branch on them internally.
- [Fully complete] Scripts can explicitly terminate with a chosen exit code and message, including termination that cannot be swallowed by `try` recovery.
- [Fully complete] Discript emits machine-readable JSON results and structured JSON errors on stderr.
- [Fully complete] Discript emits opt-in structured JSONL records with `--output jsonl`, including incremental script output.
- [Fully complete] Discript covers guilds, channels, messages, members, roles, and basic moderation.
- [Fully complete] Channel provisioning supports text, voice, and category creation, parent assignment/removal, and explicit position changes through scripts and CLI options.
- [Fully complete] Discript covers threads, invites, emoji/sticker lifecycle operations, scheduled events, guarded voice join/leave/status operations, and member voice controls.
- [Fully complete] Discript exposes normalized bot identity through the API and `bot get` command.
- [Fully complete] Discript enforces Discord permissions and authorization safeguards across current mutation groups, including messages, threads, webhooks, invites, roles, moderation, channels, events, expressions, and voice/member controls.
- [Fully complete] Discript enforces protected-role, permission, role-hierarchy, and moderation-target safeguards for the current mutation groups.
- [Fully complete] Discript uses `@eliware/common` for shared lifecycle and logging foundations.
- [Fully complete] Discript has a `TEST_GUILD` configuration value.
- [Fully complete] Discript has gated read-only live Discord tests scoped to `TEST_GUILD`, and each smoke case passes when enabled.
- [Fully complete] Discript has gated reversible mutation tests scoped to `TEST_GUILD` with cleanup; the mutation suite is present and cleanup is guaranteed, pending its separately opt-in destructive run.
- [Fully complete] Discript provides agent-oriented structured errors and diagnostics, including stable exit codes and sanitized Discord API metadata in JSON errors.
- [Fully complete] Discript provides command discovery, common aliases, typo suggestions, and Bash/Zsh/Fish shell completions.
- [Fully complete] Discript has unit and integration tests for the current parser, runtime, CLI, command handlers, safety matrix, and capabilities.
- [Fully complete] The parser and command-discovery modules each achieve 100% statements, branches, functions, and lines coverage.
- [Fully complete] Discript has agent-focused examples and usage documentation covering discovery, guarded mutation workflows, exit handling, events, timers, callbacks, imports, and JSONL output.
- [Fully complete] Discript is packaged as a public installable CLI through npm, Git SSH, or `npm pack`, with an automated isolated tarball-install smoke check and tag-triggered provenance publishing.

## Release and project completion status

- [Fully complete] Repository visibility is public on GitHub.
- [Fully complete] Main-branch CI passes on Ubuntu and Windows for the last pushed checkpoint.
- [Fully complete] The latest release commit was pushed and validated by GitHub Actions on Ubuntu and Windows.
- [Fully complete] The package is configured as public `@eliware/discript` with `publishConfig.access=public`; the current repository version is `1.0.9` and the release workflow validates tarball installation before publishing.
- [Fully complete] Resolve public npm registry visibility for the published scoped package.
- [Fully complete] Run release validation for the post-1.0.3 local changes; subsequent local changes continue to pass package, docs, lint, and CI validation.
- [Fully complete] Push the accumulated local release-ready commits after approval.
- [Fully complete] Publish and verify the next npm patch release after npm visibility is resolved.

## Current verification evidence

- [Fully complete] `npm test` passes with 471 tests passed and 9 skipped at the latest local checkpoint.
- [Fully complete] `npm run docs:check` passes with 114 Markdown files, 66 CLI commands, and 148 parsed examples at the latest local checkpoint.
- [Fully complete] `npm run package:check` passes with an isolated tarball install and packaged `docs/README.md` assertion.
- [Fully complete] CI runs `npm run docs:check` before tests on both configured operating systems.
- [Fully complete] Executable documentation tests parse every `.ds` example and execute representative fundamentals.
- [Fully complete] CLI command-handler modules have direct operation-level coverage; the command-handler scope reports 100% statements, functions, and lines, with remaining branch gaps in validation/preview/catalog paths.
- [Fully complete] The live read-only smoke cases were individually verified against the configured `TEST_GUILD`, including guild lookup, runtime lifecycle, dry-run validation, protected moderation, webhook/permission reads, and voice status.
