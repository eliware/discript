# Configuration

Discript loads the environment visible to the Node process. Keep secrets in `.env` or an external secret manager; never commit them.

| Variable | Purpose |
| --- | --- |
| `DISCORD_TOKEN` | Discord bot token. Required for live execution. |
| `TEST_GUILD` | Optional default guild used by examples and live tests. |
| `DISCRIPT_LIVE` | Enables live integration tests. |
| `DISCRIPT_LIVE_MUTATIONS` | Enables live mutation tests. |

Scripts can read, set, and clear variables through `env.NAME`, `env.get()`, `env.set()`, and `env.clear()`. A script’s changes affect the running Node process only.

