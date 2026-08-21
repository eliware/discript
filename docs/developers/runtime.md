# Runtime architecture

The runtime coordinates parsing, evaluation, Discord connectivity, result serialization, and shutdown. A one-shot CLI invocation creates or obtains a client, executes the program, reports its result and exit status, and releases the connection. A script may keep the process alive only when it explicitly installs an event listener, timer, loop, or daemon-facing service.

Connection ownership is transport-aware. Direct CLI execution can use a local gateway session; daemon mode may serve the local socket and MCP transports from the same long-lived runtime, while remote clients use MCP over stdio or HTTP/HTTPS. Avoid creating a new gateway login for every request when a broker is configured.

Runtime errors must become stable internal statuses and process exit codes. Always clear listeners, timers, clients, and server handles on success, failure, and interrupted execution. See [execution model](../overview/execution-model.md), [lifecycle](../language/runtime-lifecycle.md), and [connection modes](connection-modes.md).
