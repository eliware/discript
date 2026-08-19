# CRUD coverage

The authoritative capability table is maintained in [specs/07-discord-capability-surface.md](../../specs/07-discord-capability-surface.md). Keep this page as the user-facing summary and update both together when coverage changes.

| Resource | Create | Read | Update | Delete / equivalent |
| --- | --- | --- | --- | --- |
| Guild | N/A | Yes | Limited | N/A |
| Channel/category/voice | Yes | Yes | Yes | Yes |
| Role | Yes | Yes | Yes | Yes |
| Member | N/A | Yes | Limited | Kick/ban |
| Message | Yes | Yes | Yes | Yes |
| Thread | Yes | Yes | Yes | Yes |
| Permissions | Yes/set | Yes | Yes | Delete overwrite |
| Webhook | Yes | Yes | Yes | Yes |
| Invite | Yes | Yes | N/A | Yes |
| Scheduled event | Yes | Yes | Yes | Yes |
| Emoji/sticker | Yes | Yes | Yes | Yes |

N/A means Discord does not expose a meaningful or safe equivalent, not that the implementation is missing.

