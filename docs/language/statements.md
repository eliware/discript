# Statements

Statements include assignment, function declarations, `return`, `if`/`else`, `for`, `while`, `break`, `continue`, `throw`, `defer`, event and timer registration, imports, and expression statements. Blocks use `{}` and can contain asynchronous Discord operations in sequence.

Use `break` and `continue` only inside loops. Use `throw` to create a recoverable domain failure, then handle it with the `try { ... } catch (error) { ... } finally { ... }` expression. `defer callback` registers a zero-argument cleanup function; callbacks run in reverse order during runtime shutdown, including error and explicit-exit paths. A statement that mutates Discord should pass dry-run or approval options deliberately and should preserve the result for later branching when useful. See the [control-flow example](../../examples/fundamentals/control-flow-safety.ds) and [deferred cleanup example](../../examples/fundamentals/deferred-cleanup.ds).
# Function scope and closures

Function calls receive a fresh local scope for parameters and variables created
inside the function. A nested function captures the lexical scope where it was
declared, so assignments to an existing outer binding persist between calls:

```ds
fn counter(start) {
  current = start
  fn next() { current += 1; return current }
  return next
}

next = counter(0)
print(next()) // 1
print(next()) // 2
```

This is useful for stateful formatters, throttlers, and small per-resource
workflows. Parameters and new local variables do not leak back to the caller.
