# Resource model

Discript exposes Discord resources through stable verbs: list, get, create, update, and delete where Discord supports the operation and the safety policy permits it. Results are normalized into JSON-safe objects with string IDs, predictable collections, and machine-readable errors.

Not every resource has every verb. Guild deletion is `N/A`; member deletion is represented by kick or ban; gateway events are subscriptions rather than CRUD. Consult the [CRUD matrix](crud-matrix.md) before designing automation.

Use IDs for mutations, deterministic names for discovery, dry-run for previews, and explicit approval for destructive changes.
