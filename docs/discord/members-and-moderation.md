# Members and moderation

Member workflows can inspect members and apply supported moderation actions such as timeout, role changes, kick, and ban when the bot's hierarchy and permissions allow them. “Deleting” a member means kicking or banning; Discord does not provide a generic member-delete operation.

Moderation is consequential. Preview the target and reason with dry-run, require `--yes`/`-y` or script-level approval for kick, ban, and bulk changes, and record a safe audit result without exposing tokens or private content. Never assume a display name uniquely identifies a member; prefer IDs.

See [approval gates](../agents/approval-gates.md), [destructive operations](../user-guide/destructive-operations.md), and [permissions](permissions.md).
