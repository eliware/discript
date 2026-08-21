# Security

- Keep `DISCORD_TOKEN` out of source, examples, logs, and JSON output.
- Grant the bot only the intents and Discord permissions required by the workflow.
- Use `TEST_GUILD` for live mutation tests and isolate it from production.
- Preview mutations before applying them.
- Require explicit approval for destructive actions.
- Treat generated scripts as code with the same authority as the invoking process.
- Sanitize IDs and request metadata before sending output to external agent logs.

If a token is exposed, revoke it in Discord immediately and replace all dependent secrets.

## MCP deployments

Use stdio or loopback HTTP for local development. For remote MCP, prefer HTTPS with a valid certificate, an explicit `allowedOrigins` list, and an authentication mode other than `none`. `auth.mode=none` is appropriate only behind a trusted local boundary.

Static bearer authentication suits a single trusted integration. Bearer-passthrough is for an upstream gateway that has already authenticated the request. OAuth2 validates issuer, resource/audience, expiry, bearer type, and required scopes through the configured introspection endpoint.

Keep MCP bearer tokens, OAuth client secrets, TLS private keys, and remote client tokens in the user environment or a secret manager. `discript config` redacts these values, but operators must still prevent shell-history and process-environment leakage.

Stdio client mode launches the configured command with the current process authority. Treat `DISCRIPT_CLIENT_COMMAND` as executable configuration, use a trusted absolute path in production, and never accept it from untrusted input. Remote HTTP callers can invoke Discord mutations, so apply least-privilege Discord permissions and preserve dry-run/force approval at the tool boundary.
