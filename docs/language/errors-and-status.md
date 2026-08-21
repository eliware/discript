# Errors and status

Use `throw` for a recoverable script-level failure and `exit(code, message)` for an intentional process result:

```text
if (env.TEST_GUILD == null) {
  exit(2, "set TEST_GUILD")
}
```

`try` returns a status object instead of silently discarding the failure:

```ds
result = try { throw {code: "INVALID_PLAN", message: "missing channel"} }
catch (error) { error }
finally { print("validation complete") }
```

Loop `break` and `continue` are handled by the evaluator and do not become errors. Unexpected failures still propagate to the CLI's stable error and process exit contract.

Use conditionals to branch on validation results before a mutation. Let unexpected exceptions reach the CLI so the process returns a nonzero status and emits a structured error. A script-level status should explain the decision to an agent rather than hide a Discord failure.
