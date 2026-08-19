# Agent-Oriented CLI Input

Discript shall be usable by AI agents and coding harnesses through the command line.

It shall support source supplied as:

- A file
- Standard input
- An inline evaluation expression
- A direct command form where appropriate

The input mechanism shall not require source to be written to a physical file first.

The CLI shall preserve the engine's final exit status so agent harnesses can make decisions from process results. `--yes` and `-y` are the explicit force directives for destructive operations.
