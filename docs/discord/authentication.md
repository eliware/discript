# Authentication

Discript authenticates as a Discord bot using `DISCORD_TOKEN`. Keep the token in the user's private environment file or an approved secret manager; never put it in a script, example, command line, commit, or JSON error response.

Gateway intents are configured through environment settings so deployments can request the same permissions in direct, daemon, and MCP modes. Discord may require privileged intents to be enabled in the Developer Portal as well as requested by the process. Request only what the workflow needs.

Authentication failures are startup failures: the command should return a non-zero status and release all resources. See [configuration](../getting-started/configuration.md), [security](../operations/security.md), and [the adapter guide](../developers/discord-adapter.md).
