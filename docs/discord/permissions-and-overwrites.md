# Permissions and overwrites

Permissions are evaluated from guild roles, channel overwrites, member identity, and Discord's hierarchy rules. Provisioning should create roles before applying role overwrites, then verify the effective result from the target channel.

Overwrites are channel-scoped and should be expressed by stable role or member IDs. Be explicit about allow and deny sets; an omitted field is not the same as an intentional deny. Changes can lock users out, so preview them and require approval for broad or destructive permission changes.

See [permission concepts](permissions.md), [roles](roles.md), and the [examples index](../../examples/README.md).
