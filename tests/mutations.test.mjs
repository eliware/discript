import { describe, expect, test, jest } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

describe('channel mutations', () => {
  test('creates channels only with approval', async () => {
    const create = jest.fn(async settings => ({ id: '2', name: settings.name, type: settings.type }));
    const api = createDiscordApi({ guilds: { cache: new Map([['1', { id: '1', name: 'test', channels: { cache: new Map(), create } }]]) } }, { yes: true });
    await expect(api.guilds.get('1').channels.create('temporary')).resolves.toEqual({ id: '2', name: 'temporary', type: 0 });
    expect(create).toHaveBeenCalledWith({ name: 'temporary', type: 0 });
  });

  test('previews channel creation', async () => {
    const create = jest.fn();
    const api = createDiscordApi({ guilds: { cache: new Map([['1', { id: '1', name: 'test', channels: { cache: new Map(), create } }]]) } }, { dryRun: true });
    await expect(api.guilds.get('1').channels.create('temporary')).resolves.toEqual({ dryRun: true, guildId: '1', name: 'temporary', type: 0 });
    expect(create).not.toHaveBeenCalled();
  });
});
