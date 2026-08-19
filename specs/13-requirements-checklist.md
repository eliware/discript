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
- [Fully complete] Discript supports structured values, arrays, objects, basic collection helpers, and bounded `for-in` iteration.
- [Fully complete] Discript supports asynchronous operations.
- [Fully complete] Discript supports explicit async helpers including `sleep` and `parallel`.
- [Fully complete] Discript supports conditionals, comparisons, arithmetic, bounded `while` loops, and bounded `for-in` loops.
- [Fully complete] Discript supports arrow callback syntax, callback blocks, and general-purpose async `map`, `filter`, and `reduce` helpers.
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
- [Fully complete] Discript covers threads, invites, emoji/sticker lifecycle operations, scheduled events, guarded voice join/leave/status operations, and member voice controls.
- [Fully complete] Discript exposes normalized bot identity through the API and `bot get` command.
- [Fully complete] Discript enforces Discord permissions and authorization safeguards across current mutation groups, including messages, threads, webhooks, invites, roles, moderation, channels, events, expressions, and voice/member controls.
- [Fully complete] Discript enforces protected-role, permission, role-hierarchy, and moderation-target safeguards for the current mutation groups.
- [Fully complete] Discript uses `@eliware/common` for shared lifecycle and logging foundations.
- [Fully complete] Discript has a `TEST_GUILD` configuration value.
- [Fully complete] Discript has gated read-only live Discord tests, currently passing against `TEST_GUILD`.
- [Fully complete] Discript has gated reversible mutation tests scoped to `TEST_GUILD`, currently passing with cleanup.
- [Fully complete] Discript provides agent-oriented structured errors and diagnostics, including stable exit codes and sanitized Discord API metadata in JSON errors.
- [Fully complete] Discript provides command discovery, common aliases, typo suggestions, and Bash/Zsh/Fish shell completions.
- [Fully complete] Discript has unit tests for the current parser, runtime, CLI, and capabilities.
- [Fully complete] The parser and command-discovery modules each achieve 100% statements, branches, functions, and lines coverage.
- [Fully complete] Discript has agent-focused examples and usage documentation covering discovery, guarded mutation workflows, exit handling, events, timers, callbacks, imports, and JSONL output.
- [Fully complete] Discript is packaged as a public installable CLI through npm, Git SSH, or `npm pack`, with an automated isolated tarball-install smoke check and tag-triggered provenance publishing.

## Release and project completion status

- [Fully complete] Repository visibility is public on GitHub.
- [Fully complete] Main-branch CI passes on Ubuntu and Windows for the last pushed checkpoint.
- [Fully complete] The latest release commit was pushed and validated by GitHub Actions on Ubuntu and Windows.
- [Fully complete] `@eliware/discript@1.0.3` was accepted by the npm publish workflow and is publicly visible through the anonymous npm registry.
- [Fully complete] Resolve public npm registry visibility for the published scoped package.
- [Fully complete] Run release validation for the post-1.0.3 local changes.
- [Fully complete] Push the accumulated local release-ready commits after approval.
- [Fully complete] Publish and verify the next npm patch release after npm visibility is resolved.
