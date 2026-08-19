import { describe, expect, test, jest } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

describe('thread capabilities', () => {
  test('lists, creates, and archives threads', async () => {
    const setArchived = jest.fn();
    const thread = { id: '3', name: 'topic', archived: false, setArchived };
    const channel = { id: '1', name: 'general', type: 0, threads: { cache: new Map([['3', thread]]), create: jest.fn(async () => ({ id: '4', name: 'new' })) } };
    const api = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { yes: true });
    expect(api.channels.get('1').threads.list()).toEqual([{ id: '3', name: 'topic', archived: false }]);
    await expect(api.channels.get('1').threads.create('new')).resolves.toMatchObject({ id: '4', created: true });
    await expect(api.channels.get('1').threads.archive('3')).resolves.toEqual({ id: '3', archived: true });
    expect(setArchived).toHaveBeenCalledWith(true);
  });

  test('rejects thread mutation without the matching permission', async () => {
    const channel = { id: '1', type: 0, guild: { members: { me: { permissions: { has: () => false } } } }, threads: { cache: new Map(), create: jest.fn() } };
    const api = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { yes: true });
    await expect(api.channels.get('1').threads.create('new')).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
  });
});
