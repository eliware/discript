# Machine-Readable Output

Discript shall provide stable, structured output suitable for consumption by AI agents, coding harnesses, and shell pipelines.

Diagnostics should be separable from command results. The CLI should provide predictable exit statuses, non-interactive operation by default, and safe error reporting without exposing credentials.

Long-running programs should be able to emit structured results incrementally.
