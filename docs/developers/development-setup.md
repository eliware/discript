# Development setup

Discript is an ESM Node.js package. From `/opt/discript`, install dependencies and run the local checks:

```bash
npm install
npm test
npm run docs:check
```

Create a private local environment outside the repository, such as `~/.discript.env`, with a bot token and only the intents and connection settings needed for development. Keep `.env.example` current, but never commit a real token. Use `TEST_GUILD` for opt-in live mutation tests.

When testing the installed CLI locally, use the repository entry point or `npm link` so changes are exercised immediately. Test both direct gateway execution and the configured daemon transports when changing connection code. See [connection modes](connection-modes.md) and the [test-guild guide](test-guild.md).
