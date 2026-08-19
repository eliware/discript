export function createRestDiscordApi(rest) {
  const guild = guildId => ({
    id: String(guildId),
    async info() { return rest.request(`/guilds/${guildId}`); },
    async channels() { return rest.request(`/guilds/${guildId}/channels`); },
  });
  return {
    guilds: {
      async list() { return rest.request('/users/@me/guilds'); },
      get: guild,
    },
  };
}
