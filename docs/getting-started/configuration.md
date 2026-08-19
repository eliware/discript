# Configuration

Discript reads configuration from environment variables for one-shot commands, `.ds` files, and scripts supplied through standard input.

Keep bot tokens out of source control. Use a private `.env` file, the user-level file below, shell exports, or your process manager’s secret store.

## Configuration files

Discript checks the project-local `.env` and the user-level `~/.discript.env` file. Project-local values take precedence over the user-level fallback, and already-exported shell variables are not overwritten.

| Platform | User-level file |
| --- | --- |
| Linux and macOS | `$HOME/.discript.env` |
| Windows | `%USERPROFILE%\\.discript.env` |

Node resolves the home directory, so no shell-specific path syntax is needed. On Unix, protect the file with `chmod 600 ~/.discript.env`. The repository’s `.env.example` is a safe template; never commit a real token.

```dotenv
DISCORD_TOKEN=your_bot_token
DISCRIPT_INTENTS=Guilds,GuildMessages,GuildMembers,MessageContent
```

## Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DISCORD_TOKEN` | Live use | Discord bot token used to authenticate the client. |
| `DISCRIPT_INTENTS` | No | Comma-separated Discord gateway intent names. Defaults to `Guilds,GuildMessages,GuildMembers`. |
| `TEST_GUILD` | No | Default guild ID used by examples and live tests. |
| `DISCRIPT_LIVE` | No | Enables live integration tests. |
| `DISCRIPT_LIVE_MUTATIONS` | No | Enables live tests that change Discord state. |

`DISCORD_TOKEN` is required for live execution. Commands that do not connect can still parse, validate, and plan scripts.

## Gateway intents

Intent names are Discord.js gateway intent names separated by commas; whitespace is ignored:

```dotenv
DISCRIPT_INTENTS=Guilds, GuildMessages, MessageContent
```

Supported names include `Guilds`, `GuildMembers`, `GuildModeration`, `GuildBans`, `GuildExpressions`, `GuildEmojisAndStickers`, `GuildIntegrations`, `GuildWebhooks`, `GuildInvites`, `GuildVoiceStates`, `GuildPresences`, `GuildMessages`, `GuildMessageReactions`, `GuildMessageTyping`, `DirectMessages`, `DirectMessageReactions`, `DirectMessageTyping`, `MessageContent`, `GuildScheduledEvents`, `AutoModerationConfiguration`, `AutoModerationExecution`, `GuildMessagePolls`, and `DirectMessagePolls`.

Privileged intents are not enabled merely by listing them in `.env`. Enable `GuildMembers`, `GuildPresences`, and `MessageContent` in the bot’s Discord Developer Portal application settings as well. Unknown names cause configuration validation to fail instead of being silently ignored. Request only the intents the application needs.

## Script environment variables

Scripts can read, set, and clear variables:

```ds
let channel = env.get("ANNOUNCEMENT_CHANNEL")
env.set("RUN_MODE", "preview")
env.clear("TEMP_VALUE")
```

Reads use the environment visible to the Node process. Script changes affect only the current Discript process; they do not modify either env file or the parent shell.

## Common setups

For local development, keep the token and isolated test guild in `.env`:

```dotenv
DISCORD_TOKEN=...
TEST_GUILD=123456789012345678
DISCRIPT_INTENTS=Guilds,GuildMessages,GuildMembers,MessageContent
```

For multiple projects, put the token and general intent configuration in `~/.discript.env`, then keep project-specific values such as `TEST_GUILD` in each project’s `.env`. In CI or an agent harness, inject secrets through the secret store and avoid putting tokens in command arguments, logs, JSON output, or generated examples.

## Troubleshooting

- `DISCORD_TOKEN is not set`: verify the variable is visible to the launched process and the file is named exactly `.env` or `.discript.env`.
- `unknown gateway intent`: check spelling and capitalization.
- Login fails after adding a privileged intent: enable it in the Developer Portal and restart Discript.
- The wrong guild is used: check shell exports, then project `.env`, then `~/.discript.env`; the higher-precedence value wins.
- A script variable disappears after the command: this is expected because script changes are process-local.
