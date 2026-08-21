# Variables and environment

Assignment binds a value for later statements. `env` exposes the Node process environment and is the preferred way to avoid hardcoding tokens, guild IDs, channel IDs, and deployment modes.

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
