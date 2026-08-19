# Discord API reference

The script API is rooted at `discord`. Methods return normalized plain objects or arrays, not Discord.js collections. IDs are strings. Mutating methods accept an options object where supported, commonly including `dryRun`, `force`, and `reason`.

## Root and guild paths

```text
discord.bot.get()
discord.guilds.list()
guild = discord.guilds.get(guildId)
```

Guild handles expose `channels`, `roles`, `members`, `invites`, `scheduledEvents`, `emojis`, and `stickers`. Global channel lookup is `discord.channels.get(channelId)`.

## Guild resources

```text
guild.channels.list()
guild.channels.create(name, {type: "text"|"voice"|"category", parent: categoryId, position: number, dryRun: true})
guild.roles.list()
guild.roles.create(name, {force: true})
guild.roles.get(roleId).update(settings, {force: true})
guild.roles.get(roleId).delete({force: true})
guild.members.list()
guild.members.get(userId).addRole(roleId, {force: true})
guild.members.get(userId).removeRole(roleId, {force: true})
```

Member moderation methods include `ban(reason, options)`, `kick(reason, options)`, and `timeout(durationMs, reason, options)`. Voice methods include `voice.status()`, `voice.mute(boolean, options)`, `voice.deafen(boolean, options)`, `voice.move(channelId, options)`, and `voice.disconnect(options)`.

## Channel resources

```text
channel = discord.channels.get(channelId)
channel.update({name, topic, parent, position, uncategorized}, {force: true})
channel.delete({force: true})
channel.send(content, {dryRun: true})
channel.threads.list()
channel.threads.create(name, {force: true})
channel.threads.update(threadId, {name}, {force: true})
channel.threads.archive(threadId, {force: true})
channel.threads.delete(threadId, {force: true})
```

Channel permission methods are `channel.permissions.list()`, `channel.permissions.set(targetId, {allow: [...], deny: [...]}, options)`, and `channel.permissions.delete(targetId, options)`.

## Messages

```text
discord.messages.list(channelId, {limit: number})
discord.messages.get(channelId, messageId)
discord.messages.edit(channelId, messageId, content, options)
discord.messages.delete(channelId, messageId, options)
discord.messages.react(channelId, messageId, emoji, options)
discord.messages.pin(channelId, messageId, options)
discord.messages.unpin(channelId, messageId, options)
discord.messages.bulkDelete(channelId, [messageId], options)
```

## Webhooks, invites, and events

```text
channel.webhooks.list()
channel.webhooks.create(name, options)
channel.webhooks.update(webhookId, {name}, options)
channel.webhooks.delete(webhookId, options)
guild.invites.list()
guild.invites.create(channelId, settings, options)
guild.invites.delete(code, options)
guild.scheduledEvents.list()
guild.scheduledEvents.create(settings, options)
guild.scheduledEvents.update(eventId, settings, options)
guild.scheduledEvents.delete(eventId, options)
```

## Result conventions

List methods return arrays. Mutation results commonly include an identifier and a flag such as `{created: true}`, `{updated: true}`, `{deleted: true}`, `{kicked: true}`, or `{banned: true}`. Dry-run results include `dryRun: true` and the target/settings that would be used. Resource-specific fields follow the normalized adapter output.

## Capability boundaries

Guild creation/deletion is `N/A`. Member deletion is represented by kick or ban. Discord permissions, bot hierarchy, managed roles, rate limits, and resource ownership can still reject a validly shaped call; callers must handle the resulting stable error and process status.
