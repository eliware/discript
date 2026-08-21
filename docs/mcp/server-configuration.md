# MCP server configuration

Use the profile in `.env` or `~/.discript.env`:

```dotenv
DISCRIPT_CONNECTION_MODE=daemon
DISCRIPT_DAEMON_MODE=mcp
DISCRIPT_MCP_TRANSPORT=https
DISCRIPT_MCP_PORT=8443
DISCRIPT_MCP_TLS_KEY_FILE=/run/secrets/mcp.key
DISCRIPT_MCP_TLS_CERT_FILE=/run/secrets/mcp.crt
DISCRIPT_MCP_AUTH_MODE=static
DISCRIPT_MCP_AUTH_TOKEN=replace-me
DISCRIPT_MCP_ALLOWED_ORIGINS=https://agent.example.com
```

Start the configured profile with:

```sh
discript daemon start
```

For OAuth2, set `DISCRIPT_MCP_AUTH_MODE=oauth2` and provide issuer, resource, introspection endpoint, and (when required by the provider) client credentials. For HTTP-to-HTTPS redirects, configure both `DISCRIPT_MCP_HTTP_PORT` and `DISCRIPT_MCP_HTTPS_PORT` and set `DISCRIPT_MCP_HTTP_REDIRECT=true`.
