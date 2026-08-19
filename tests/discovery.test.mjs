import { describe, expect, test } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

describe('invite, emoji, and sticker discovery', () => {
  test('lists normalized guild resources', async () => {
    const guild = {
      id: '1', name: 'test', channels: { cache: new Map() }, members: { cache: new Map() }, roles: { cache: new Map() },
      emojis: { cache: new Map([['2', { id: '2', name: 'wave', animated: false }]]) },
      stickers: { cache: new Map([['3', { id: '3', name: 'hello', description: 'hi' }]]) },
      invites: { fetch: async () => new Map([['abc', { code: 'abc', url: 'x', uses: 1, channelId: '4' }]]) },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } });
    expect(api.guilds.get('1').emojis.list()).toEqual([{ id: '2', name: 'wave', animated: false }]);
    expect(api.guilds.get('1').stickers.list()).toEqual([{ id: '3', name: 'hello', description: 'hi' }]);
    await expect(api.guilds.get('1').invites.list()).resolves.toEqual([{ code: 'abc', url: 'x', uses: 1, channelId: '4' }]);
  });
});
