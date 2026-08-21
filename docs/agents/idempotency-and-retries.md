# Idempotency and retries

Retries are dangerous when a request may have reached Discord before the client timed out. A retry can create duplicates or repeat a destructive action.

Use deterministic names or external keys, inventory before creating, save returned IDs, and inventory again after timeouts. Retry only the missing or incomplete operation, then verify final state.

The [idempotent upsert example](../../examples/safety/idempotent-upsert.ds) demonstrates lookup-before-create. For multi-step changes retain created resources and use a compensating cleanup path such as [rollback-on-failure.ds](../../examples/safety/rollback-on-failure.ds).

Idempotency does not bypass dry-run, approval, permission, or role-hierarchy safeguards.

