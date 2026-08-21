# MCP operations and release checklist

Use this checklist before exposing a Discript MCP server or publishing a release.

## Deployment

- [ ] Store `DISCORD_TOKEN`, MCP bearer tokens, OAuth client secrets, and TLS private keys in a secret manager or protected service environment.
- [ ] Bind unauthenticated MCP only to stdio or a trusted loopback/private boundary.
- [ ] Use HTTPS with a valid certificate for remote callers; verify the certificate chain from every client.
- [ ] Configure an explicit `DISCRIPT_MCP_ALLOWED_ORIGINS` list when browser-based callers are possible.
- [ ] Configure OAuth issuer, resource, introspection endpoint, and least-privilege scopes when using OAuth2.
- [ ] Grant only the Discord intents and permissions required by the deployed workflows.

## Runtime operations

- [ ] Check `GET /healthz` after startup and after certificate, proxy, or configuration changes.
- [ ] Monitor authentication failures, queue saturation, execution timeouts, output-limit failures, and nonzero exit codes.
- [ ] Keep `DISCRIPT_MCP_MAX_CONCURRENT`, `DISCRIPT_MCP_MAX_PENDING`, and execution timeouts bounded.
- [ ] Stop the daemon gracefully so MCP, broker, Discord runtime, and child clients can close cleanly.
- [ ] Exercise read-only discovery and a dry-run before approving a mutation; require `force`/`-y` for destructive work.
- [ ] Rotate certificates and bearer/OAuth credentials using an overlap or rollback plan.

## Lifecycle and failure recovery

- Start the configured MCP listener only after configuration validation and TLS material checks succeed; a failed listener startup must close the broker/runtime it acquired.
- Treat `/healthz` as readiness for the MCP listener and shared Discord runtime, not as an authorization bypass for tool calls.
- Retry transient Discord gateway startup failures according to the gateway retry policy; do not blindly retry invalid credentials, intents, or TLS configuration.
- On request timeout, queue overflow, authentication failure, or output-limit failure, return a structured error and keep unrelated requests alive.
- On graceful shutdown, stop accepting new MCP requests, close MCP transports, close the broker, destroy the Discord client, and remove the local socket.
- After an abnormal exit, verify the health endpoint, socket/path availability, and logs before restarting; use bounded restart backoff.

## Release gates

- [ ] Run `npm test`, `npm run test:mcp`, `npm run lint`, and `npm run docs:check`.
- [ ] Run `npm run pack` and `npm run pack:check`; confirm MCP sources, docs, examples, and `SPEC.md` are packaged.
- [ ] Review `discript config --json` for complete redaction before sharing diagnostics.
- [ ] Verify no tokens, secrets, private keys, or sensitive tool arguments appear in logs, fixtures, examples, or the tarball.
- [ ] Record the commit, package version, test result, and deployment configuration used for the release.
