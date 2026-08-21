# Discript examples

Every `.ds` file in this directory is an executable mini-tutorial. Run one directly with `discript path/to/example.ds`, pipe it through standard input, or submit the source to the MCP `run_discript` tool. Read-only examples are safe starting points; examples that preview or mutate Discord call out their approval requirements in comments.

## Start here

- [Hello world](fundamentals/hello.ds) — the smallest script.
- [Values](fundamentals/values.ds) — literals, arrays, objects, and member access.
- [Functions](fundamentals/functions.ds) — reusable functions and returns.
- [Environment variables](fundamentals/environment.ds) — read, set, and clear process variables.
- [JSON data](fundamentals/json-data.ds) — portable serialization with `json.parse` and `json.stringify`.
- [Exit codes](fundamentals/exit-codes.ds) — agent-friendly status handling.

## Tutorial paths

| Topic | Examples |
| --- | --- |
| Language fundamentals | [conditionals](fundamentals/conditionals.ds), [loops](fundamentals/loops.ds), [while](fundamentals/while.ds), [control-flow safety](fundamentals/control-flow-safety.ds), [callbacks](fundamentals/callbacks.ds), [parallel](fundamentals/parallel.ds), [reduce](fundamentals/reduce.ds), [indexed data](fundamentals/indexed-data.ds), [block comments](fundamentals/block-comments.ds) |
| Agent output | [result envelopes](agents/result-envelope.ds), [branching](agents/branch-on-result.ds), [CI status](agents/ci-status.ds), [sanitized output](agents/sanitized-output.ds), [resource joins](agents/join-resource-data.ds), [JSONL plans](agents/plan-jsonl.ds), [JSONL monitoring](agent/jsonl-monitor.ds) |
| Safety | [preview then apply](safety/preview-then-apply.ds), [idempotent upsert](safety/idempotent-upsert.ds), [permission preflight](safety/permission-preflight.ds), [rollback](safety/rollback-on-failure.ds), [safe channel workflow](safe-channel-workflow.ds) |
| Discord reads | [guild summary](discord/guild-summary.ds), [member report](discord/member-report.ds), [roles and members](discord/roles-and-members.ds), [emoji/sticker inventory](discord/emoji-sticker-inventory.ds), [voice status](discord/voice-status.ds) |
| Discord lifecycle | [message CRUD](discord/message-crud.ds), [message actions](discord/message-actions.ds), [role lifecycle](discord/role-lifecycle.ds), [member roles](discord/member-roles.ds), [thread lifecycle](discord/thread-lifecycle.ds), [webhook lifecycle](discord/webhook-lifecycle.ds), [invite lifecycle](discord/invite-lifecycle.ds), [scheduled events](discord/scheduled-event-lifecycle.ds), [voice session plan](discord/voice-session-plan.ds) |
| Provisioning and operations | [server provisioning](discord/server-provisioning.ds), [channel reordering](discord/channel-reordering.ds), [server verification](discord/server-verification.ds), [incident snapshot](use-cases/incident-snapshot.ds), [configuration diff](use-cases/config-diff.ds) |
| Events | [multiple handlers](events/multiple-handlers.ds), [message monitor](events/message-monitor.ds), [heartbeat](events/heartbeat.ds), [JSONL event output](events/event-jsonl-output.ds), [cancellable monitor](events/cancellable-monitor.ds) |
| MCP and transports | [remote inventory](mcp/remote-inventory.ds), [discover before run](mcp/discover-before-run.ds), [dry-run plan](mcp/run-dry-plan.ds), [approved mutation](mcp/approved-remote-mutation.ds), [hybrid daemon](mcp/hybrid-daemon-workflow.ds), [remote errors](mcp/remote-error-handling.ds), [client profile](config/mcp-client-profile.ds) |
| Optimization | [sequential versus parallel](optimization/sequential-vs-parallel.ds), [cached lookups](optimization/cache-lookups.ds), [REST-first inventory](optimization/rest-first-inventory.ds), [bounded batches](optimization/bounded-batch.ds), [compact output](optimization/compact-agent-output.ds) |
| Composition | [imported functions](composition/imported-functions.ds), [shared formatting](shared/format.ds) |

Additional focused recipes include [async/await](fundamentals/async-await.ds), [object projection](fundamentals/object-projection.ds), [approval reports](agents/approval-report.ds), [resource selection](agents/resource-selection.ds), [destructive confirmation](safety/destructive-confirmation.ds), [missing-target recovery](safety/missing-target-recovery.ds), [role policy reports](use-cases/role-policy-report.ds), [channel policy reports](use-cases/channel-policy-report.ds), [backup manifests](use-cases/backup-manifest.ds), [read-only plans](optimization/read-only-plan.ds), and [timer plus event workflows](events/timer-and-event.ds).

## Safety reminder

Examples using `dryRun: true` produce plans without changing Discord. Destructive operations require `force: true` in source or `--yes`/`-y` at the CLI. Use `TEST_GUILD` and explicit target IDs while learning.
