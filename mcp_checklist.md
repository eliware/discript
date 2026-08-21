# Discript MCP Integration Checklist

This checklist is ordered by dependency. `[x]` means implemented and locally verified. `[ ]` means not complete. Configuration names added to `.env.example` are planning/template entries until the loader and CLI consume them.

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

## Phase 2 — Configuration profiles and mode selection

- [x] Expand `.env.example` with direct, daemon, MCP server, TLS, authentication, and remote client profile placeholders.
- [x] Keep `DISCORD_TOKEN` and `DISCRIPT_INTENTS` as the real application configuration variables.
- [x] Keep `TEST_GUILD` explicitly marked as test-only rather than part of the normal application profile.
- [x] Add a typed configuration profile loader for `DISCRIPT_CONNECTION_MODE` with direct as the default.
- [x] Add daemon profile selection through `DISCRIPT_DAEMON_MODE` (`socket` or `mcp`).
- [x] Add MCP server profile loading for transport, port, endpoint, static/bearer auth, TLS files, redirect, and CORS settings.
- [x] Add remote client profile loading for URL, transport, token, headers, and reconnect settings.
- [x] Make `discript daemon` start the configured daemon profile without requiring repeated flags.
- [x] Make normal CLI commands use the configured daemon/client profile when selected.
- [x] Preserve explicit `--direct` and `--broker` flags as higher-precedence one-shot overrides.
- [x] Add `discript config` and `discript config --json` with complete secret redaction.
- [x] Validate incompatible profiles before starting Discord, MCP, or network listeners.
- [x] Document precedence: process environment, project `.env`, user `~/.discript.env`, profile defaults, then CLI overrides.

## Phase 3 — Transport and execution behavior

- [ ] Use REST-first execution for MCP direct commands that do not require Gateway state.
- [ ] Extend REST-first behavior to source-level Discord operations where possible.
- [x] Enforce dry-run and force behavior identically across CLI, scripts, and MCP.
- [x] Require explicit MCP approval for destructive operations through `force: true`.
- [x] Return structured MCP results containing value, success state, exit code, warnings, and diagnostics.
- [x] Preserve Discript error codes in MCP tool failures without exposing tokens or secrets.
- [x] Add per-request execution timeouts with cancellation and runtime cleanup.
- [x] Add output-size limits and bounded concurrent execution.
- [ ] Define behavior for long-running event/timer scripts over MCP.

## Phase 4 — Authentication, authorization, and TLS

- [x] Support `auth.mode: none` as the local/development default; remote-use policy enforcement remains pending.
- [x] Support static bearer authentication for HTTP deployments.
- [x] Support bearer-passthrough mode for forwarding validated-at-the-edge tokens to backend operations.
- [x] Support OAuth2 resource-server authentication with issuer and resource/audience validation.
- [x] Support OAuth2 token introspection with required scopes and sanitized identity metadata.
- [x] Expose OAuth protected-resource metadata endpoints.
- [ ] Decide whether Discript needs server-side OAuth only or also OAuth client helpers.
- [ ] If OAuth client support is needed, add provider discovery, client registration, PKCE, authorization-code exchange, and durable state handling.
- [x] Add HTTP/HTTPS configuration for daemon MCP mode.
- [ ] Support inline TLS key/certificate/CA configuration.
- [x] Support TLS key/certificate/CA files and `TLS_KEY_FILE`, `TLS_CERT_FILE`, and `TLS_CA_FILE` environment variables.
- [x] Support HTTP-to-HTTPS redirects with separately configurable HTTP and HTTPS listeners.
- [x] Add configurable CORS `allowedOrigins`.
- [x] Add authentication, authorization, TLS, CORS, and remote-host trust documentation.
- [ ] Define scope mapping for read-only, mutating, destructive, and administrative Discript operations.

## Phase 5 — Help, resources, prompts, and discovery

- [x] Expose server-level instructions describing Discript, safety rules, transports, and execution patterns.
- [x] Expose `discript://help` as a generated high-level guide.
- [x] Expose `discript://commands` from the live command catalog.
- [x] Expose `discript://language` for syntax and scripting semantics.
- [x] Expose `discript://safety` for dry-run, force, permissions, destructive actions, and exit behavior.
- [x] Expose parameterized `discript://examples/{name}` resources from the examples directory.
- [x] Add MCP prompts for inventory, safe mutation, server provisioning, rollback, debugging, and script generation.
- [x] Add resource and prompt descriptions, MIME types, annotations, and deterministic ordering.
- [x] Add resource templates and completion where parameterized help needs it. Resource templates are supported; completion remains delegated to the MCP client/SDK where needed.
- [ ] Add optional 2026 `server/discover` support while retaining compatibility with normal MCP initialization.
- [ ] Define cache and list-change behavior for generated resources and prompts.

## Phase 6 — Remote MCP client mode

