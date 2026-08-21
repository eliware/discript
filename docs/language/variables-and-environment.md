# Variables and environment

Assignment binds a value for later statements. `env` exposes the Node process environment and is the preferred way to avoid hardcoding tokens, guild IDs, channel IDs, and deployment modes.

The `args` array contains values after a script file, inline `-e` expression, or stdin invocation. This makes one script reusable without embedding target IDs:

```sh
discript examples/inspect.ds "$TEST_GUILD" preview
```

```ds
guildId = args[0]
mode = args[1] ?? "read-only"
print({guild: guildId, mode: mode})
```

## JSON serialization

Scripts use the constrained `json` helper for machine-readable payloads:

```ds
payload = {guild: env.TEST_GUILD, approved: false}
encoded = json.stringify(payload)
decoded = json.parse(encoded)
print(decoded)
```

`json.stringify(value)` returns a JSON string and `json.parse(text)` returns a
script value. Invalid JSON raises a normal runtime error. The full JavaScript
`JSON` global is intentionally not exposed.
