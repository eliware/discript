import { describe, expect, test } from '@jest/globals';

import { createDiscordApi } from '../../src/discord.mjs';



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

describe('guild discovery edges', () => {
  function cache(entries) { const value = new Map(entries); value.map = callback => [...value.values()].map(callback); return value; }
  test('lists guilds with ids and names', () => {
    const api = createDiscordApi({ guilds: { cache: cache([['1', { id: '1', name: 'one' }], ['2', { id: '2', name: 'two' }]]) } });
    expect(api.guilds.list()).toEqual([{ id: '1', name: 'one' }, { id: '2', name: 'two' }]);
  });
  test('returns an empty guild list', () => {
    expect(createDiscordApi({ guilds: { cache: cache([]) } }).guilds.list()).toEqual([]);
  });
  test('rejects a missing guild', () => {
    expect(() => createDiscordApi({ guilds: { cache: cache([]) } }).guilds.get('missing')).toThrow(expect.objectContaining({ code: 'GUILD_NOT_FOUND' }));
  });
  test('coerces numeric guild ids', () => {
    const guild = { id: '7', name: 'seven', channels: { cache: new Map() }, members: { cache: new Map() }, roles: { cache: new Map() } };
    expect(createDiscordApi({ guilds: { cache: cache([['7', guild]]) } }).guilds.get(7)).toMatchObject({ id: '7', name: 'seven' });
  });
  test('exposes nested guild APIs', () => {
    const guild = { id: '1', name: 'one', channels: { cache: new Map() }, members: { cache: new Map() }, roles: { cache: new Map() } };
    expect(createDiscordApi({ guilds: { cache: cache([['1', guild]]) } }).guilds.get('1')).toEqual(expect.objectContaining({ members: expect.any(Object), roles: expect.any(Object), channels: expect.any(Object) }));
  });
});
