# Parser architecture

Parsing is split into focused modules under `src/parser/`: tokenization turns source text into tokens; token helpers provide matching, peeking, and consumption; statement and expression modules build syntax nodes; operator parsing handles precedence; errors create consistent source-aware diagnostics; and `index.mjs` exposes the public `parse()` entry point.

Keep the parser free of Discord and environment concerns. Comments are discarded during tokenization, including `//` line comments and `/* ... */` block comments. Parsing should produce a predictable AST for the evaluator and reject malformed syntax before any side effect is possible.

Add 1:1 tests for every parser module. Include nesting, precedence, async forms, event and timer declarations, malformed delimiters, and comment placement. Update [grammar](../language/grammar.md) and a small example when syntax changes.
