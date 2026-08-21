# Statements

Statements include assignment, function declarations, `return`, `if`/`else`, `for`, `while`, `break`, `continue`, `throw`, event and timer registration, imports, and expression statements. Blocks use `{}` and can contain asynchronous Discord operations in sequence.

Use `break` and `continue` only inside loops. Use `throw` to create a recoverable domain failure, then handle it with the `try { ... } catch (error) { ... } finally { ... }` expression. A statement that mutates Discord should pass dry-run or approval options deliberately and should preserve the result for later branching when useful. See the [control-flow example](../../examples/fundamentals/control-flow-safety.ds).
