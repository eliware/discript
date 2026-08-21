# Examples

Runnable examples live in the repository’s top-level `examples/` directory. This index explains what to look for without duplicating source files.

- `fundamentals/` — language basics.
- `discord/` — direct Discord workflows.
- `agents/` — stdin, JSON, validation, and automation patterns.
- `clever/` — higher-level operational workflows.
- `events/` — event listeners.
- `composition/` — imports and reusable functions.

Every mutating example should document whether it previews by default, requires `--yes`, or uses an internal force option. Destructive examples must identify their target and cleanup behavior.

The canonical, searchable catalog is the repository [examples README](../../examples/README.md), which links the runnable `.ds` files and groups them by fundamentals, Discord operations, safety, events, MCP, and agent workflows.
