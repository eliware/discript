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
