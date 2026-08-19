import { describe, expect, jest, test } from '@jest/globals';

import { createDiscordApi } from '../../src/discord.mjs';

function channelCollection(entries) {
  const cache = new Map(entries);
  cache.map = callback => [...cache.values()].map(callback);
  return cache;
}



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
  test('covers guild channel list, lookup, topic updates, and deletion', async () => {
    const edit = jest.fn(async changes => ({ id: '10', name: changes.name ?? 'general', type: 0, topic: changes.topic ?? null }));
    const remove = jest.fn(async () => undefined);
    const channel = { id: '10', name: 'general', type: 0, topic: null, edit, delete: remove, guild: { members: { me: { permissions: { has: () => true } } } } };
    const guild = { id: '1', channels: { cache: channelCollection([['10', channel]]) }, members: { me: { permissions: { has: () => true } } }, roles: { cache: new Map() } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) }, channels: { cache: new Map([['10', channel]]) } }, { yes: true });
    expect(api.guilds.get('1').channels.list()).toEqual([{ id: '10', name: 'general', type: 0 }]);
    await expect(api.guilds.get('1').channels.get('10').update({ topic: null })).resolves.toMatchObject({ updated: true, topic: null });
    await expect(api.channels.get('10').delete()).resolves.toEqual({ id: '10', deleted: true });
    expect(remove).toHaveBeenCalledWith();
  });

  test('previews every guild-channel mutation without Discord calls', async () => {
    const methods = { edit: jest.fn(), delete: jest.fn(), send: jest.fn(), createWebhook: jest.fn(), permissionEdit: jest.fn(), permissionDelete: jest.fn(), threadCreate: jest.fn(), threadArchive: jest.fn(), threadEdit: jest.fn(), threadDelete: jest.fn() };
    const channel = {
      id: '10', name: 'general', type: 0,
      guild: { members: { me: { permissions: { has: () => true } } } },
      edit: methods.edit, delete: methods.delete, send: methods.send,
      fetchWebhooks: jest.fn(async () => new Map()), createWebhook: methods.createWebhook,
      permissionOverwrites: { cache: new Map(), edit: methods.permissionEdit, delete: methods.permissionDelete },
      threads: { cache: new Map(), create: methods.threadCreate },
    };
    const guild = { id: '1', channels: { cache: channelCollection([['10', channel]]), create: jest.fn() }, members: { me: { permissions: { has: () => true } } }, roles: { cache: new Map() } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) }, channels: { cache: new Map([['10', channel]]) } }, { dryRun: true });
    const target = api.guilds.get('1').channels.get('10');
    await expect(api.guilds.get('1').channels.create('new', { type: 'voice', parent: '20', position: 3 })).resolves.toMatchObject({ dryRun: true, parentId: '20', position: 3 });
    await expect(target.update({ name: 'preview' })).resolves.toMatchObject({ dryRun: true, updated: true });
    await expect(target.send('hello')).resolves.toMatchObject({ dryRun: true, content: 'hello' });
    await expect(target.webhooks.create('hook')).resolves.toMatchObject({ dryRun: true, created: true });
    await expect(target.webhooks.update('w1', { name: 'hook' })).resolves.toMatchObject({ dryRun: true, updated: true });
    await expect(target.webhooks.delete('w1')).resolves.toMatchObject({ dryRun: true, deleted: true });
    await expect(target.permissions.set('r1', { allow: ['ViewChannel'] })).resolves.toMatchObject({ dryRun: true, updated: true });
    await expect(target.permissions.delete('r1')).resolves.toMatchObject({ dryRun: true, deleted: true });
    await expect(target.threads.create('topic')).resolves.toMatchObject({ dryRun: true, created: true });
    await expect(target.threads.archive('t1')).resolves.toMatchObject({ dryRun: true, archived: true });
    await expect(target.threads.update('t1', { name: 'topic' })).resolves.toMatchObject({ dryRun: true, updated: true });
    await expect(target.threads.delete('t1')).resolves.toMatchObject({ dryRun: true, deleted: true });
    for (const method of Object.values(methods)) expect(method).not.toHaveBeenCalled();
  });

  test('executes every guild-channel live operation and forwards settings', async () => {
    const webhook = { id: 'w1', name: 'old', channelId: '10', edit: jest.fn(async settings => ({ id: 'w1', name: settings.name })), delete: jest.fn(async () => undefined) };
    const thread = { id: 't1', name: 'old', archived: false, setArchived: jest.fn(async () => undefined), edit: jest.fn(async settings => ({ id: 't1', name: settings.name })), delete: jest.fn(async () => undefined) };
    const channel = {
      id: '10', name: 'general', type: 0, guild: { members: { me: { permissions: { has: () => true } } } },
      fetchWebhooks: jest.fn(async () => new Map([['w1', webhook]])),
      createWebhook: jest.fn(async settings => ({ id: 'w2', name: settings.name, channelId: '10' })),
      permissionOverwrites: {
        cache: new Map([['r1', { id: 'r1', type: 0, allow: { toArray: () => ['ViewChannel'] }, deny: { toArray: () => [] } }]]),
        edit: jest.fn(async (id, changes) => ({ id, type: 0, allow: { toArray: () => changes.allow ?? [] }, deny: { toArray: () => changes.deny ?? [] } })),
        delete: jest.fn(async () => undefined),
      },
      threads: { cache: new Map([['t1', thread]]), create: jest.fn(async settings => ({ id: 't2', name: settings.name })) },
      send: jest.fn(async content => ({ id: 'm1', channelId: '10', content, author: { id: 'bot', username: 'bot' } })),
    };
    const guildCreate = jest.fn(async settings => ({ id: '11', name: settings.name, type: settings.type }));
    const guild = { id: '1', channels: { cache: channelCollection([['10', channel]]), create: guildCreate }, members: { me: { permissions: { has: () => true } } }, roles: { cache: new Map() } };
    const client = { guilds: { cache: new Map([['1', guild]]) }, channels: { cache: new Map([['10', channel]]) }, fetchWebhook: jest.fn(async () => webhook) };
    const target = createDiscordApi(client, { yes: true }).guilds.get('1').channels;
    const existing = target.get('10');
    await expect(target.create('voice', { type: 2, category: null, position: 4 })).resolves.toMatchObject({ id: '11', type: 2 });
    await expect(existing.webhooks.list()).resolves.toHaveLength(1);
    await expect(existing.webhooks.create('new')).resolves.toMatchObject({ id: 'w2', created: true });
    await expect(existing.webhooks.update('w1', { name: 'updated' })).resolves.toMatchObject({ updated: true, name: 'updated' });
    await expect(existing.webhooks.delete('w1')).resolves.toEqual({ id: 'w1', deleted: true });
    expect(existing.permissions.list()).toHaveLength(1);
    await expect(existing.permissions.set('r1', { allow: ['SendMessages'] })).resolves.toMatchObject({ updated: true });
    await expect(existing.permissions.delete('r1')).resolves.toMatchObject({ deleted: true });
    expect(existing.threads.list()).toEqual([{ id: 't1', name: 'old', archived: false }]);
    await expect(existing.threads.create('new')).resolves.toMatchObject({ id: 't2', created: true });
    await expect(existing.threads.archive('t1')).resolves.toEqual({ id: 't1', archived: true });
    await expect(existing.threads.update('t1', { name: 'updated' })).resolves.toMatchObject({ updated: true });
    await expect(existing.threads.delete('t1')).resolves.toEqual({ id: 't1', deleted: true });
    await expect(existing.send('hello')).resolves.toMatchObject({ id: 'm1', content: 'hello' });
  });

  test('reports guild-channel validation and unsupported-operation errors', async () => {
    const permission = { members: { me: { permissions: { has: () => true } } } };
    const base = { id: '10', type: 0, guild: permission, threads: { cache: new Map() }, permissionOverwrites: { cache: new Map() } };
    const guild = { id: '1', channels: { cache: channelCollection([['10', base]]), create: jest.fn() }, members: { me: { permissions: { has: () => true } } }, roles: { cache: new Map() } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) }, channels: { cache: new Map([['10', base]]) } }, { yes: true });
    const target = api.guilds.get('1').channels.get('10');
    expect(() => api.guilds.get('1').channels.get('missing')).toThrow(expect.objectContaining({ code: 'CHANNEL_NOT_FOUND' }));
    await expect(target.update({})).rejects.toMatchObject({ code: 'CHANNEL_FIELDS_REQUIRED' });
    await expect(target.update({ name: 'x' })).rejects.toMatchObject({ code: 'CHANNELS_UNSUPPORTED' });
    await expect(target.webhooks.list()).rejects.toMatchObject({ code: 'WEBHOOKS_UNSUPPORTED' });
    await expect(target.webhooks.create('')).rejects.toMatchObject({ code: 'NAME_REQUIRED' });
    await expect(target.webhooks.create('x')).rejects.toMatchObject({ code: 'WEBHOOKS_UNSUPPORTED' });
    await expect(target.webhooks.update('w', {})).rejects.toMatchObject({ code: 'NAME_REQUIRED' });
    await expect(target.webhooks.update('w', { name: 'x' })).rejects.toMatchObject({ code: 'WEBHOOKS_UNSUPPORTED' });
    await expect(target.webhooks.delete('w')).rejects.toMatchObject({ code: 'WEBHOOKS_UNSUPPORTED' });
    await expect(target.permissions.set('', { allow: [] })).rejects.toMatchObject({ code: 'TARGET_REQUIRED' });
    await expect(target.permissions.set('r', {})).rejects.toMatchObject({ code: 'PERMISSIONS_REQUIRED' });
    await expect(target.permissions.set('r', { allow: [] })).rejects.toMatchObject({ code: 'PERMISSIONS_UNSUPPORTED' });
    await expect(target.permissions.delete('r')).rejects.toMatchObject({ code: 'PERMISSIONS_UNSUPPORTED' });
    await expect(target.threads.archive('missing')).rejects.toMatchObject({ code: 'THREAD_NOT_FOUND' });
    await expect(target.threads.update('t', {})).rejects.toMatchObject({ code: 'NAME_REQUIRED' });
    await expect(target.threads.update('t', { name: 'x' })).rejects.toMatchObject({ code: 'THREADS_UNSUPPORTED' });
    await expect(target.threads.delete('t')).rejects.toMatchObject({ code: 'THREADS_UNSUPPORTED' });
    await expect(api.guilds.get('1').channels.create('bad', { type: 'forum' })).rejects.toMatchObject({ code: 'CHANNEL_TYPE_INVALID' });
  });
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

  test('updates and deletes threads and updates webhooks', async () => {
    const thread = { id: '30', name: 'old', edit: jest.fn(async () => ({ id: '30', name: 'new' })), delete: jest.fn() };
    const webhook = { id: '40', name: 'old', edit: jest.fn(async () => ({ id: '40', name: 'new' })) };
    const channel = { id: '10', type: 0, guild: { members: { me: { permissions: { has: () => true } } } }, threads: { cache: new Map([['30', thread]]) }, fetchWebhooks: jest.fn(async () => new Map([['40', webhook]])) };
    const guild = { id: '1', channels: { cache: new Map([['10', channel]]) }, roles: { cache: new Map() }, members: { me: { permissions: { has: () => true } } } };
    const client = { guilds: { cache: new Map([['1', guild]]) }, channels: { cache: new Map([['10', channel]]) }, fetchWebhook: jest.fn(async () => webhook) };
    const api = createDiscordApi(client, { yes: true });
    await expect(api.channels.get('10').threads.update('30', { name: 'new' })).resolves.toMatchObject({ updated: true, name: 'new' });
    await expect(api.channels.get('10').threads.delete('30')).resolves.toEqual({ id: '30', deleted: true });
    await expect(api.channels.get('10').webhooks.update('40', { name: 'new' })).resolves.toMatchObject({ updated: true, name: 'new' });
    expect(thread.edit).toHaveBeenCalledWith({ name: 'new' });
    expect(thread.delete).toHaveBeenCalled();
    expect(webhook.edit).toHaveBeenCalledWith({ name: 'new', reason: undefined });
  });
});
