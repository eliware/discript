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
  return {
    messages: {
      get: async (channelId, messageId) => normalizeMessage(await resolveMessage(channelId, messageId)),
      edit: async (channelId, messageId, content, operationOptions = {}) => {
        requireApproval('Editing a message', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageId: String(messageId), content };
        return normalizeMessage(await (await resolveMessage(channelId, messageId)).edit(String(content)));
      },
      delete: async (channelId, messageId, operationOptions = {}) => {
        requireApproval('Deleting a message', operationOptions);
        if (dryRun || operationOptions.dryRun === true) return { dryRun: true, channelId: String(channelId), messageId: String(messageId), deleted: true };
        await (await resolveMessage(channelId, messageId)).delete();
        return { id: String(messageId), deleted: true };
      },
    },
    channels: {
      get: id => {
        const channel = client.channels.cache.get(String(id));
        if (!channel) throw Object.assign(new Error(`Channel not found: ${id}`), { code: 'CHANNEL_NOT_FOUND', exitCode: 1 });
        return {
          ...normalizeChannel(channel),
          delete: async (operationOptions = {}) => {
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
                  requireApproval('Adding a role', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, roleId: String(roleId), added: true };
                  await member.roles.add(String(roleId));
                  return { memberId: member.id, roleId: String(roleId), added: true };
                },
                removeRole: async (roleId, operationOptions = {}) => {
                  requireApproval('Removing a role', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, roleId: String(roleId), removed: true };
                  await member.roles.remove(String(roleId));
                  return { memberId: member.id, roleId: String(roleId), removed: true };
                },
                ban: async (reason, operationOptions = {}) => {
                  requireApproval('Banning a member', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, banned: true, reason: reason ?? null };
                  await member.ban({ reason: reason ?? undefined });
                  return { memberId: member.id, banned: true };
                },
                kick: async (reason, operationOptions = {}) => {
                  requireApproval('Kicking a member', operationOptions);
                  if (dryRun || operationOptions.dryRun === true) return { dryRun: true, memberId: member.id, kicked: true, reason: reason ?? null };
                  await member.kick(reason ?? undefined);
                  return { memberId: member.id, kicked: true };
                },
                timeout: async (durationMs, reason, operationOptions = {}) => {
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
            get: id => {
              const role = guild.roles.cache.get(String(id));
              if (!role) throw Object.assign(new Error(`Role not found: ${id}`), { code: 'ROLE_NOT_FOUND', exitCode: 1 });
              return { id: role.id, name: role.name, position: role.position, managed: role.managed };
            },
          },
          channels: {
            list: () => guild.channels.cache.map(normalizeChannel),
            create: async (name, operationOptions = {}) => {
              requireApproval('Creating a channel', operationOptions);
              if (dryRun || operationOptions.dryRun === true) return { dryRun: true, guildId: guild.id, name, type: 0 };
              return normalizeChannel(await guild.channels.create({ name: String(name), type: 0 }));
            },
            get: channelId => {
              const channel = guild.channels.cache.get(String(channelId));
              if (!channel) throw Object.assign(new Error(`Channel not found: ${channelId}`), { code: 'CHANNEL_NOT_FOUND', exitCode: 1 });
              return {
                ...normalizeChannel(channel),
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
