# Stdin and inline scripts

Use stdin when an agent or shell pipeline generates a temporary Discript program:

```sh
printf 'print(discord.guilds.list())\n' | discript
```

Use a file for repeatable automation and inline CLI commands for small, read-only operations. Add `--json` for machine consumers, use `--dry-run` before mutations, and inspect the exit status in the calling process. See the [agent stdin protocol](../agents/stdin-protocol.md) and [CLI output contract](../cli/json-output.md).
