export function createDiscordApi(client, { yes = false, dryRun = false, voiceModule = null } = {}) {
  let loadedVoiceModule = voiceModule;
  const loadVoiceModule = async () => {
    if (!loadedVoiceModule) loadedVoiceModule = await import('@discordjs/voice');
    return loadedVoiceModule;
  };
  const mapCache = (cache, mapper) => typeof cache?.map === 'function' ? cache.map(mapper) : [...(cache?.values?.() ?? [])].map(mapper);
  const requireApproval = (action, operationOptions = {}) => {
    if (dryRun || operationOptions.dryRun === true) return;
    if (!yes && operationOptions.force !== true) throw Object.assign(new Error(`${action} requires --yes or force: true.`), { code: 'CONFIRMATION_REQUIRED', exitCode: 2 });
  };
  const normalizeChannel = channel => ({ id: channel.id, name: channel.name, type: channel.type });
  const normalizeMessage = message => ({ id: message.id, channelId: message.channelId, content: message.content ?? null });
  const normalizeWebhook = webhook => ({ id: webhook.id, name: webhook.name ?? null, channelId: webhook.channelId ?? null, type: webhook.type ?? null });
  const normalizeOverwrite = overwrite => ({ id: overwrite.id, type: overwrite.type ?? null, allow: overwrite.allow?.toArray?.() ?? [], deny: overwrite.deny?.toArray?.() ?? [] });
  const resolveMessage = async (channelId, messageId) => {
    const channel = client.channels.cache.get(String(channelId));
    if (!channel?.messages?.fetch) throw Object.assign(new Error(`Message channel not found: ${channelId}`), { code: 'CHANNEL_NOT_FOUND', exitCode: 1 });
    try { return await channel.messages.fetch(String(messageId)); }
    catch { throw Object.assign(new Error(`Message not found: ${messageId}`), { code: 'MESSAGE_NOT_FOUND', exitCode: 1 }); }
  };
  const requirePermission = (guild, permission) => {
    const botMember = guild?.members?.me;
    if (botMember?.permissions?.has && !botMember.permissions.has(permission)) throw Object.assign(new Error(`Bot lacks ${permission} permission.`), { code: 'MISSING_PERMISSION', exitCode: 5 });
  };
  const requireManageableRole = (guild, roleId) => {
    const role = guild.roles.cache.get(String(roleId));
    if (role?.managed || role?.name === '@everyone') throw Object.assign(new Error('Managed and @everyone roles cannot be changed.'), { code: 'ROLE_PROTECTED', exitCode: 5 });
    const highest = guild.members?.me?.roles?.highest;
    if (highest?.position !== undefined && role?.position !== undefined && role.position >= highest.position) throw Object.assign(new Error('Bot role hierarchy prevents this role change.'), { code: 'ROLE_HIERARCHY', exitCode: 5 });
  };
  const requireManageableMember = (guild, member) => {
    if (member.user?.bot || member.id === guild.ownerId || member.id === guild.members?.me?.id) throw Object.assign(new Error('Bot, owner, and self targets cannot be moderated.'), { code: 'MEMBER_PROTECTED', exitCode: 5 });
    const highest = guild.members?.me?.roles?.highest;
    const targetHighest = member.roles?.highest;
    if (highest?.position !== undefined && targetHighest?.position !== undefined && targetHighest.position >= highest.position) throw Object.assign(new Error('Bot role hierarchy prevents this member moderation.'), { code: 'MEMBER_HIERARCHY', exitCode: 5 });
  };
  const requireChannelPermission = (channelId, permission) => {
    const channel = client.channels.cache.get(String(channelId));
    const botMember = channel?.guild?.members?.me;
    if (botMember?.permissions?.has && !botMember.permissions.has(permission)) throw Object.assign(new Error(`Bot lacks ${permission} permission.`), { code: 'MISSING_PERMISSION', exitCode: 5 });
  };
  return {
    bot: {
      get: () => {
        if (!client.user) throw Object.assign(new Error('Bot identity is unavailable.'), { code: 'BOT_IDENTITY_UNAVAILABLE', exitCode: 1 });
        return { id: client.user.id, username: client.user.username, tag: client.user.tag ?? null };
      },
    },
    voice: {
      status: async guildId => {
        const { getVoiceConnection } = await loadVoiceModule();
        const connection = getVoiceConnection(String(guildId));
        return connection ? { guildId: String(guildId), status: connection.state?.status ?? 'unknown', connected: true } : { guildId: String(guildId), connected: false };
      },
      join: async (channelId, operationOptions = {}) => {
        const channel = client.channels.cache.get(String(channelId));
        if (!channel?.isVoiceBased?.() && !['voice', 'stage'].includes(channel?.type)) throw Object.assign(new Error(`Voice channel not found: ${channelId}`), { code: 'VOICE_CHANNEL_REQUIRED', exitCode: 2 });
        const guild = channel.guild;
        requireChannelPermission(channelId, 'Connect');
        requireApproval('Joining a voice channel', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, guildId: guild.id, channelId: String(channelId), joined: true };
        if (!guild?.voiceAdapterCreator) throw Object.assign(new Error('Voice adapter is unavailable for this guild.'), { code: 'VOICE_UNSUPPORTED', exitCode: 1 });
        const { joinVoiceChannel } = await loadVoiceModule();
        const connection = joinVoiceChannel({ channelId: String(channelId), guildId: String(guild.id), adapterCreator: guild.voiceAdapterCreator, selfDeaf: false });
        return { guildId: String(guild.id), channelId: String(channelId), status: connection.state?.status ?? 'connecting', joined: true };
      },
      leave: async (guildId, operationOptions = {}) => {
        requireApproval('Leaving a voice channel', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, guildId: String(guildId), left: true };
        const { getVoiceConnection } = await loadVoiceModule();
        const connection = getVoiceConnection(String(guildId));
        if (connection) connection.destroy();
        return { guildId: String(guildId), left: true };
      },
    },
    messages: {
      get: async (channelId, messageId) => normalizeMessage(await resolveMessage(channelId, messageId)),
      edit: async (channelId, messageId, content, operationOptions = {}) => {
        requireChannelPermission(channelId, 'ManageMessages');
        requireApproval('Editing a message', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageId: String(messageId), content };
        return normalizeMessage(await (await resolveMessage(channelId, messageId)).edit(String(content)));
      },
      delete: async (channelId, messageId, operationOptions = {}) => {
        requireChannelPermission(channelId, 'ManageMessages');
        requireApproval('Deleting a message', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageId: String(messageId), deleted: true };
        await (await resolveMessage(channelId, messageId)).delete();
        return { id: String(messageId), deleted: true };
      },
      react: async (channelId, messageId, emoji, operationOptions = {}) => {
        requireChannelPermission(channelId, 'AddReactions');
        requireApproval('Reacting to a message', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageId: String(messageId), emoji };
        await (await resolveMessage(channelId, messageId)).react(String(emoji));
        return { id: String(messageId), reacted: true, emoji };
      },
      pin: async (channelId, messageId, operationOptions = {}) => {
        requireChannelPermission(channelId, 'ManageMessages');
        requireApproval('Pinning a message', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageId: String(messageId), pinned: true };
        await (await resolveMessage(channelId, messageId)).pin();
        return { id: String(messageId), pinned: true };
      },
      unpin: async (channelId, messageId, operationOptions = {}) => {
        requireChannelPermission(channelId, 'ManageMessages');
        requireApproval('Unpinning a message', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageId: String(messageId), pinned: false };
        await (await resolveMessage(channelId, messageId)).unpin();
        return { id: String(messageId), pinned: false };
      },
      bulkDelete: async (channelId, messageIds, operationOptions = {}) => {
        requireChannelPermission(channelId, 'ManageMessages');
        requireApproval('Bulk deleting messages', operationOptions);
        const ids = Array.isArray(messageIds) ? messageIds.map(String) : String(messageIds).split(',').map(value => value.trim()).filter(Boolean);
        if (!ids.length) throw Object.assign(new Error('At least one message ID is required.'), { code: 'MESSAGES_REQUIRED', exitCode: 2 });
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageIds: ids, deleted: ids.length };
        const channel = client.channels.cache.get(String(channelId));
        if (!channel?.bulkDelete) throw Object.assign(new Error(`Channel does not support bulk deletion: ${channelId}`), { code: 'BULK_DELETE_UNSUPPORTED', exitCode: 1 });
        const deleted = await channel.bulkDelete(ids);
        return { channelId: String(channelId), deleted: deleted.size ?? ids.length };
      },
    },
    channels: {
      get: id => {
        const channel = client.channels.cache.get(String(id));
        if (!channel) throw Object.assign(new Error(`Channel not found: ${id}`), { code: 'CHANNEL_NOT_FOUND', exitCode: 1 });
        return {
          ...normalizeChannel(channel),
          webhooks: {
            list: async () => {
              if (!channel.fetchWebhooks) throw Object.assign(new Error('Webhook listing is unavailable.'), { code: 'WEBHOOKS_UNSUPPORTED', exitCode: 1 });
              return mapCache(await channel.fetchWebhooks(), normalizeWebhook);
            },
            create: async (name, operationOptions = {}) => {
              if (!name) throw Object.assign(new Error('Webhook creation requires name.'), { code: 'NAME_REQUIRED', exitCode: 2 });
              requireChannelPermission(channel.id, 'ManageWebhooks');
              requireApproval('Creating a webhook', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, name: String(name), created: true };
              if (!channel.createWebhook) throw Object.assign(new Error('Webhook creation is unavailable.'), { code: 'WEBHOOKS_UNSUPPORTED', exitCode: 1 });
              return { ...normalizeWebhook(await channel.createWebhook({ name: String(name), reason: operationOptions.reason })), created: true };
            },
            delete: async (webhookId, operationOptions = {}) => {
              requireChannelPermission(channel.id, 'ManageWebhooks');
              requireApproval('Deleting a webhook', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, webhookId: String(webhookId), deleted: true };
              if (!client.fetchWebhook) throw Object.assign(new Error('Webhook deletion is unavailable.'), { code: 'WEBHOOKS_UNSUPPORTED', exitCode: 1 });
              const webhook = await client.fetchWebhook(String(webhookId));
              await webhook.delete(operationOptions.reason);
              return { id: String(webhookId), deleted: true };
            },
          },
          permissions: {
            list: () => mapCache(channel.permissionOverwrites?.cache, normalizeOverwrite),
            set: async (targetId, settings = {}, operationOptions = {}) => {
              if (!targetId) throw Object.assign(new Error('Permission overwrite requires targetId.'), { code: 'TARGET_REQUIRED', exitCode: 2 });
              if (!Array.isArray(settings.allow) && !Array.isArray(settings.deny)) throw Object.assign(new Error('Permission overwrite requires allow or deny arrays.'), { code: 'PERMISSIONS_REQUIRED', exitCode: 2 });
              requireChannelPermission(channel.id, 'ManageChannels');
              requireApproval('Setting channel permissions', operationOptions);
              const changes = { ...(Array.isArray(settings.allow) ? { allow: settings.allow } : {}), ...(Array.isArray(settings.deny) ? { deny: settings.deny } : {}) };
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, targetId: String(targetId), ...changes, updated: true };
              if (!channel.permissionOverwrites?.edit) throw Object.assign(new Error('Channel permission editing is unavailable.'), { code: 'PERMISSIONS_UNSUPPORTED', exitCode: 1 });
              const overwrite = await channel.permissionOverwrites.edit(String(targetId), changes, { reason: operationOptions.reason });
              return { channelId: channel.id, ...normalizeOverwrite(overwrite), updated: true };
            },
            delete: async (targetId, operationOptions = {}) => {
              if (!targetId) throw Object.assign(new Error('Permission overwrite requires targetId.'), { code: 'TARGET_REQUIRED', exitCode: 2 });
              requireChannelPermission(channel.id, 'ManageChannels');
              requireApproval('Deleting channel permissions', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, targetId: String(targetId), deleted: true };
              if (!channel.permissionOverwrites?.delete) throw Object.assign(new Error('Channel permission deletion is unavailable.'), { code: 'PERMISSIONS_UNSUPPORTED', exitCode: 1 });
              await channel.permissionOverwrites.delete(String(targetId), operationOptions.reason);
              return { channelId: channel.id, targetId: String(targetId), deleted: true };
            },
          },
          threads: {
            list: () => mapCache(channel.threads?.cache, thread => ({ id: thread.id, name: thread.name, archived: thread.archived ?? false })),
            create: async (name, operationOptions = {}) => {
              requireChannelPermission(channel.id, 'CreatePublicThreads');
              requireApproval('Creating a thread', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, name, created: true };
              const thread = await channel.threads.create({ name: String(name) });
              return { id: thread.id, name: thread.name, created: true };
            },
            archive: async (threadId, operationOptions = {}) => {
              requireChannelPermission(channel.id, 'ManageThreads');
              requireApproval('Archiving a thread', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, threadId: String(threadId), archived: true };
              const thread = channel.threads?.cache?.get(String(threadId));
              if (!thread) throw Object.assign(new Error(`Thread not found: ${threadId}`), { code: 'THREAD_NOT_FOUND', exitCode: 1 });
              await thread.setArchived(true);
              return { id: thread.id, archived: true };
            },
          },
          delete: async (operationOptions = {}) => {
            requireChannelPermission(channel.id, 'ManageChannels');
            requireApproval('Deleting a channel', operationOptions);
            if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, deleted: true };
            await channel.delete();
            return { id: channel.id, deleted: true };
          },
          send: async (content, operationOptions = {}) => {
            requireChannelPermission(channel.id, 'SendMessages');
            requireApproval('Sending a message', operationOptions);
            if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, content };
            return normalizeMessage(await channel.send(String(content)));
          },
        };
      },
    },
    guilds: {
      list: () => client.guilds.cache.map(guild => ({ id: guild.id, name: guild.name })),
      get: id => {
        const guild = client.guilds.cache.get(String(id));
        if (!guild) throw Object.assign(new Error(`Guild not found: ${id}`), { code: 'GUILD_NOT_FOUND', exitCode: 1 });
        return {
          id: guild.id,
          name: guild.name,
          members: {
            list: () => mapCache(guild.members.cache, member => ({ id: member.id, username: member.user?.username ?? null, displayName: member.displayName ?? null })),
            get: id => {
              const member = guild.members.cache.get(String(id));
              if (!member) throw Object.assign(new Error(`Member not found: ${id}`), { code: 'MEMBER_NOT_FOUND', exitCode: 1 });
              return {
                id: member.id,
                username: member.user?.username ?? null,
                displayName: member.displayName ?? null,
                roles: mapCache(member.roles?.cache, role => ({ id: role.id, name: role.name })),
                addRole: async (roleId, operationOptions = {}) => {
                  requireManageableRole(guild, roleId);
                  requirePermission(guild, 'ManageRoles');
                  requireApproval('Adding a role', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, roleId: String(roleId), added: true };
                  await member.roles.add(String(roleId));
                  return { memberId: member.id, roleId: String(roleId), added: true };
                },
                removeRole: async (roleId, operationOptions = {}) => {
                  requireManageableRole(guild, roleId);
                  requirePermission(guild, 'ManageRoles');
                  requireApproval('Removing a role', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, roleId: String(roleId), removed: true };
                  await member.roles.remove(String(roleId));
                  return { memberId: member.id, roleId: String(roleId), removed: true };
                },
                ban: async (reason, operationOptions = {}) => {
                  requireManageableMember(guild, member);
                  requirePermission(guild, 'BanMembers');
                  requireApproval('Banning a member', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, banned: true, reason: reason ?? null };
                  await member.ban({ reason: reason ?? undefined });
                  return { memberId: member.id, banned: true };
                },
                kick: async (reason, operationOptions = {}) => {
                  requireManageableMember(guild, member);
                  requirePermission(guild, 'KickMembers');
                  requireApproval('Kicking a member', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, kicked: true, reason: reason ?? null };
                  await member.kick(reason ?? undefined);
                  return { memberId: member.id, kicked: true };
                },
                timeout: async (durationMs, reason, operationOptions = {}) => {
                  requireManageableMember(guild, member);
                  requirePermission(guild, 'ModerateMembers');
                  requireApproval('Timing out a member', operationOptions);
                  if (!Number.isInteger(Number(durationMs)) || Number(durationMs) < 1) throw Object.assign(new Error('Timeout duration must be a positive number of milliseconds.'), { code: 'INVALID_DURATION', exitCode: 2 });
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, timeoutMs: Number(durationMs), reason: reason ?? null };
                  await member.timeout(Number(durationMs), reason ?? undefined);
                  return { memberId: member.id, timeoutMs: Number(durationMs), timedOut: true };
                },
              };
            },
          },
          roles: {
            list: () => mapCache(guild.roles.cache, role => ({ id: role.id, name: role.name, position: role.position, managed: role.managed })),
            create: async (name, operationOptions = {}) => {
              requirePermission(guild, 'ManageRoles');
              requireApproval('Creating a role', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, guildId: guild.id, name, created: true };
              const role = await guild.roles.create({ name: String(name) });
              return { id: role.id, name: role.name, created: true };
            },
            get: id => {
              const role = guild.roles.cache.get(String(id));
              if (!role) throw Object.assign(new Error(`Role not found: ${id}`), { code: 'ROLE_NOT_FOUND', exitCode: 1 });
              return {
                id: role.id, name: role.name, position: role.position, managed: role.managed,
                update: async (settings = {}, operationOptions = {}) => {
                  requireManageableRole(guild, role.id);
                  requirePermission(guild, 'ManageRoles');
                  requireApproval('Updating a role', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: role.id, settings };
                  const updated = await role.edit(settings);
                  return { id: updated.id, name: updated.name, updated: true };
                },
                delete: async (operationOptions = {}) => {
                  requireManageableRole(guild, role.id);
                  requirePermission(guild, 'ManageRoles');
                  requireApproval('Deleting a role', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: role.id, deleted: true };
                  await role.delete();
                  return { id: role.id, deleted: true };
                },
              };
            },
          },
          emojis: {
            list: () => mapCache(guild.emojis?.cache, emoji => ({ id: emoji.id, name: emoji.name, animated: emoji.animated ?? false })),
            get: id => {
              const emoji = guild.emojis?.cache?.get(String(id));
              if (!emoji) throw Object.assign(new Error(`Emoji not found: ${id}`), { code: 'EMOJI_NOT_FOUND', exitCode: 1 });
              return { id: emoji.id, name: emoji.name, animated: emoji.animated ?? false };
            },
            create: async (settings = {}, operationOptions = {}) => {
              if (!settings.name || !settings.attachment) throw Object.assign(new Error('Emoji creation requires name and attachment.'), { code: 'EMOJI_FIELDS_REQUIRED', exitCode: 2 });
              requirePermission(guild, 'ManageExpressions');
              requireApproval('Creating an emoji', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, settings };
              const emoji = await guild.emojis.create({ attachment: settings.attachment, name: String(settings.name), reason: settings.reason });
              return { id: emoji.id, name: emoji.name, animated: emoji.animated ?? false, created: true };
            },
            update: async (id, settings = {}, operationOptions = {}) => {
              const emoji = guild.emojis?.cache?.get(String(id));
              if (!emoji) throw Object.assign(new Error(`Emoji not found: ${id}`), { code: 'EMOJI_NOT_FOUND', exitCode: 1 });
              if (!settings.name) throw Object.assign(new Error('Emoji update requires name.'), { code: 'NAME_REQUIRED', exitCode: 2 });
              requirePermission(guild, 'ManageExpressions');
              requireApproval('Updating an emoji', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: emoji.id, settings };
              const updated = await emoji.edit({ name: String(settings.name), reason: settings.reason });
              return { id: updated.id, name: updated.name, animated: updated.animated ?? false, updated: true };
            },
            delete: async (id, operationOptions = {}) => {
              const emoji = guild.emojis?.cache?.get(String(id));
              if (!emoji) throw Object.assign(new Error(`Emoji not found: ${id}`), { code: 'EMOJI_NOT_FOUND', exitCode: 1 });
              requirePermission(guild, 'ManageExpressions');
              requireApproval('Deleting an emoji', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: emoji.id, deleted: true };
              await emoji.delete(settingsReason(operationOptions));
              return { id: emoji.id, deleted: true };
            },
          },
          stickers: {
            list: () => mapCache(guild.stickers?.cache, sticker => ({ id: sticker.id, name: sticker.name, description: sticker.description ?? null })),
            get: id => {
              const sticker = guild.stickers?.cache?.get(String(id));
              if (!sticker) throw Object.assign(new Error(`Sticker not found: ${id}`), { code: 'STICKER_NOT_FOUND', exitCode: 1 });
              return { id: sticker.id, name: sticker.name, description: sticker.description ?? null };
            },
            create: async (settings = {}, operationOptions = {}) => {
              if (!settings.name || !settings.file || !settings.tags) throw Object.assign(new Error('Sticker creation requires name, file, and tags.'), { code: 'STICKER_FIELDS_REQUIRED', exitCode: 2 });
              requirePermission(guild, 'ManageExpressions');
              requireApproval('Creating a sticker', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, settings };
              const sticker = await guild.stickers.create({ file: settings.file, name: String(settings.name), description: settings.description, tags: String(settings.tags), reason: settings.reason });
              return { id: sticker.id, name: sticker.name, description: sticker.description ?? null, created: true };
            },
            update: async (id, settings = {}, operationOptions = {}) => {
              const sticker = guild.stickers?.cache?.get(String(id));
              if (!sticker) throw Object.assign(new Error(`Sticker not found: ${id}`), { code: 'STICKER_NOT_FOUND', exitCode: 1 });
              if (!settings.name && !settings.description && !settings.tags) throw Object.assign(new Error('Sticker update requires name, description, or tags.'), { code: 'STICKER_FIELDS_REQUIRED', exitCode: 2 });
              requirePermission(guild, 'ManageExpressions');
              requireApproval('Updating a sticker', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: sticker.id, settings };
              const updated = await sticker.edit({ name: settings.name, description: settings.description, tags: settings.tags, reason: settings.reason });
              return { id: updated.id, name: updated.name, description: updated.description ?? null, updated: true };
            },
            delete: async (id, operationOptions = {}) => {
              const sticker = guild.stickers?.cache?.get(String(id));
              if (!sticker) throw Object.assign(new Error(`Sticker not found: ${id}`), { code: 'STICKER_NOT_FOUND', exitCode: 1 });
              requirePermission(guild, 'ManageExpressions');
              requireApproval('Deleting a sticker', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: sticker.id, deleted: true };
              await sticker.delete(settingsReason(operationOptions));
              return { id: sticker.id, deleted: true };
            },
          },
          scheduledEvents: {
            list: () => mapCache(guild.scheduledEvents?.cache, event => ({ id: event.id, name: event.name, status: event.status ?? null, scheduledStartAt: event.scheduledStartAt?.toISOString?.() ?? event.scheduledStartAt ?? null, scheduledEndAt: event.scheduledEndAt?.toISOString?.() ?? event.scheduledEndAt ?? null })),
            create: async (settings = {}, operationOptions = {}) => {
              if (!guild.scheduledEvents?.create) throw Object.assign(new Error('Scheduled event creation is unavailable.'), { code: 'SCHEDULED_EVENTS_UNSUPPORTED', exitCode: 1 });
              requirePermission(guild, 'ManageEvents');
              requireApproval('Creating a scheduled event', operationOptions);
              if (!settings.name || !settings.scheduledStartTime) throw Object.assign(new Error('Scheduled event requires name and scheduledStartTime.'), { code: 'EVENT_FIELDS_REQUIRED', exitCode: 2 });
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, settings };
              const event = await guild.scheduledEvents.create(settings);
              return { id: event.id, name: event.name, created: true };
            },
            get: id => {
              const event = guild.scheduledEvents?.cache?.get(String(id));
              if (!event) throw Object.assign(new Error(`Scheduled event not found: ${id}`), { code: 'SCHEDULED_EVENT_NOT_FOUND', exitCode: 1 });
              return {
                id: event.id,
                name: event.name,
                status: event.status ?? null,
                update: async (settings = {}, operationOptions = {}) => {
                  requirePermission(guild, 'ManageEvents');
                  requireApproval('Updating a scheduled event', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: event.id, settings };
                  const updated = await event.edit(settings);
                  return { id: updated.id, name: updated.name, updated: true };
                },
                delete: async (operationOptions = {}) => {
                  requirePermission(guild, 'ManageEvents');
                  requireApproval('Deleting a scheduled event', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, id: event.id, deleted: true };
                  await event.delete();
                  return { id: event.id, deleted: true };
                },
              };
            },
          },
          invites: {
            list: async () => {
              if (!guild.invites?.fetch) throw Object.assign(new Error('Invite listing is unavailable.'), { code: 'INVITES_UNSUPPORTED', exitCode: 1 });
              const invites = await guild.invites.fetch();
              return mapCache(invites, invite => ({ code: invite.code, url: invite.url, uses: invite.uses ?? 0, channelId: invite.channelId ?? null }));
            },
            create: async (channelId, inviteOptions = {}, operationOptions = {}) => {
              const channel = guild.channels.cache.get(String(channelId));
              if (!channel?.createInvite) throw Object.assign(new Error(`Invite creation is unavailable for channel: ${channelId}`), { code: 'INVITES_UNSUPPORTED', exitCode: 1 });
              requirePermission(guild, 'CreateInstantInvite');
              requireApproval('Creating an invite', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), options: inviteOptions };
              const invite = await channel.createInvite(inviteOptions);
              return { code: invite.code, url: invite.url, channelId: invite.channelId ?? String(channelId), created: true };
            },
            delete: async (code, operationOptions = {}) => {
              requirePermission(guild, 'ManageGuild');
              if (!client.invites?.delete) throw Object.assign(new Error('Invite deletion is unavailable.'), { code: 'INVITES_UNSUPPORTED', exitCode: 1 });
              requireApproval('Deleting an invite', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, code: String(code), deleted: true };
              await client.invites.delete(String(code));
              return { code: String(code), deleted: true };
            },
          },
          channels: {
            list: () => guild.channels.cache.map(normalizeChannel),
            create: async (name, operationOptions = {}) => {
              requirePermission(guild, 'ManageChannels');
              requireApproval('Creating a channel', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, guildId: guild.id, name, type: 0 };
              return normalizeChannel(await guild.channels.create({ name: String(name), type: 0 }));
            },
            get: channelId => {
              const channel = guild.channels.cache.get(String(channelId));
              if (!channel) throw Object.assign(new Error(`Channel not found: ${channelId}`), { code: 'CHANNEL_NOT_FOUND', exitCode: 1 });
              return {
                ...normalizeChannel(channel),
                webhooks: {
                  list: async () => {
                    if (!channel.fetchWebhooks) throw Object.assign(new Error('Webhook listing is unavailable.'), { code: 'WEBHOOKS_UNSUPPORTED', exitCode: 1 });
                    return mapCache(await channel.fetchWebhooks(), normalizeWebhook);
                  },
                  create: async (name, operationOptions = {}) => {
                    if (!name) throw Object.assign(new Error('Webhook creation requires name.'), { code: 'NAME_REQUIRED', exitCode: 2 });
                    requireChannelPermission(channel.id, 'ManageWebhooks');
                    requireApproval('Creating a webhook', operationOptions);
                    if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, name: String(name), created: true };
                    if (!channel.createWebhook) throw Object.assign(new Error('Webhook creation is unavailable.'), { code: 'WEBHOOKS_UNSUPPORTED', exitCode: 1 });
                    return { ...normalizeWebhook(await channel.createWebhook({ name: String(name), reason: operationOptions.reason })), created: true };
                  },
                  delete: async (webhookId, operationOptions = {}) => {
                    requireChannelPermission(channel.id, 'ManageWebhooks');
                    requireApproval('Deleting a webhook', operationOptions);
                    if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, webhookId: String(webhookId), deleted: true };
                    if (!client.fetchWebhook) throw Object.assign(new Error('Webhook deletion is unavailable.'), { code: 'WEBHOOKS_UNSUPPORTED', exitCode: 1 });
                    const webhook = await client.fetchWebhook(String(webhookId));
                    await webhook.delete(operationOptions.reason);
                    return { id: String(webhookId), deleted: true };
                  },
                },
                permissions: {
                  list: () => mapCache(channel.permissionOverwrites?.cache, normalizeOverwrite),
                  set: async (targetId, settings = {}, operationOptions = {}) => {
                    if (!targetId) throw Object.assign(new Error('Permission overwrite requires targetId.'), { code: 'TARGET_REQUIRED', exitCode: 2 });
                    if (!Array.isArray(settings.allow) && !Array.isArray(settings.deny)) throw Object.assign(new Error('Permission overwrite requires allow or deny arrays.'), { code: 'PERMISSIONS_REQUIRED', exitCode: 2 });
                    requireChannelPermission(channel.id, 'ManageChannels');
                    requireApproval('Setting channel permissions', operationOptions);
                    const changes = { ...(Array.isArray(settings.allow) ? { allow: settings.allow } : {}), ...(Array.isArray(settings.deny) ? { deny: settings.deny } : {}) };
                    if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, targetId: String(targetId), ...changes, updated: true };
                    if (!channel.permissionOverwrites?.edit) throw Object.assign(new Error('Channel permission editing is unavailable.'), { code: 'PERMISSIONS_UNSUPPORTED', exitCode: 1 });
                    const overwrite = await channel.permissionOverwrites.edit(String(targetId), changes, { reason: operationOptions.reason });
                    return { channelId: channel.id, ...normalizeOverwrite(overwrite), updated: true };
                  },
                  delete: async (targetId, operationOptions = {}) => {
                    if (!targetId) throw Object.assign(new Error('Permission overwrite requires targetId.'), { code: 'TARGET_REQUIRED', exitCode: 2 });
                    requireChannelPermission(channel.id, 'ManageChannels');
                    requireApproval('Deleting channel permissions', operationOptions);
                    if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, targetId: String(targetId), deleted: true };
                    if (!channel.permissionOverwrites?.delete) throw Object.assign(new Error('Channel permission deletion is unavailable.'), { code: 'PERMISSIONS_UNSUPPORTED', exitCode: 1 });
                    await channel.permissionOverwrites.delete(String(targetId), operationOptions.reason);
                    return { channelId: channel.id, targetId: String(targetId), deleted: true };
                  },
                },
                threads: {
                  list: () => mapCache(channel.threads?.cache, thread => ({ id: thread.id, name: thread.name, archived: thread.archived ?? false })),
                  create: async (name, operationOptions = {}) => {
                    requireChannelPermission(channel.id, 'CreatePublicThreads');
                    requireApproval('Creating a thread', operationOptions);
                    if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, name, created: true };
                    const thread = await channel.threads.create({ name: String(name) });
                    return { id: thread.id, name: thread.name, created: true };
                  },
                  archive: async (threadId, operationOptions = {}) => {
                    requireChannelPermission(channel.id, 'ManageThreads');
                    requireApproval('Archiving a thread', operationOptions);
                    if (dryRun || operationOptions.dryRun === true) return { dryRun: true, threadId: String(threadId), archived: true };
                    const thread = channel.threads?.cache?.get(String(threadId));
                    if (!thread) throw Object.assign(new Error(`Thread not found: ${threadId}`), { code: 'THREAD_NOT_FOUND', exitCode: 1 });
                    await thread.setArchived(true);
                    return { id: thread.id, archived: true };
                  },
                },
                send: async (content, operationOptions = {}) => {
                  requireChannelPermission(channel.id, 'SendMessages');
                  requireApproval('Sending a message', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, content };
                  return normalizeMessage(await channel.send(String(content)));
                },
              };
            },
          },
        };
      },
    },
  };

  function settingsReason(operationOptions) {
    return operationOptions?.reason === undefined ? undefined : String(operationOptions.reason);
  }
}
