# Events and handlers

Register a handler with `on("eventName") { ... }`. The current payload is available as `event`; handlers may call Discord methods and other functions. A handler is asynchronous by nature, so errors should be handled or allowed to reach the runtime status protocol.

Listeners keep execution alive. One-shot scripts without listeners, timers, or loops shut down after their work; daemon workflows should define an intentional shutdown condition. See [runtime lifecycle](runtime-lifecycle.md) and [daemon workflows](../user-guide/events-and-daemons.md).
