# Adding a language feature

A language feature normally crosses five layers: tokenization, parsing, evaluation, Discord/runtime integration, and user-facing examples. Start with the relevant specification page and decide whether the feature is syntax, a built-in operation, or a transport concern.

For syntax, update the focused modules under `src/parser/` and preserve the public `parse()` entry point. Add parser tests for valid forms, precedence, malformed input, and useful source locations. The tokenizer already supports both `//` line comments and `/* ... */` block comments; keep comments transparent to the AST.

For runtime behavior, add the smallest evaluator or command capability, define its result and error contract, and test dry-run, approval, and cleanup behavior when applicable. Add at least one concise `.ds` example and link it from the relevant guide.

Finish by running the full test suite and documentation checker. Review compatibility with stdin scripts, JSON output, socket mode, and MCP mode before calling the feature complete.
