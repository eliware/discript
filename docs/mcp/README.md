# MCP integration

Discript supports both sides of an MCP workflow:

- `discript mcp --stdio` exposes the Discript engine to a local harness.
- `discript daemon start` can expose the shared Gateway runtime over HTTP or HTTPS.
- `discript mcp-client` inspects and invokes a configured remote MCP server.

The server exposes one execution tool, `run_discript`, plus help resources and workflow prompts. The client can discover those capabilities before running a script.

## Local stdio server

```sh
discript mcp --stdio
```

## Remote inspection

```sh
DISCRIPT_CONNECTION_MODE=mcp-client \
DISCRIPT_CLIENT_URL=http://127.0.0.1:8765/mcp \
discript mcp-client inspect --json
```

## Remote execution

```sh
cat examples/list-guilds.ds | discript mcp-client run --json
discript mcp-client call --tool run_discript --arguments '{"command":["guilds","list"],"dryRun":true}' --json
```

Remote client requests have configurable timeouts and output limits. Destructive actions still require explicit `force`/`-y` approval at the execution boundary.
