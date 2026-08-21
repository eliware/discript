# Resource aliases

Full resource names are best for durable automation. Short aliases are useful interactively and are normalized before dispatch.

| Canonical | Aliases |
| --- | --- |
| `guilds` | `guild` |
| `members` | `member` |
| `channels` | `chan`, `channel` |
| `messages` | `msg`, `message` |
| `roles` | `role` |
| `events` | `event` |
| `invites` | `invite` |
| `emojis` | `emoji` |

Examples:

```sh
discript guilds list
discript chan list --guild "$TEST_GUILD"
discript msg list --channel "$CHANNEL_ID"
```

Long option aliases such as `--guild-id`, `--channel-id`, and `--message-id` map to their canonical option names. Unknown long options fail with `UNKNOWN_OPTION` instead of becoming implicit booleans.

