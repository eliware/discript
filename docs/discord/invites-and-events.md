# Invites and events

Invite workflows can list and create invites when the bot has permission; deleting or revoking an invite is a mutation and should be explicitly approved. Treat invite codes as bearer-like links and avoid printing them in broad logs.

Event handlers subscribe to gateway events such as messages, member changes, channel changes, and reactions. A handler may perform asynchronous work, but it must be bounded, handle errors, and avoid recursively triggering an unplanned event storm.

For long-lived listeners, use daemon mode and make shutdown explicit. One-shot commands should finish after their work and remove listeners. See [events and handlers](../language/events-and-handlers.md) and [daemon operations](../user-guide/events-and-daemons.md).
