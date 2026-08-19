# Machine-readable output contract

Use `--json` for one JSON value or `--output jsonl` for one JSON value per emitted script result. Do not parse pretty or default human output in an automation harness.

## Success

The success payload is the command or script result itself. The shape depends on the operation:

```json
{"id":"1539727398747250768","name":"general","type":0}
```

Lists are JSON arrays:

```json
[{"id":"1","name":"general","type":0}]
```

Mutation results use stable flags where applicable:

```json
{"id":"123","name":"staging","created":true}
{"id":"123","deleted":true}
{"dryRun":true,"guildId":"456","name":"staging","type":"text"}
```

Consumers should preserve unknown fields and treat Discord IDs as strings.

## Errors

JSON errors have this base shape:

```json
{
  "error":"Channel not found: 123",
  "code":"CHANNEL_NOT_FOUND",
  "exitCode":1
}
```

Optional sanitized details may include only these fields:

```json
{
  "error":"Missing Access",
  "code":"DISCORD_API_ERROR",
  "exitCode":5,
  "details":{
    "discordCode":50001,
    "status":403,
    "method":"GET",
    "path":"/guilds/123"
  }
}
```

Unknown command suggestions appear as `details.suggestions`. Secrets and arbitrary error properties are removed before output.

## JSONL

In JSONL mode each `print(value)` emits exactly one line. An undefined value is emitted as `null`:

```text
print({step: "inventory"})
print({step: "complete"})
```

```jsonl
{"step":"inventory"}
{"step":"complete"}
```

## Dry-run payloads

Direct commands use `--dry-run` and return a plan containing `dryRun`, `action`, `command`, and `parameters` after local validation. Script API calls return operation-specific preview objects. A preview is not a transaction or guarantee of later success; state and permissions can change before apply.

## Process status

The process status and JSON `exitCode` communicate the same failure class. Standard statuses are `0` success, `1` resource/runtime failure, `2` invalid input, `3` parse failure, `4` missing authentication, `5` Discord/API or permission failure, and `6` timeout. Scripts may intentionally return other statuses with `exit(code, message)`.

## Consumer guidance

1. Read stdout as JSON only when the command succeeded or when the error path explicitly promises JSON.
2. Check the process status before treating a result as successful.
3. Branch on `code`/`exitCode`, not message text.
4. Preserve IDs as strings.
5. Redact message content, paths, and resource metadata as appropriate for the agent transcript.
