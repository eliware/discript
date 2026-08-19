# Permissions

The bot needs `ViewChannel` and the relevant read intents for inspection. Mutations require Discord permissions such as `ManageChannels`, `ManageRoles`, `ManageMessages`, `ManageWebhooks`, `ManageGuild`, or moderation permissions depending on the operation.

Discript’s `permissions` API manages channel permission overwrites. Treat role and user IDs as opaque strings. Discord’s `@everyone` overwrite is represented by the guild ID. Verify effective permissions in Discord when diagnosing a failed mutation; a successful API request does not guarantee the bot can perform a later dependent operation.

