# Environment variables

Discript reads the process environment and the user's private environment file, commonly `~/.discript.env` (with a platform-appropriate home directory). Scripts can read `env.NAME`, call `env.get()`, set values with `env.set()`, and clear them with `env.clear()`.

Use environment variables for tokens, guild IDs, connection mode, MCP endpoint, TLS, and approval policy. Never commit secrets or put them in script source. See [configuration](../getting-started/configuration.md) and `.env.example`.
