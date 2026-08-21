# CLI command development

CLI commands are thin adapters around the shared engine. A command should parse arguments and options, validate required inputs, select the configured connection mode, invoke the engine, serialize the result, and return the engine's exit status.

Keep command-specific behavior in `src/cli/commands/` and put tests in the matching `tests/cli/commands/` file. Cover normal output, `--json`, stdin or inline scripts where supported, invalid input, dry-run previews, and destructive approval. Avoid duplicating Discord API logic in command handlers.

When adding a command, update the command catalog and help text, the CLI reference, relevant examples, and completion definitions. Preserve stable aliases and exit-code behavior because agents commonly compose commands with shell conditionals and pipelines.

See [CLI architecture](../cli/commands.md), [JSON output](../cli/json-output.md), and [exit statuses](../cli/exit-statuses.md).
