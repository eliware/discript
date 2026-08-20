# Discord Capability Surface

Discript shall provide a standard library covering the major Discord resources and operations needed for automation.

The initial capability surface should be informed by `/opt/discommand`, including guilds, channels, threads, messages, members, roles, moderation, invites, emojis, stickers, scheduled events, voice operations, permissions, and bot identity.

Discommand is a reference for capability coverage and behavior. Discript shall not depend on or require its MCP server.

One-shot operations use the lightest available transport: supported reads and mutations use Discord REST, while event listeners, cache-dependent workflows, and Gateway-only voice behavior use Discord Gateway/runtime services. The persistent broker is an optional local process boundary, not an MCP server and not a replacement for the Discord API.

Capabilities shall classify operations as read-only, mutating, or destructive. Mutations shall support preview-only execution, and destructive operations shall require explicit force approval from both the CLI and scripting language.

Channel provisioning shall support text, voice, and category channel creation; parent assignment; moving channels between categories; removing a channel from its category; and explicit channel position/sort-order changes. These operations shall be available through the scripting API and equivalent CLI options, with dry-run and approval behavior preserved.

## CRUD matrix

| Object | Create | Read | Update | Delete | Current implementation |
|---|---|---|---|---|---|
| Guild | N/A | Yes | N/A | N/A | Guild lifecycle is managed outside the bot API. |
| Bot identity | N/A | Yes | N/A | N/A | `bot.get()`. |
| Text, voice, and category channels | Yes | Yes | Yes | Yes | Type, parent/category, uncategorized, position, name, and topic are supported. |
| Messages | Yes | Yes | Yes | Yes | Send, list, get, edit, delete, react, pin, unpin, and bulk-delete. |
| Members | N/A | Yes | Yes* | Yes* | Role and voice updates; kick/ban represent deletion. |
| Roles | Yes | Yes | Yes | Yes | Guarded by permissions and role hierarchy. |
| Permission overwrites | N/A | Yes | Yes | Yes | Set and delete overwrite state. |
| Threads | Yes | Yes | Yes | Yes | Create, list, update, archive, and delete. |
| Webhooks | Yes | Yes | Yes | Yes | Create, list, update, and delete. |
| Invites | Yes | Yes | N/A | Yes | Discord invite codes cannot be updated in place. |
| Emojis | Yes | Yes | Yes | Yes | Guild emoji lifecycle. |
| Stickers | Yes | Yes | Yes | Yes | Guild sticker lifecycle. |
| Scheduled events | Yes | Yes | Yes | Yes | Full lifecycle. |
| Voice connection/state | N/A | Yes | Yes | N/A | Status, join, leave, mute, deafen, move, and disconnect. |

`*` Member update/delete are Discord actions rather than literal member-record CRUD: role/voice/moderation updates and kick/ban are the supported equivalents.
