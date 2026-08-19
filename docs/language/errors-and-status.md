# Errors and status

Use `exit(code, message)` for an intentional process result:

```text
if (env.TEST_GUILD == null) {
  exit(2, "set TEST_GUILD")
}
```

Use conditionals to branch on validation results before a mutation. Let unexpected exceptions reach the CLI so the process returns a nonzero status and emits a structured error. A script-level status should explain the decision to an agent rather than hide a Discord failure.

