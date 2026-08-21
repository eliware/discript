# Discript

## Vision

Discript is a scripting language and command-line tool for interacting with Discord programmatically.

It is intended primarily for AI agents, coding harnesses, automation, and developers who need a concise way to inspect or operate Discord without writing a complete bot application.

Discript should make common Discord operations easy to express while remaining scriptable, composable, machine-readable, and safe.

## Execution model

Discript supports both one-shot commands and reusable scripts.

Examples of supported input modes include:

- A single command entered on the command line
- An expression supplied with an evaluation option
- A script read from standard input
- A script stored in a file

For finite programs, Discript should:

1. Load configuration and credentials.
2. Connect to Discord.
3. Execute the requested operation or script.
4. Return the result.
5. Shut down cleanly.

Programs that register event handlers, timers, or explicit loops may remain running until they are stopped or receive a termination signal.

## Language goals

The language should provide a small, approachable set of general programming features:

- Variables and expressions
- Functions and reusable scripts
- Conditional logic and iteration
- Sequential and asynchronous operations
- Error handling
- Event listeners and handlers
- Timers and long-running execution
- Imports or other lightweight composition mechanisms

Discord functionality should primarily be exposed through a standard library and object model rather than a large collection of special language keywords.

## Discord capabilities

The standard library should cover the major Discord resource areas, including:

- Guilds
- Channels and threads
- Messages and reactions
- Members and users
- Roles and permissions
- Moderation
- Invites
- Emojis and stickers
- Scheduled events
- Voice state operations
- Bot identity and connection state

Operations should return useful structured values so that the result of one operation can be used by subsequent operations.

## Composition and data flow

Scripts should support assigning command results to variables and passing those values into later commands.

Common workflows should be expressible as a sequence such as:

```text
list resources → select a resource → perform an operation → print the result
```

The language may also support pipelines where the output of one operation becomes the input to another.

## Events and asynchronous behavior

Discord operations are asynchronous, but scripts should be able to express sequential workflows naturally.

The language should support both:

- Sequential execution, where each operation completes before the next begins
- Concurrent execution, where independent operations can run together

Event handlers should be able to respond to Discord activity such as messages, interactions, member changes, and other supported gateway events.

The runtime should remain alive only when the program has active listeners, timers, loops, or other pending work.

## CLI and agent integration

The command-line interface is a primary interface, not merely a development convenience.

It should work well when invoked by an AI agent or coding harness:

- Accept source through files, standard input, or inline evaluation
- Produce structured output suitable for parsing
- Keep diagnostics separate from command results where practical
- Use predictable exit codes
- Avoid interactive prompts by default
- Support explicit approval for mutations and destructive operations
- Never expose credentials in output
- Provide useful error information without requiring human-oriented formatting

Human-readable output may be available as an alternate presentation mode, but machine-readable output should be reliable and stable.

Long-running programs should be able to emit structured event and operation results incrementally.

## Safety and permissions

Discript must respect Discord permissions, role hierarchy, protected resources, and API constraints.

Read operations and mutations should be distinguishable. Destructive actions should support safeguards such as explicit approval, dry-run behavior, and clear failure reporting.

Authorization failures should fail closed rather than being silently ignored.

Mutating operations should support dry-run previews. Destructive operations require explicit force approval, represented by `--yes` or `-y` in the CLI and an equivalent internal directive in scripts. Scripts must be able to inspect operation exit codes, branch on them, and explicitly terminate with a chosen status.

## Runtime lifecycle

Connection management and shutdown should be owned by the runtime rather than repeated in every script.

The runtime should handle:

- Discord connection setup
- Required gateway intents
- Authentication failures
- Pending asynchronous work
- Rate limits and relevant retries
- Clean shutdown after finite execution
- Signal-based shutdown for long-running programs
- Unexpected errors and rejected promises

Shared Eliware utilities should be used for common logging, error handling, filesystem access, path resolution, and signal-aware lifecycle management.

## Initial direction

The first implementation should prioritize a small reliable runtime over a large language surface.

An initial useful version should be able to:

1. Accept a command or script from the CLI or standard input.
2. Connect using `DISCORD_TOKEN`.
3. Inspect guilds and other basic Discord resources.
4. Assign and reuse command results.
5. Perform selected mutations with explicit safeguards.
6. Print structured results.
7. Shut down automatically when execution is complete.

The language and Discord standard library should grow from real automation use cases while keeping the execution model simple and predictable.

The CLI and language contracts are defined in [specs/11-cli-and-language-contract.md](specs/11-cli-and-language-contract.md). Both interfaces should use the same underlying Discord capability layer.

## Transport contract

The daemon may expose a local Unix socket (or Windows named pipe), MCP stdio, MCP HTTP/HTTPS, or a hybrid profile. Hybrid mode runs the local broker and MCP server over the same Discord runtime: local Discript commands use the socket, while remote clients use MCP. Each command or script execution returns a request ID, `ok`, an integer `exitCode`, and either `value` or a structured error; warnings and diagnostics are arrays.

Unknown CLI options are errors rather than implicit booleans. Long-form resource identifiers accept documented aliases such as `--guild-id` for `--guild`. Script programs can use the constrained `json.parse` and `json.stringify` helpers for portable data exchange without exposing the full host `JSON` object.
