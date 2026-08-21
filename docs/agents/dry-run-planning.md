# Dry-run planning

Dry-run constructs a plan; it is not a transaction and does not guarantee that a later operation will succeed. It must not send a Discord mutation request.

```sh
discript channels create --guild "$TEST_GUILD" --name review --dry-run --json
```

```ds
guild = discord.guilds.get(env.TEST_GUILD)
guild.channels.create("review", {dryRun: true})
```

Review target IDs, operation type, parent/category, positions, permissions, and content. Re-inventory immediately before applying because state and permissions can change. See [dry-run-channel.ds](../../examples/discord/dry-run-channel.ds) and [preview-then-apply.ds](../../examples/safety/preview-then-apply.ds).

