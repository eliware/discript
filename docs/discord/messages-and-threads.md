# Messages and threads

Message workflows can list or fetch messages, send content, edit messages, delete messages, and work with thread resources where Discord permissions permit. Use IDs for repeatable automation and keep message content explicit in scripts or templates.

Message deletion is destructive and must be previewable and approved. Bulk cleanup should be narrowly scoped, paginated, rate-limit aware, and resumable. A script that listens for messages should remain alive intentionally through daemon mode or an event/timer construct.

Examples are indexed in the [examples guide](../../examples/README.md); event-driven work is demonstrated by [event monitoring](../../examples/event-monitor.ds).
