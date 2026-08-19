import { describe, expect, jest, test } from '@jest/globals';

import { createDiscordApi } from '../../src/discord.mjs';



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

describe('channel organization and types', () => {
  test('creates text, voice, and category channels with parent and position', async () => {
    const create = jest.fn(async settings => ({ id: String(create.mock.calls.length + 10), name: settings.name, type: settings.type, parentId: settings.parent ?? null, position: settings.position ?? null }));
    const guild = { id: '1', channels: { cache: new Map(), create }, roles: { cache: new Map() }, members: { me: { permissions: { has: () => true } } } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) }, channels: { cache: new Map() } }, { yes: true });
    await expect(api.guilds.get('1').channels.create('Information', { type: 'category', position: 1 })).resolves.toMatchObject({ type: 4, position: 1 });
    await expect(api.guilds.get('1').channels.create('Lounge', { type: 'voice', parent: '11', position: 2 })).resolves.toMatchObject({ type: 2, parentId: '11', position: 2 });
    await expect(api.guilds.get('1').channels.create('general', { type: 'text', parent: '11', position: 3 })).resolves.toMatchObject({ type: 0, parentId: '11', position: 3 });
    expect(create).toHaveBeenNthCalledWith(1, { name: 'Information', type: 4, position: 1 });
    expect(create).toHaveBeenNthCalledWith(2, { name: 'Lounge', type: 2, parent: '11', position: 2 });
  });

  test('moves, sorts, and uncategorizes an existing channel', async () => {
    const edit = jest.fn(async changes => ({ id: '10', name: 'general', type: 0, parentId: changes.parent ?? null, position: changes.position ?? 0 }));
    const channel = { id: '10', name: 'general', type: 0, parentId: '11', position: 5, edit, guild: { members: { me: { permissions: { has: () => true } } } } };
    const guild = { id: '1', channels: { cache: new Map([['10', channel]]) }, members: { me: { permissions: { has: () => true } } }, roles: { cache: new Map() } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) }, channels: { cache: new Map([['10', channel]]) } }, { yes: true });
    await expect(api.guilds.get('1').channels.get('10').update({ parent: '20', position: 2 })).resolves.toMatchObject({ parent: '20', position: 2 });
    await expect(api.guilds.get('1').channels.get('10').update({ uncategorized: true })).resolves.toMatchObject({ parent: null });
    expect(edit).toHaveBeenNthCalledWith(1, { parent: '20', position: 2 }, undefined);
    expect(edit).toHaveBeenNthCalledWith(2, { parent: null }, undefined);
  });

  test('rejects unsupported channel types', async () => {
    const guild = { id: '1', channels: { cache: new Map(), create: jest.fn() }, members: { me: { permissions: { has: () => true } } }, roles: { cache: new Map() } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').channels.create('unknown', { type: 'forum' })).rejects.toMatchObject({ code: 'CHANNEL_TYPE_INVALID', exitCode: 2 });
  });
});
