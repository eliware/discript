# Troubleshooting

If startup fails, check the token, requested intents, Node version, and configuration precedence. If a command hangs, determine whether a listener, timer, daemon connection, or MCP child process is intentionally keeping the runtime alive; capture logs and verify shutdown handles are released.

Reduce failures to one read-only command, use `--json`, and record the exit code without exposing secrets. For live diagnostics use `TEST_GUILD`; for daemon issues check the socket or MCP endpoint, TLS files, authentication mode, and service logs. See [debugging](../developers/debugging.md) and [operations monitoring](../operations/monitoring.md).
