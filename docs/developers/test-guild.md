# Test guild

`TEST_GUILD` identifies the disposable Discord guild used for opt-in live testing. It is deliberately separate from the normal example environment. Configure it only in a private local environment and never commit its value or a bot token.

Begin live tests with inventory and read-only checks. For mutations, use dry-run first, scope names and IDs narrowly, and require `--yes`/`-y` or the equivalent script-level approval for destructive work. Clean up resources created by a test and leave the guild in the documented baseline state.

Default unit and docs checks must not contact Discord or read a user's home `.env`. Use injected adapters for deterministic tests. When diagnosing gateway or daemon behavior live, record the transport, intents, process lifecycle, and exit status so a successful API response is not mistaken for a healthy shutdown.
