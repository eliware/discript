# Exit-code branching

Exit codes let a script communicate a deliberate decision to a shell, coding
harness, or MCP client without requiring the caller to parse prose. Use them
for workflow outcomes, not as a replacement for the structured result object.

## Script-level exits

Call `exit(code, message)` from a `.ds` script. It stops the current script
immediately and carries the code and optional message to the CLI/runtime:

```ds
guildId = env.TEST_GUILD
if (guildId == null) {
  exit(2, "TEST_GUILD is required")
}

preview = discord.guilds.get(guildId).channels.list()
if (preview == null) {
  exit(1, "guild inventory was unavailable")
}

print({ok: true, guild: guildId, channels: preview})
```

The code may be any integer. Keep application-defined values documented and
consistent; avoid colliding with the standard process statuses.

## Recommended status map

| Code | Meaning | Typical agent action |
| ---: | --- | --- |
| `0` | Completed successfully | Continue the workflow. |
| `1` | Runtime or resource failure | Inspect the error and stop or retry carefully. |
| `2` | Invalid input, missing configuration, or approval missing | Correct inputs or request approval. |
| `3` | Parse or language failure | Repair the generated script. |
| `4` | Missing or invalid authentication/configuration | Fix credentials or connection settings. |
| `5` | Discord API, permission, or hierarchy failure | Recheck permissions and target state. |
| `6` | Timeout or gateway availability failure | Retry with backoff after checking state. |
| `10` and above | Workflow-specific decision | Follow the script or application’s documented branch. |

For example, a compensating cleanup can report a distinct result:

```ds
created = []
try {
  // provisioning steps append created resource IDs here
  print({status: "applied", created: created})
} catch (error) {
  // cleanup can run here when the workflow supports compensation
  exit(10, "apply failed; compensation completed")
}
```

## Branching inside a script

Use a returned object when the script needs to continue through several
decision branches. Reserve `exit()` for the point where the whole script
should stop:

```ds
check = {ok: true, exitCode: 0, value: "ready"}

if (check.exitCode != 0) {
  exit(check.exitCode, "validation failed")
}

if (check.ok) {
  print({next: "apply", value: check.value})
} else {
  print({next: "inspect", value: check.value})
}
```

Use `try { ... } catch (error) { ... }` when a recoverable operation should
produce a structured branch result. The caught value contains normalized
`code`, `message`, and `exitCode` fields.

## CLI and MCP behavior

The CLI process exits with the script’s final status. With `--json`, machine
consumers should inspect both the process status and the JSON `exitCode`.
For a normal success, the result has `exitCode: 0`; an intentional
`ScriptExit` preserves the chosen nonzero code and message.

An MCP `run_discript` response preserves the same contract in its structured
result: `ok`, `requestId`, `exitCode`, and either `value` or normalized error
fields. A remote caller should branch on `code` and `exitCode`, not on the
human-readable message.

## Harness guidance

1. Capture stdout/JSON and the process exit status.
2. Treat `0` as success only after checking `ok` and required result fields.
3. Treat `2` as an input or approval prompt, not an automatic retry.
4. Retry transient gateway/API failures only after inventorying state; a
   timeout may occur after Discord accepted a mutation.
5. Preserve `requestId`, target IDs, and the chosen branch in the agent log.

See [exit statuses](../cli/exit-statuses.md), [JSON contract](../cli/json-contract.md),
and [the executable example](../../examples/fundamentals/exit-codes.ds).
