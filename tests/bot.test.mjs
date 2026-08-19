import { createDiscordApi } from '../src/discord.mjs';

describe('bot identity', () => {
  test('returns normalized bot identity', () => {
    const api = createDiscordApi({ user: { id: 'bot-1', username: 'Discript', tag: 'Discript#0001' } });
    expect(api.bot.get()).toEqual({ id: 'bot-1', username: 'Discript', tag: 'Discript#0001' });
  });

  test('reports unavailable identity clearly', () => {
    const api = createDiscordApi({});
    expect(() => api.bot.get()).toThrow(expect.objectContaining({ code: 'BOT_IDENTITY_UNAVAILABLE' }));
  });
});
