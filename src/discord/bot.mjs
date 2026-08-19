export function createBotApi({ client }) {
  return {
      get: () => {
        if (!client.user) throw Object.assign(new Error('Bot identity is unavailable.'), { code: 'BOT_IDENTITY_UNAVAILABLE', exitCode: 1 });
        return { id: client.user.id, username: client.user.username, tag: client.user.tag ?? null };
      },
    };
}
