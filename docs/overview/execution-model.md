# Execution model

Discript loads environment configuration, connects the Discord client, evaluates one command or script, emits results, and shuts down. Event handlers intentionally keep the process alive; use `--timeout` or a termination signal to bound them.

In daemon mode, startup creates the shared runtime and configured socket/MCP listeners, then waits for requests. Each request has an isolated evaluation context while sharing the gateway connection. Cleanup covers listeners, timers, child processes, and the Discord client.
