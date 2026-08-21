# Grammar

The parser in `src/parser/` is authoritative. Programs contain statements separated by newlines or semicolons; blocks use braces. The language supports assignments, functions, returns, conditionals, loops, events, timers, imports, comments, and expressions.

Tokens retain line, column, and source-offset metadata. Syntax errors expose `PARSE_ERROR`, exit status `3`, and location details when a source position is known. This lets agents report the exact failing area instead of reparsing an opaque error excerpt.

Use the [syntax guide](syntax.md) for a quick start and the [reference](reference.md) for normative operators and built-ins. Parser changes must include focused tests and a runnable example.
