# Stdin protocol

Scripts do not need to exist as files:

```sh
cat plan.ds | discript --json
printf 'print(discord.guilds.list())' | discript --output jsonl
discript -e 'print(discord.guilds.list())' --json
```

This is useful for coding harnesses that synthesize a short-lived plan. The process still follows the normal lifecycle: load configuration, connect, execute, emit output, and shut down unless event handlers keep it alive.

