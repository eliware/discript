# Authentication

The runtime logs in with `DISCORD_TOKEN` and requests guild, message, and member intents. The token is never a script value unless the user explicitly exposes it through the environment; scripts should not print it.

