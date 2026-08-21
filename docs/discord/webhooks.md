# Webhooks

Webhook workflows can inventory, create, update, execute, and delete webhooks where Discord permissions and the adapter support the operation. Webhook URLs contain credentials; do not print, commit, or place them in public examples.

Use environment variables for webhook secrets and return redacted metadata in JSON. Deleting a webhook is destructive and requires explicit approval. For repeatable setup, find a webhook by name and target channel before creating another one.

See [authentication](authentication.md), [security](../operations/security.md), and the [CRUD matrix](crud-matrix.md).
