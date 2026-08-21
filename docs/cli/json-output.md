# JSON output

Use `--json` when another program or agent consumes one result. Human-readable output is intended for terminals; JSON keeps values, IDs, and errors machine-readable.

```sh
discript guilds list --json
discript channels list --guild "$TEST_GUILD" --json
```

Use `--output jsonl` when a script emits multiple records with `print()`. Each record is written as one JSON object per line, making it suitable for pipes and incremental consumers.

```sh
cat examples/agents/plan-jsonl.ds | discript --output jsonl
```

Treat IDs as strings. On failure, inspect stderr and the process exit code; JSON errors contain a stable `code` and `exitCode`. See [the JSON contract](json-contract.md) and [the JSONL example](../../examples/agent/jsonl-monitor.ds).

