# Discript MCP Integration Checklist

This checklist is ordered by dependency. `[x]` means implemented and locally verified. `[ ]` means not complete.

## Phase 1 — MCP server foundation

- [x] Add `@eliware/mcp-server` integration behind a Discript MCP module.
- [x] Define one stable `run_discript` tool with compact inputs for source, direct command, dry-run, force, timeout, and REST preference.
- [x] Route tool execution through the existing Discript engine so CLI, scripts, broker, and MCP share the same capability layer.
- [x] Add local stdio mode with `discript mcp --stdio`.
- [x] Add optional daemon HTTP mode with `discript daemon start --mcp-port <port>`.
- [x] Reuse the daemon’s existing Gateway runtime for HTTP MCP requests.
- [x] Coordinate MCP HTTP shutdown with broker shutdown.
- [x] Validate MCP port input and preserve cross-platform path handling.
- [x] Add focused `run_discript`, broker lifecycle, and MCP input-validation tests.

## Phase 2 — Transport and execution behavior

- [ ] Use REST-first execution for MCP direct commands that do not require Gateway state.
- [ ] Extend REST-first behavior to source-level Discord operations where possible.
- [ ] Enforce dry-run and force behavior identically across CLI, scripts, and MCP.
- [ ] Require explicit MCP approval for destructive operations through `force: true`.
- [ ] Return structured MCP results containing value, success state, exit code, warnings, and diagnostics.
- [ ] Preserve Discript error codes in MCP tool failures without exposing tokens or secrets.
- [ ] Add per-request execution timeouts with cancellation and runtime cleanup.
- [ ] Add output-size limits and bounded concurrent execution.
- [ ] Define behavior for long-running event/timer scripts over MCP.

## Phase 3 — Authentication, authorization, and TLS

- [ ] Support `auth.mode: none` only for trusted local stdio/development use.
- [ ] Support static bearer authentication for HTTP deployments.
- [ ] Support bearer-passthrough mode for forwarding validated-at-the-edge tokens to backend operations.
- [ ] Support OAuth2 resource-server authentication with issuer and resource/audience validation.
- [ ] Support OAuth2 token introspection with required scopes and sanitized identity metadata.
- [ ] Expose OAuth protected-resource metadata endpoints.
- [ ] Decide whether Discript needs server-side OAuth only or also OAuth client helpers.
- [ ] If OAuth client support is needed, add provider discovery, client registration, PKCE, authorization-code exchange, and durable state handling.
- [ ] Add HTTP/HTTPS configuration for daemon MCP mode.
- [ ] Support inline TLS key/certificate/CA configuration.
- [ ] Support TLS key/certificate/CA files and `TLS_KEY_FILE`, `TLS_CERT_FILE`, and `TLS_CA_FILE` environment variables.
- [ ] Support HTTP-to-HTTPS redirects.
- [ ] Add configurable CORS `allowedOrigins`.
- [ ] Add authentication, authorization, TLS, CORS, and remote-host trust documentation.
- [ ] Define scope mapping for read-only, mutating, destructive, and administrative Discript operations.

## Phase 4 — Help, resources, prompts, and discovery

- [ ] Expose server-level instructions describing Discript, safety rules, transports, and execution patterns.
- [ ] Expose `discript://help` as a generated high-level guide.
- [ ] Expose `discript://commands` from the live command catalog.
- [ ] Expose `discript://language` for syntax and scripting semantics.
- [ ] Expose `discript://safety` for dry-run, force, permissions, destructive actions, and exit behavior.
- [ ] Expose parameterized `discript://examples/{name}` resources from the examples directory.
- [ ] Add MCP prompts for inventory, safe mutation, server provisioning, rollback, debugging, and script generation.
- [ ] Add resource and prompt descriptions, MIME types, annotations, and deterministic ordering.
- [ ] Add resource templates and completion where parameterized help needs it.
- [ ] Add optional 2026 `server/discover` support while retaining compatibility with normal MCP initialization.
- [ ] Define cache and list-change behavior for generated resources and prompts.

## Phase 5 — Remote MCP client mode

- [ ] Add a local `discript mcp-client` mode using `@eliware/mcp-client`.
- [ ] Support remote Streamable HTTP MCP connections with URL, bearer token, headers, timeout, and reconnect options.
- [ ] Support remote SSE connections where required for legacy servers.
- [ ] Support remote stdio connections by launching another Discript process or compatible MCP server.
- [ ] Let client mode discover server instructions, resources, prompts, and tools before execution.
- [ ] Add client commands for remote tool invocation, resource reading, prompt retrieval, and server inspection.
- [ ] Support piping Discript source into the remote client without temporary files.
- [ ] Support client-side static tokens, async token providers, custom headers, and OAuth/PKCE integration where selected.
- [ ] Add remote execution examples for local agents, CI harnesses, and multi-host Discord automation.
- [ ] Define whether remote execution returns raw MCP JSON, normalized Discript JSON, JSONL, or human-readable output.
- [ ] Preserve remote MCP errors, Discript exit codes, and authentication failures in the local CLI contract.

## Phase 6 — Security, operations, and observability

- [ ] Add rate limits and bounded queues for remote HTTP execution.
- [ ] Add request IDs, execution duration, transport, command/source mode, exit code, and sanitized failure-category logging.
- [ ] Never log Discord tokens, MCP bearer tokens, OAuth secrets, TLS key material, or sensitive tool arguments/results.
- [ ] Add graceful shutdown coordination between MCP server, broker, Discord runtime, and child MCP client processes.
- [ ] Define trust boundaries for stdio child processes and remote HTTP callers.
- [ ] Document stable MCP release compatibility versus draft 2026 discovery features.
- [ ] Define remote server lifecycle, health checks, and failure recovery behavior.

## Phase 7 — Tests and verification

- [ ] Test MCP tool discovery and compact schema validation.
- [ ] Test resources, prompts, server instructions, and discovery metadata.
- [ ] Test stdio, HTTP, HTTPS, authentication, authorization, CORS, and TLS failures.
- [ ] Test static bearer, bearer-passthrough, OAuth2 introspection, required scopes, and protected-resource metadata.
- [ ] Test broker reuse, shutdown, duplicate startup, timeouts, cancellation, output limits, and concurrency bounds.
- [ ] Test dry-run, force approval, structured results, and sanitized error mapping.
- [ ] Add cross-platform tests for Windows stdio, HTTP, Unix sockets, and process cleanup.
- [ ] Add live integration tests against `TEST_GUILD` with read-only and explicitly gated mutation cases.
- [ ] Add MCP examples to the package and documentation checker.
- [ ] Add an end-to-end test where an MCP client discovers help, reads the command catalog, reads an example, and executes a dry-run.
- [ ] Add an end-to-end remote test where one Discript process serves MCP and another discovers it and runs a script.

## Phase 8 — Documentation, packaging, and release

- [ ] Add CLI help, command discovery, shell completion, specs, and release notes for server and client modes.
- [ ] Add authentication and TLS configuration examples for local, private HTTP, HTTPS, and OAuth2 deployments.
- [ ] Add packaging checks ensuring MCP dependencies and examples are included correctly.
- [ ] Add CI coverage for local stdio, HTTP, HTTPS, authentication, and remote MCP integration.
- [ ] Add an MCP operations/release checklist, including secret and certificate handling.
- [ ] Publish only after all required security, integration, packaging, and CI gates pass.
- [ ] Commit server integration, security, resources, client mode, tests, documentation, and release work as separate solid checkpoints.
