# CLI and Language Contract

## Purpose

Discript has two complementary interfaces: a discoverable command-line interface and a composable scripting language. Both interfaces must use the same underlying Discord capability layer.

## CLI contract

The CLI shall support these broad invocation forms:

```text
discript <resource> <operation> [options]
discript --eval <source>
discript <script-file>
cat script.ds | discript
```

The CLI accepts source from a pipe when no script file is provided; there is no separate `--stdin` mode.

The CLI shall provide:

- `--help` for usage and command discovery
- `--version` for the installed version
- `--json` for machine-readable results
- `--dry-run` for supported mutations
- `--yes` for explicitly approving mutations or destructive operations
- `--rest` for supported REST operations without opening a Gateway client
- `--broker` for commands or scripts routed through a persistent local Gateway broker
- `--output jsonl` for newline-delimited results
- `--timeout <ms>` for bounded execution

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
- Array indexes, computed member access, and member/index assignment
- Compound assignment, modulo, exponentiation, and null-coalescing operators
- `break`, `continue`, `throw`, `finally`, and deferred cleanup callbacks
- Positional script arguments through the `args` array
- Explicit aliased imports and named exports
- Bounded standard-library helpers and bounded asynchronous collection mapping
- Source locations on parser tokens and syntax diagnostics
- Conditional expressions and optional member/index/call access
- Array and object spread expressions
- Array and object destructuring assignments with rest capture
- Bounded timeout and callback-based retry helpers
- Runtime failures preserve a sanitized user-function call stack

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

Configuration is loaded from the process environment, the project `.env`, and the user-level `.discript.env` fallback. Existing exported variables are preserved; project-local values take precedence over the user-level file. Gateway intent names are configured through `DISCRIPT_INTENTS` and default to `Guilds,GuildMessages,GuildMembers`.
