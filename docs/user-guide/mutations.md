# Mutations

Mutating operations create or update Discord state. Make them repeatable by discovering existing resources by ID or deterministic name, previewing the intended request, applying the change, and verifying the result.

Pass `dryRun: true` in a script or `--dry-run` on the CLI. Use explicit approval for destructive work. Channel, role, permission, message, member, webhook, and asset examples are indexed in the [examples catalog](../../examples/README.md).
