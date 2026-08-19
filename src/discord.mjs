export function createDiscordApi(client, { yes = false, dryRun = false } = {}) {
  const requireApproval = action => {
    if (dryRun) return;
    if (!yes) throw Object.assign(new Error(`${action} requires --yes.`), { code: 'CONFIRMATION_REQUIRED', exitCode: 2 });
  };
  const normalizeChannel = channel => ({ id: channel.id, name: channel.name, type: channel.type });
  const normalizeMessage = message => ({ id: message.id, channelId: message.channelId, content: message.content ?? null });
  return {
    channels: {
      get: id => {
        const channel = client.channels.cache.get(String(id));
        if (!channel) throw Object.assign(new Error(`Channel not found: ${id}`), { code: 'CHANNEL_NOT_FOUND', exitCode: 1 });
        return {
          ...normalizeChannel(channel),
          send: async content => {
            requireApproval('Sending a message');
            if (dryRun) return { dryRun: true, channelId: channel.id, content };
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
          channels: {
            list: () => guild.channels.cache.map(normalizeChannel),
            create: async name => {
              requireApproval('Creating a channel');
              if (dryRun) return { dryRun: true, guildId: guild.id, name, type: 0 };
              return normalizeChannel(await guild.channels.create({ name: String(name), type: 0 }));
            },
            get: channelId => {
              const channel = guild.channels.cache.get(String(channelId));
              if (!channel) throw Object.assign(new Error(`Channel not found: ${channelId}`), { code: 'CHANNEL_NOT_FOUND', exitCode: 1 });
              return {
                ...normalizeChannel(channel),
                send: async content => {
                  requireApproval('Sending a message');
                  if (dryRun) return { dryRun: true, channelId: channel.id, content };
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
