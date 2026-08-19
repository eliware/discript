export function createDiscordApi(client, { yes = false, dryRun = false } = {}) {
  const mapCache = (cache, mapper) => typeof cache?.map === 'function' ? cache.map(mapper) : [...(cache?.values?.() ?? [])].map(mapper);
  const requireApproval = (action, operationOptions = {}) => {
    if (dryRun || operationOptions.dryRun === true) return;
    if (!yes && operationOptions.force !== true) throw Object.assign(new Error(`${action} requires --yes or force: true.`), { code: 'CONFIRMATION_REQUIRED', exitCode: 2 });
  };
  const normalizeChannel = channel => ({ id: channel.id, name: channel.name, type: channel.type });
  const normalizeMessage = message => ({ id: message.id, channelId: message.channelId, content: message.content ?? null });
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
  const requireChannelPermission = (channelId, permission) => {
    const channel = client.channels.cache.get(String(channelId));
    const botMember = channel?.guild?.members?.me;
    if (botMember?.permissions?.has && !botMember.permissions.has(permission)) throw Object.assign(new Error(`Bot lacks ${permission} permission.`), { code: 'MISSING_PERMISSION', exitCode: 5 });
  };
  return {
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
          threads: {
            list: () => mapCache(channel.threads?.cache, thread => ({ id: thread.id, name: thread.name, archived: thread.archived ?? false })),
            create: async (name, operationOptions = {}) => {
              requireApproval('Creating a thread', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, name, created: true };
              const thread = await channel.threads.create({ name: String(name) });
              return { id: thread.id, name: thread.name, created: true };
            },
            archive: async (threadId, operationOptions = {}) => {
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
                  requirePermission(guild, 'BanMembers');
                  requireApproval('Banning a member', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, banned: true, reason: reason ?? null };
                  await member.ban({ reason: reason ?? undefined });
                  return { memberId: member.id, banned: true };
                },
                kick: async (reason, operationOptions = {}) => {
                  requirePermission(guild, 'KickMembers');
                  requireApproval('Kicking a member', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, kicked: true, reason: reason ?? null };
                  await member.kick(reason ?? undefined);
                  return { memberId: member.id, kicked: true };
                },
                timeout: async (durationMs, reason, operationOptions = {}) => {
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
                threads: {
                  list: () => mapCache(channel.threads?.cache, thread => ({ id: thread.id, name: thread.name, archived: thread.archived ?? false })),
                  create: async (name, operationOptions = {}) => {
                    requireApproval('Creating a thread', operationOptions);
                    if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: channel.id, name, created: true };
                    const thread = await channel.threads.create({ name: String(name) });
                    return { id: thread.id, name: thread.name, created: true };
                  },
                  archive: async (threadId, operationOptions = {}) => {
                    requireApproval('Archiving a thread', operationOptions);
                    if (dryRun || operationOptions.dryRun === true) return { dryRun: true, threadId: String(threadId), archived: true };
                    const thread = channel.threads?.cache?.get(String(threadId));
                    if (!thread) throw Object.assign(new Error(`Thread not found: ${threadId}`), { code: 'THREAD_NOT_FOUND', exitCode: 1 });
                    await thread.setArchived(true);
                    return { id: thread.id, archived: true };
                  },
                },
                send: async (content, operationOptions = {}) => {
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
}
