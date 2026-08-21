# MCP CLI reference

## Start a server

Run a local stdio server for a harness:

```sh
discript mcp --stdio
```

Run the configured HTTP or HTTPS daemon profile:

```sh
discript daemon start
```

The server exposes one compact tool, `run_discript`, plus instructions, help resources, command/example catalogs, language and safety resources, and workflow prompts.

## Inspect a remote server

```sh
discript mcp-client inspect --json
discript mcp-client list-tools --json
discript mcp-client list-resources --json
discript mcp-client list-prompts --json
```

The client profile comes from `~/.discript.env` or the process environment. Use `discript config --json` to inspect effective settings with secrets redacted.

## Execute remotely

Run a direct command:

```sh
discript mcp-client run guilds list --json
```

Pipe a script without creating a file:

```sh
printf 'guilds = guilds list\nprint(guilds)\n' | discript mcp-client run --json
```

Preview mutations with `--dry-run`; approve destructive operations only with `-y`/`--yes`. Remote results preserve `ok`, `requestId`, `exitCode`, warnings, diagnostics, and structured error codes.

## Capability calls

Use `call`, `read-resource`, and `get-prompt` for lower-level MCP access:

```sh
discript mcp-client call --tool run_discript --arguments '{"command":["guilds","list"]}' --json
discript mcp-client read-resource --uri discript://help --json
discript mcp-client get-prompt --name safe-mutation --arguments '{"request":"create a channel"}' --json
```