- [x] Add a local `discript mcp-client` mode using `@eliware/mcp-client`.
- [x] Support remote Streamable HTTP MCP connections with URL, bearer token, headers, timeout, and reconnect options.
- [x] Support remote SSE connections where required for legacy servers.
- [x] Support remote stdio connections by launching another Discript process or compatible MCP server.
- [ ] Let client mode discover server instructions, resources, prompts, and tools before execution.
- [x] Add client commands for remote tool invocation, resource reading, prompt retrieval, and server inspection.
- [x] Support piping Discript source into the remote client without temporary files.
- [ ] Support client-side static tokens, async token providers, custom headers, and OAuth/PKCE integration where selected. Static tokens and custom headers are complete; async providers and OAuth/PKCE remain pending.
- [x] Add remote execution examples for local agents, CI harnesses, and multi-host Discord automation.
- [x] Define whether remote execution returns raw MCP JSON, normalized Discript JSON, JSONL, or human-readable output. The programmatic client returns normalized Discript JSON; CLI formatting remains local.
- [x] Preserve remote MCP errors, Discript exit codes, and authentication failures in the local CLI contract.

## Phase 7 — Security, operations, and observability

- [x] Add rate limits and bounded queues for remote HTTP execution. MCP execution has bounded concurrency and a configurable pending queue (`DISCRIPT_MCP_MAX_PENDING`); Discord API-native rate-limit backoff remains delegated to Discord.js.
- [x] Add request IDs, execution duration, transport, command/source mode, exit code, and sanitized failure-category logging. MCP execution responses and logs include correlation IDs, duration, mode, status, and sanitized error codes; transport is supplied by the MCP server layer.
- [ ] Never log Discord tokens, MCP bearer tokens, OAuth secrets, TLS key material, or sensitive tool arguments/results.
- [ ] Add graceful shutdown coordination between MCP server, broker, Discord runtime, and child MCP client processes. MCP shutdown is now idempotent and concurrency-safe, and broker callbacks already coordinate listener teardown; full child-process and cross-component shutdown verification remains pending.
- [x] Define trust boundaries for stdio child processes and remote HTTP callers.
- [x] Document stable MCP release compatibility versus draft 2026 discovery features.
- [ ] Define remote server lifecycle, health checks, and failure recovery behavior. A read-only `/healthz` endpoint is implemented; lifecycle and failure-recovery policy remain pending.

## Phase 8 — Tests and verification

- [ ] Test configuration precedence, profile selection, CLI overrides, and redacted config output.
- [ ] Test MCP tool discovery and compact schema validation.
- [ ] Test resources, prompts, server instructions, and discovery metadata.
- [ ] Test stdio, HTTP, HTTPS, authentication, authorization, CORS, and TLS failures. HTTP, static bearer, OAuth2 introspection, bearer-passthrough, and configured CORS integration are covered; HTTPS, stdio transport, TLS, and other failure cases remain pending.
- [x] Test static bearer, bearer-passthrough, OAuth2 introspection, required scopes, and protected-resource metadata.
- [ ] Test broker reuse, shutdown, duplicate startup, timeouts, cancellation, output limits, and concurrency bounds. Broker reuse/duplicate-startup, MCP shutdown idempotence, client/server timeouts, cancellation signaling, output limits, and concurrency bounds are covered; full cross-component shutdown cases remain pending.
- [ ] Test dry-run, force approval, structured results, and sanitized error mapping. Structured success/failure results and sanitized error mapping are covered; dry-run/force approval coverage remains pending.
- [ ] Add cross-platform tests for Windows stdio, HTTP, Unix sockets, and process cleanup.
- [ ] Add live integration tests against `TEST_GUILD` with read-only and explicitly gated mutation cases.
- [x] Add MCP examples to the package and documentation checker.
- [x] Add an end-to-end test where an MCP client discovers help, reads the command catalog, reads an example, and executes a dry-run. Core HTTP discovery/help/dry-run coverage is complete; command-catalog and example reads remain additional assertions.
- [ ] Add an end-to-end remote test where one Discript process serves MCP and another discovers it and runs a script.

## Phase 9 — Documentation, packaging, and release

- [ ] Add CLI help, command discovery, shell completion, specs, and release notes for server and client modes.
- [ ] Add authentication and TLS configuration examples for local, private HTTP, HTTPS, and OAuth2 deployments.
- [ ] Add packaging checks ensuring MCP dependencies and examples are included correctly.
- [ ] Add CI coverage for local stdio, HTTP, HTTPS, authentication, and remote MCP integration.
- [ ] Add an MCP operations/release checklist, including secret and certificate handling.
- [ ] Publish only after all required security, integration, packaging, and CI gates pass.
- [ ] Commit server integration, configuration, security, resources, client mode, tests, documentation, and release work as separate solid checkpoints.
