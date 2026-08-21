# MCP deployment examples

These profiles are starting points. Keep secrets in `~/.discript.env`, a secret manager, or the service environment; do not commit the values shown here.

## Local stdio

Use stdio when an agent launches Discript on the same machine. No network listener or MCP token is needed:

```dotenv
DISCRIPT_CONNECTION_MODE=direct
DISCRIPT_CLIENT_TRANSPORT=stdio
DISCRIPT_CLIENT_COMMAND=discript
DISCRIPT_CLIENT_ARGS=["mcp","--stdio"]
```

## Private loopback HTTP

Use unauthenticated HTTP only when the listener is bound to a trusted local boundary:

```dotenv
DISCRIPT_CONNECTION_MODE=daemon
DISCRIPT_DAEMON_MODE=mcp
DISCRIPT_MCP_TRANSPORT=http
DISCRIPT_MCP_HOST=127.0.0.1
DISCRIPT_MCP_PORT=8765
DISCRIPT_MCP_AUTH_MODE=none
DISCRIPT_MCP_ALLOWED_ORIGINS=http://127.0.0.1:3000
```

## HTTPS with static bearer authentication

Use mounted certificate files and a long random bearer token for a private integration:

```dotenv
DISCRIPT_CONNECTION_MODE=daemon
DISCRIPT_DAEMON_MODE=mcp
DISCRIPT_MCP_TRANSPORT=https
DISCRIPT_MCP_PORT=8443
DISCRIPT_MCP_TLS_KEY_FILE=/run/secrets/discript-mcp.key
DISCRIPT_MCP_TLS_CERT_FILE=/run/secrets/discript-mcp.crt
DISCRIPT_MCP_AUTH_MODE=static
DISCRIPT_MCP_AUTH_TOKEN=read-from-a-secret-manager
DISCRIPT_MCP_ALLOWED_ORIGINS=https://agent.example.com
```

Clients must validate the certificate chain. Do not disable TLS verification in production. Rotate the certificate and bearer token independently, and restrict the listener with a firewall or reverse proxy.

## HTTPS with OAuth2 introspection

Use OAuth2 when multiple agents or an identity provider must issue scoped access tokens:

```dotenv
DISCRIPT_CONNECTION_MODE=daemon
DISCRIPT_DAEMON_MODE=mcp
DISCRIPT_MCP_TRANSPORT=https
DISCRIPT_MCP_PORT=8443
DISCRIPT_MCP_TLS_KEY_FILE=/run/secrets/discript-mcp.key
DISCRIPT_MCP_TLS_CERT_FILE=/run/secrets/discript-mcp.crt
DISCRIPT_MCP_AUTH_MODE=oauth2
DISCRIPT_MCP_OAUTH_ISSUER=https://login.example.com/
DISCRIPT_MCP_OAUTH_RESOURCE=https://discript.example.com/mcp
DISCRIPT_MCP_OAUTH_INTROSPECTION_ENDPOINT=https://login.example.com/oauth2/introspect
DISCRIPT_MCP_OAUTH_CLIENT_ID=discript-introspection
DISCRIPT_MCP_OAUTH_CLIENT_SECRET=read-from-a-secret-manager
DISCRIPT_MCP_OAUTH_REQUIRED_SCOPES=discord:read
DISCRIPT_MCP_ALLOWED_ORIGINS=https://agent.example.com
```

Discript maps authenticated execution to `discord:read`, `discord:write`, and `discord:admin`. Grant only the baseline scopes appropriate to the deployment; force-approved destructive operations require the administrative scope.

Start any configured server profile with:

```sh
discript daemon start
```

Verify readiness without invoking a Discord mutation:

```sh
curl --fail https://discript.example.com:8443/healthz
```
