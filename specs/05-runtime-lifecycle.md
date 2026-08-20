# Runtime Lifecycle

Finite Discript programs shall shut down automatically after their work is complete.

The runtime shall remain active when a script has event listeners, timers, loops, or other ongoing work. Long-running programs shall support intentional shutdown and signal-based shutdown.

The implementation provides two Gateway execution modes:

- A finite invocation creates a runtime for the operation and shuts it down in its finalization path.
- `daemon start` creates a persistent local Gateway broker; `--broker` commands and scripts reuse that runtime until `daemon stop` or an explicit broker shutdown.

Gateway startup is bounded, serialized, session-limit aware, and cleaned up on failed startup. A second broker for the same token fails with `BROKER_ALREADY_RUNNING` without removing the active endpoint. Broker requests have bounded timeouts and report `BROKER_TIMEOUT` or `BROKER_UNAVAILABLE` failures.
