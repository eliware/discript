# Roles

Role workflows can list, create, update, reorder, and delete roles subject to Discord hierarchy and permission rules. A bot cannot manage roles above its highest role. Use stable role IDs after discovery rather than relying on display names alone.

Provisioning should create roles before channel overwrites, then verify both role order and effective channel permissions. Deleting a role is destructive and requires explicit approval; dry-run should show the role and dependent permission changes that would be affected.

See [permissions and overwrites](permissions-and-overwrites.md), [CRUD coverage](crud-matrix.md), and the [examples index](../../examples/README.md).
