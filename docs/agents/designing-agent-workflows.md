# Designing agent workflows

Use explicit phases: discover, inventory, plan, validate, preview, approve, apply, and verify. Keep each phase observable and restartable.

Store IDs returned by operations instead of guessing names after mutation. Use `try` expressions for recoverable per-item failures and reserve `exit()` for workflow-level decisions.

The [preview-then-apply example](../../examples/safety/preview-then-apply.ds) demonstrates the approval boundary. For complete agent reports see [result-envelope.ds](../../examples/agents/result-envelope.ds) and [post-deployment-verification.ds](../../examples/use-cases/post-deployment-verification.ds).

For remote execution, discover the MCP server and confirm `run_discript` before sending source. Keep destructive approval in the caller and pass `force: true` only for the final approved operation.

