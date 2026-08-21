# Discord adapter

The Discord adapter is the boundary between Discript operations and `discord.js`. Keep Discord-specific fetch, normalization, mutation, and error translation in the adapter rather than spreading SDK calls through the parser or evaluator.

The adapter should expose stable resource operations for guilds, channels, roles, members, messages, threads, webhooks, emojis, stickers, invites, and voice-related objects. Normalize results into JSON-safe values and preserve Discord IDs as strings. Destructive operations must receive explicit approval; dry-run should describe the intended request without sending it.

Inject the adapter in unit tests. Live checks should be explicit, use `TEST_GUILD`, and verify cleanup. Changes to gateway intents, rate-limit handling, pagination, permissions, or channel ordering need focused tests and documentation updates.
