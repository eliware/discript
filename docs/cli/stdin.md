# Standard input

When no script file is supplied and stdin is not a terminal, Discript reads the complete stream as `.ds` source. This is useful for generated plans and avoids temporary files.

```sh
printf 'guilds = discord.guilds.list()\nguilds' | discript --json
cat examples/agent/stdin-plan.ds | discript --json
```

Use `--eval`/`-e` for short one-liners:

```sh
discript -e '1 + 2' --json
```

Keep source and result channels separate when embedding Discript. Use `--output jsonl` for incremental `print()` records, and check the process exit code for failure even when stdout contains partial records. See [stdin protocol](../agents/stdin-protocol.md).

