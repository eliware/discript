# Security boundaries

Discript scripts execute with the authority of the configured Discord bot and Node process. They are not sandboxed: scripts can read and write environment variables, load imported files, and mutate Discord when approved.

Review generated source before execution. Keep Discord tokens, MCP bearer tokens, OAuth credentials, and TLS keys outside scripts and result objects. Use a dedicated least-privilege bot and a test guild while developing.

Use stdio or loopback HTTP locally. For remote MCP use HTTPS, authentication, an explicit origin policy, and a firewall or reverse proxy. Unauthenticated HTTP is appropriate only behind a trusted private boundary. In hybrid mode, the socket is local and MCP is remote.

See [production security](../operations/security.md), [MCP server configuration](../mcp/server-configuration.md), and [sanitized-output.ds](../../examples/agents/sanitized-output.ds).

