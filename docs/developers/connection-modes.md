# Discord connection modes

Discript has two Discord transport modes:

## REST mode

One-shot commands should use Discord’s HTTP REST API whenever the operation does not need a live event stream. REST mode avoids opening a Gateway session, so repeated commands do not consume Gateway identify capacity or leave WebSocket clients running.

Use `--rest` for supported resource operations:

```bash
discript --rest guilds list --json
discript --rest channels list --guild "$TEST_GUILD" --json
discript --rest messages send --channel "$CHANNEL_ID" --content "hello"
discript --rest channels delete --channel "$CHANNEL_ID" --yes
```

REST mutations use the same safety rules as Gateway-backed mutations. `--dry-run` returns the planned HTTP method, route, and body without sending a request; destructive routes require `--yes` or `-y`.

## Gateway mode

Scripts that register event handlers, use ongoing timers, or explicitly require a live cache use a Discord Gateway client. Gateway connections are persistent and consume session-start capacity when they identify. They must always have a bounded startup timeout and cleanup on every failed startup path.

Discord also limits concurrent Identify requests. Multiple independent Discript processes should not all start Gateway clients simultaneously; a future broker or startup lock must coordinate them. Gateway reconnects should resume when possible instead of repeatedly identifying.

## Operation classification

| Operation | Default transport | Gateway required |
| --- | --- | --- |
| Guild/channel/role/member/message CRUD | REST | No |
| Webhook, invite, emoji, sticker, scheduled-event CRUD | REST | No |
| Voice state changes | REST plus voice connection where needed | Sometimes |
| Script event listeners | Gateway | Yes |
| Presence/member/message event streams | Gateway | Yes |
| Timers and loops without events | No Discord transport after startup | No |

The implementation should select the lightest transport that satisfies the operation. A command must not open Gateway solely because it performs a normal REST mutation.
