# Discord Capability Surface

Discript shall provide a standard library covering the major Discord resources and operations needed for automation.

The initial capability surface should be informed by `/opt/discommand`, including guilds, channels, threads, messages, members, roles, moderation, invites, emojis, stickers, scheduled events, voice operations, permissions, and bot identity.

Discommand is a reference for capability coverage and behavior. Discript shall not depend on or require its MCP server.

Capabilities shall classify operations as read-only, mutating, or destructive. Mutations shall support preview-only execution, and destructive operations shall require explicit force approval from both the CLI and scripting language.

Channel provisioning shall support text, voice, and category channel creation; parent assignment; moving channels between categories; removing a channel from its category; and explicit channel position/sort-order changes. These operations shall be available through the scripting API and equivalent CLI options, with dry-run and approval behavior preserved.
