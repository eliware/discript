# Approval gates

Agent workflows should separate planning from application:

1. Read the target state.
2. Produce a dry-run plan in JSON.
3. Validate IDs, permissions, and intended scope.
4. Apply only after explicit approval.
5. Return structured results and an exit status.

CLI approval uses `--yes`. Script approval uses an explicit environment or input decision, followed by `{force: true}`. Keep the approval decision visible in output and do not silently upgrade a preview to an apply.

