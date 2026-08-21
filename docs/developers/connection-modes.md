# Discord connection modes

Discript has two Discord transport modes:

It also has two service topologies. `socket` is local-only. `mcp` starts the local broker plus the configured MCP listener. `hybrid` makes that same arrangement explicit: local CLI invocations select the socket broker, while remote agents select MCP over stdio or HTTP/HTTPS. Both interfaces share one Discord runtime and therefore do not create a second Gateway Identify session.

## REST mode

One-shot commands should use Discord’s HTTP REST API whenever the operation does not need a live event stream. REST mode avoids opening a Gateway session, so repeated commands do not consume Gateway identify capacity or leave WebSocket clients running.

Use `--rest` for supported resource operations:

```bash
discript --rest guilds list --json
discript --rest channels list --guild "$TEST_GUILD" --json
discript --rest messages send --channel "$CHANNEL_ID" --content "hello"
discript --rest channels delete --channel "$CHANNEL_ID" --yes
discript --broker guilds list --json
```

REST mutations use the same safety rules as Gateway-backed mutations. `--dry-run` returns the planned HTTP method, route, and body without sending a request; destructive routes require `--yes` or `-y`.

## Gateway mode

Scripts that register event handlers, use ongoing timers, or explicitly require a live cache use a Discord Gateway client. Gateway connections are persistent and consume session-start capacity when they identify. They must always have a bounded startup timeout and cleanup on every failed startup path.

Discord also limits concurrent Identify requests. Discript serializes Gateway startup through its lock, checks the session-start budget, and supports a persistent broker so multiple commands can share one Gateway client. Gateway reconnects should resume when possible instead of repeatedly identifying.

The Gateway limits helper exposes Discord’s current `remaining`, `reset_after`, `max_concurrency`, and shard values. A broker or launcher should inspect these values before scheduling fresh Identify requests and wait for the reset window when the remaining count is exhausted.

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

Use `discript daemon start` once, then pass `--broker` on Gateway-backed commands or scripts to reuse that connection. `--broker` is intentionally explicit so an agent can tell whether it is starting a new session or using the shared one. Broker requests have a bounded timeout and return structured `BROKER_TIMEOUT` or `BROKER_UNAVAILABLE` errors.

Starting a second daemon for the same token is rejected with `BROKER_ALREADY_RUNNING`; the existing broker endpoint is never removed during startup. A stale endpoint is cleaned up only after no active broker can connect, and bind-time races are reported as the same duplicate-start error.

Broker and MCP execution responses use the same request envelope. Successful executions contain `ok: true`, `requestId`, `exitCode: 0`, `value`, `warnings`, and `diagnostics`; failures retain the request ID and include a sanitized `code`, `error`, and exit code. This lets agents correlate local and remote execution without transport-specific parsing.

Transient startup contention is retried with bounded exponential backoff. Session-limit errors use Discord’s `reset_after` value when available. Authentication failures, invalid intents, and disallowed intents are reported immediately and are never retried.
