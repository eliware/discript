# Destructive operations

Deletion, kicks, bans, bulk cleanup, and broad permission changes require explicit approval. First run the same operation with `--dry-run`; inspect the target, scope, and planned changes, then use `--yes` or `-y`. Scripts can pass the equivalent `force: true` option.

Keep destructive examples pointed at `TEST_GUILD`, use IDs, and verify the postcondition. See [safety](safety.md), [approval gates](../agents/approval-gates.md), and [Discord coverage](../discord/crud-matrix.md).
