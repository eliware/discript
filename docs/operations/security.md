# Security

- Keep `DISCORD_TOKEN` out of source, examples, logs, and JSON output.
- Grant the bot only the intents and Discord permissions required by the workflow.
- Use `TEST_GUILD` for live mutation tests and isolate it from production.
- Preview mutations before applying them.
- Require explicit approval for destructive actions.
- Treat generated scripts as code with the same authority as the invoking process.
- Sanitize IDs and request metadata before sending output to external agent logs.

If a token is exposed, revoke it in Discord immediately and replace all dependent secrets.

