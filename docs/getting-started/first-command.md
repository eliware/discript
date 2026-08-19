# First command

Start with a read-only request:

```sh
discript guilds list --json
discript channels list --guild "$TEST_GUILD" --json
```

The process connects, performs the request, emits the result, and shuts down. Add `--pretty` for human-readable output. Use `--json` or `--output jsonl` for automation.

