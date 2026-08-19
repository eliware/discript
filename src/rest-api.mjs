export function createRestDiscordApi(rest) {
  const guild = guildId => ({
    id: String(guildId),
    async info() { return rest.request(`/guilds/${guildId}`); },
    async channels() { return rest.request(`/guilds/${guildId}/channels`); },
  });
  return {
    channels: {
      async get(channelId) { return rest.request(`/channels/${channelId}`); },
    },
    guilds: {
      async list() { return rest.request('/users/@me/guilds'); },
      get: guild,
    },
  };
}

export async function executeRestRead(command, options, rest) {
  const guild = options.guild;
  const channel = options.channel;
  const routes = {
    'members list': `/guilds/${guild}/members`,
    'roles list': `/guilds/${guild}/roles`,
    'emojis list': `/guilds/${guild}/emojis`,
    'stickers list': `/guilds/${guild}/stickers`,
    'events list': `/guilds/${guild}/scheduled-events`,
    'invites list': `/guilds/${guild}/invites`,
    'webhooks list': `/channels/${channel}/webhooks`,
    'messages list': `/channels/${channel}/messages`,
  };
  const route = routes[command.join(' ')];
  if (route) return rest.request(route, { query: options.limit ? { limit: String(options.limit) } : undefined });
  if (command.join(' ') === 'messages get') return rest.request(`/channels/${channel}/messages/${options.message}`);
  return undefined;
}
