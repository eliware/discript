# Discript MCP Integration Checklist

## MCP server foundation

- [x] Add `@eliware/mcp-server` integration behind a Discript MCP module.
- [x] Define a stable `run_discript` tool with compact inputs for source, command, dry-run, force, timeout, and REST preference. Output mode and daemon target context remain later extensions.
- [x] Route tool execution through the existing Discript engine so CLI, scripts, broker, and MCP share identical behavior.
- [x] Add stdio mode with `discript mcp --stdio` for local MCP clients.
- [ ] Add daemon HTTP mode with `discript daemon start --mcp-port <port>`.
- [ ] Reuse the daemon’s existing Gateway broker runtime for HTTP MCP requests.
- [ ] Use REST-first execution for MCP requests that do not require Gateway state.
- [ ] Add HTTP bearer authentication and configurable allowed origins.
- [ ] Add per-request timeouts, output-size limits, concurrency limits, and cancellation handling.

## Safety and execution contract

- [ ] Enforce dry-run and force behavior identically across CLI, scripts, and MCP.
- [ ] Require explicit MCP approval for destructive operations through `force: true`.
- [ ] Return structured MCP results containing value, success state, exit code, warnings, and diagnostics.
- [ ] Preserve Discript error codes in MCP tool failures without exposing tokens or secrets.

## Help, resources, and prompts

- [ ] Expose server-level instructions describing Discript, safety rules, transports, and execution patterns.
- [ ] Expose `discript://help` as a generated high-level guide.
- [ ] Expose `discript://commands` from the live command catalog.
- [ ] Expose `discript://language` for syntax and scripting semantics.
- [ ] Expose `discript://safety` for dry-run, force, permissions, destructive actions, and exit behavior.
- [ ] Expose parameterized `discript://examples/{name}` resources for the existing examples directory.
- [ ] Add MCP prompts for inventory, safe mutation, server provisioning, rollback, debugging, and script generation.
- [ ] Add resource and prompt metadata, descriptions, MIME types, annotations, and deterministic ordering.
- [ ] Add optional 2026 `server/discover` support while retaining compatibility with normal MCP initialization.

## MCP client mode

- [ ] Add a local `discript mcp-client` mode using `@eliware/mcp-client`.
- [ ] Support remote HTTP MCP connections with URL, bearer token, headers, timeout, and reconnect options.
- [ ] Support remote stdio MCP connections by launching another Discript process or compatible MCP server.
- [ ] Let client mode discover server instructions, resources, prompts, and tools before execution.
- [ ] Add client commands for remote tool invocation, resource reading, prompt retrieval, and server inspection.
- [ ] Support piping Discript source into the remote client without temporary files.
- [ ] Add remote execution examples for local agents, CI harnesses, and multi-host Discord automation.
- [ ] Define whether remote execution returns raw MCP JSON, normalized Discript JSON, JSONL, or human-readable output.

## Security and operations

- [ ] Add authentication, authorization, and remote-host trust documentation.
- [ ] Add rate limits and bounded queues for remote HTTP execution.
- [ ] Add observability for request IDs, execution duration, transport, command/source mode, exit code, and sanitized failure category.
- [ ] Add graceful shutdown coordination between the MCP server, broker, Discord runtime, and child MCP client processes.
- [ ] Document compatibility expectations for stable MCP releases versus draft 2026 discovery features.

## Tests and verification

- [ ] Add tests for tool discovery, resources, prompts, stdio, HTTP, authentication, broker reuse, timeouts, and destructive-operation approval.
- [ ] Add cross-platform tests for Windows stdio, HTTP, Unix sockets, and process cleanup.
- [ ] Add live integration tests against the test guild with read-only and explicitly gated mutation cases.
- [ ] Add MCP examples to the package and documentation checker.
- [ ] Add an end-to-end test where an MCP client discovers Discript help, reads the command catalog, reads an example, and executes a dry-run.
- [ ] Add an end-to-end remote test where one Discript process serves MCP and another connects to it, discovers capabilities, and runs a script.

## Documentation and release

- [ ] Add CLI help, command discovery, shell completion, specs, and release notes for both MCP server and client modes.
- [ ] Add packaging checks ensuring MCP dependencies and examples are included correctly.
- [ ] Add CI coverage for local stdio MCP integration and HTTP MCP integration.
- [ ] Commit the server integration, client mode, documentation/resources, tests, and release packaging as separate solid checkpoints.
