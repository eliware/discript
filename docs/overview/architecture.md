# Architecture overview

The CLI selects direct-command or script execution. Both paths use the runtime for configuration, Discord connection, API access, output, exit status, and shutdown. The parser produces an AST, the evaluator executes it, and the Discord adapter normalizes resource operations and safety decisions.

The runtime can own one long-lived gateway session while serving local socket clients and MCP clients concurrently. Direct CLI mode is one-shot; daemon mode is supervised; MCP stdio is a child-process transport; MCP HTTP/HTTPS is remote. See the [developer architecture guide](../developers/architecture.md).
