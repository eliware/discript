# Compatibility

The package requires Node.js 26 or newer and tracks Discord.js behavior through the adapter layer. Changes to command output, error codes, safety requirements, or language syntax should be treated as compatibility-sensitive and documented.

MCP behavior targets stable initialization, tools, resources, prompts, Streamable HTTP, SSE, and stdio capabilities exposed by the installed SDKs. Draft or future discovery methods remain optional and must not replace normal initialization. Pin and test the MCP server, client, and SDK packages together when changing protocol behavior.
