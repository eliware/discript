# Safety model

Reads are safe by default. Mutations support previews. Destructive operations require explicit approval at the CLI or inside script options. Validation should precede application, and multi-step workflows should retain IDs to compensate for partial failure.

The same policy applies through direct CLI, stdin, socket, MCP stdio, and MCP HTTP/HTTPS. Agent-facing transports must preserve dry-run previews, force/yes approval, redacted errors, and exit/status semantics.
