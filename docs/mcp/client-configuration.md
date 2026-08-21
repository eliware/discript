# MCP client configuration

HTTP, HTTPS, and SSE clients use a URL:

```dotenv
DISCRIPT_CONNECTION_MODE=mcp-client
DISCRIPT_CLIENT_URL=https://mcp.example.com/mcp
DISCRIPT_CLIENT_TRANSPORT=https
DISCRIPT_CLIENT_TOKEN=replace-me
DISCRIPT_CLIENT_TIMEOUT=300000
DISCRIPT_CLIENT_MAX_OUTPUT_BYTES=1048576
```

Stdio clients launch a trusted local process:

```dotenv
DISCRIPT_CONNECTION_MODE=mcp-client
DISCRIPT_CLIENT_TRANSPORT=stdio
DISCRIPT_CLIENT_COMMAND=discript
DISCRIPT_CLIENT_ARGS=["mcp","--stdio"]
```

Inspect capabilities with `discript mcp-client inspect`, list individual capability classes with `list-tools`, `list-resources`, or `list-prompts`, and invoke them with `call`, `read-resource`, or `get-prompt`. Use `run` with stdin to stream source without creating a temporary file.

The programmatic `runRemoteDiscript()` API returns normalized Discript JSON: `{ ok, requestId, exitCode, value, warnings, diagnostics }` for successful execution. Remote failures preserve the Discript error code and exit code. The CLI applies its normal human-readable, JSON, or JSONL formatting locally; it does not expose raw MCP envelopes as the execution contract.
