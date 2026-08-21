# Guilds

Guild commands read the current server identity, settings, channels, roles, members, and other resources visible to the bot. A bot can update supported guild settings and perform scoped provisioning, but guild deletion is not exposed because it is an owner-level irreversible action.

Use a stable guild ID in automation. Resolve names only for discovery and display because names are not unique and can change. Keep provisioning idempotent by finding resources by a deterministic name or marker before creating them.

The recommended safe workflow is inventory, dry-run, approved mutation, verification, and cleanup. See [resource aliases](../cli/resource-aliases.md), [CRUD coverage](crud-matrix.md), and the [test-guild guide](../developers/test-guild.md).
