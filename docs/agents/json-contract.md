# JSON contract

Use JSON output for machine consumers. Keep human messages out of the data channel when using `--json`; use `--output jsonl` when a script emits multiple independent values. Consumers should inspect both process exit status and the returned `code`/`exitCode` fields.

Do not parse pretty output. Treat Discord IDs as strings, preserve them without numeric conversion, and record the original operation alongside returned resource IDs when building an audit trail.

