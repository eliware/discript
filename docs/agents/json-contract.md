# JSON contract

Use `--json` when an agent needs deterministic machine-readable output. Return structured success or error data with stable operation context, resource IDs where relevant, and the engine's exit/status code; keep human prose out of JSON fields intended for parsing.

Redact tokens, authorization headers, webhook URLs, and private configuration. Preserve dry-run previews and approval failures as explicit statuses so an agent can branch safely. See [CLI JSON output](../cli/json-output.md), [exit-code branching](exit-code-branching.md), and [stdin protocol](stdin-protocol.md).
