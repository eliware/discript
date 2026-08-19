# CLI and Language Contract

## Purpose

Discript has two complementary interfaces: a discoverable command-line interface and a composable scripting language. Both interfaces must use the same underlying Discord capability layer.

## CLI contract

The CLI shall support these broad invocation forms:

```text
discript <resource> <operation> [options]
discript --eval <source>
discript <script-file>
discript --stdin
```

The CLI should also accept source from a pipe when no script file is provided.

The CLI shall provide:

- `--help` for usage and command discovery
- `--version` for the installed version
- `--json` for machine-readable results
- `--dry-run` for supported mutations
- `--yes` for explicitly approving mutations or destructive operations

Finite invocations shall connect, execute, emit a result, clean up, and exit. Long-running invocations may remain active when the source registers listeners, timers, or loops.

## Language contract

The initial language shall support:

- Expressions and command calls
- Variables assigned from command results
- Property access on structured results
- Sequential execution
- Explicit asynchronous waiting
- Basic conditionals and iteration
- Errors that can be caught or reported
- Event handler declarations for long-running scripts

Example:

```discript
guilds = discord.guilds.list()
target = guilds.find(guild => guild.name == "discript")
print(target.id)
```

## Shared execution contract

CLI commands and language expressions that represent the same operation shall produce equivalent results and enforce the same Discord permissions and safety rules.

The CLI is responsible for input selection, option parsing, output formatting, and process exit behavior. The language runtime is responsible for parsing and evaluating source. Discord operations belong to a shared capability layer rather than either interface.

## Output and failure contract

Machine-readable results shall be written to stdout. Diagnostics shall be written to stderr where practical.

Failures shall provide a stable error code, a useful message, and a nonzero exit status. Credentials and other sensitive configuration shall never appear in results, diagnostics, or errors.

Scripts receive a read/write `env` standard-library object backed by the Node process environment. Environment variables may be read with `env.NAME` or `env.get("NAME")`, written with `env.set("NAME", value)` or `env.NAME = value`, and removed with `env.clear("NAME")`. Variable names must be valid environment identifiers.
