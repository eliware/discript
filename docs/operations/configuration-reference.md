# Configuration reference

Configuration comes from the process environment and `.env` loading. `DISCORD_TOKEN` is required for connection; `TEST_GUILD` scopes examples/tests; `DISCRIPT_LIVE` and `DISCRIPT_LIVE_MUTATIONS` opt into live test suites. Script-defined variables are process-local.

## MCP server profile

Set `DISCRIPT_CONNECTION_MODE=daemon` and `DISCRIPT_DAEMON_MODE=mcp` to start the configured MCP listener with `discript daemon start`. Use `DISCRIPT_MCP_TRANSPORT=http` or `https`, `DISCRIPT_MCP_PORT` for the primary listener, and `DISCRIPT_MCP_HTTP_PORT`/`DISCRIPT_MCP_HTTPS_PORT` for separate listeners and redirects. HTTPS requires `DISCRIPT_MCP_TLS_KEY_FILE` and `DISCRIPT_MCP_TLS_CERT_FILE`.

Select `DISCRIPT_MCP_AUTH_MODE=none`, `static`, `bearer-passthrough`, or `oauth2`. OAuth2 additionally requires issuer, resource, and introspection endpoint settings. `DISCRIPT_MCP_ALLOWED_ORIGINS` is a comma-separated CORS allowlist.

## MCP client profile

Set `DISCRIPT_CONNECTION_MODE=mcp-client` with `DISCRIPT_CLIENT_URL` for HTTP/HTTPS/SSE, or `DISCRIPT_CLIENT_TRANSPORT=stdio` with `DISCRIPT_CLIENT_COMMAND` and JSON `DISCRIPT_CLIENT_ARGS`. `DISCRIPT_CLIENT_TOKEN` and JSON `DISCRIPT_CLIENT_HEADERS` configure authentication. Reconnect, timeout, and output-size settings bound remote work.
