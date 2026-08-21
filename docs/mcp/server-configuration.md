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

HTTPS transport is exercised with real TLS key and certificate files in the integration suite. Certificate verification remains a client-side trust decision; production clients should validate the certificate chain rather than disable verification.

The listener also exposes a read-only `GET /healthz` endpoint. It reports the service name and whether the shared Discord runtime is ready; it does not require MCP tool authentication and should be protected by the network boundary when exposed beyond localhost.

When an authenticated request includes OAuth scopes, `run_discript` maps execution intent to conventional scopes: `discord:read` for inventory and previews, `discord:write` for approved non-destructive mutations, and `discord:admin` for force-approved destructive operations. Configure the OAuth resource server's required baseline scopes accordingly; static bearer authentication remains compatible with deployments that do not provide scope claims.
