export function createDiscordApi(client) {
  return {
    guilds: {
      list: () => client.guilds.cache.map(guild => ({ id: guild.id, name: guild.name })),
    },
  };
}
