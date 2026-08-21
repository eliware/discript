# Debugging Discript

Reproduce the smallest failing invocation first. Prefer an inline or stdin script, `--json` output, and a dry-run for mutations. Record the connection mode, command, exit status, and sanitized error payload; never include `DISCORD_TOKEN` or bearer credentials in reports.

For gateway issues, check configured intents, login readiness, reconnect behavior, and whether another process owns the configured session. For daemon issues, check the systemd or foreground logs, socket permissions, endpoint and TLS settings, and whether the client is using the intended transport. MCP failures should be reduced to a single initialize request followed by one tool call.

Use `TEST_GUILD` for safe live diagnostics and begin with read-only inventory. Unit tests should inject a fake Discord adapter instead of depending on that guild. After a failure, verify that the process exits or releases its client cleanly; a hung Node process is a lifecycle bug even if the command succeeded.
