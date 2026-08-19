import { describe, expect, test, jest } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

describe('Discord capability layer', () => {
  test('requires approval for message sends', async () => {
    const api = createDiscordApi({ channels: { cache: new Map([['1', { id: '1', name: 'general', type: 0 }]]) } });
    await expect(api.channels.get('1').send('hello')).rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED' });
  });

  test('supports dry-run message sends', async () => {
    const send = jest.fn();
    const api = createDiscordApi({ channels: { cache: new Map([['1', { id: '1', name: 'general', type: 0, send }]]) } }, { dryRun: true });
    await expect(api.channels.get('1').send('hello')).resolves.toEqual({ dryRun: true, channelId: '1', content: 'hello' });
    expect(send).not.toHaveBeenCalled();
  });

  test('supports guarded emoji and sticker lifecycle operations', async () => {
    const emojiEdit = jest.fn(async settings => ({ id: 'e2', name: settings.name, animated: false }));
    const emojiDelete = jest.fn(async () => undefined);
    const stickerEdit = jest.fn(async settings => ({ id: 's2', name: settings.name, description: settings.description }));
    const stickerDelete = jest.fn(async () => undefined);
    const emojiCreate = jest.fn(async settings => ({ id: 'e2', name: settings.name, animated: false }));
    const stickerCreate = jest.fn(async settings => ({ id: 's2', name: settings.name, description: settings.description }));
    const guild = {
      id: '1',
      members: { me: { permissions: { has: () => true } } },
      emojis: { cache: new Map([['e1', { id: 'e1', name: 'old', edit: emojiEdit, delete: emojiDelete }]]), create: emojiCreate },
      stickers: { cache: new Map([['s1', { id: 's1', name: 'old', description: 'old', edit: stickerEdit, delete: stickerDelete }]]), create: stickerCreate },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').emojis.create({ name: 'new', attachment: '/tmp/a.png' })).resolves.toMatchObject({ created: true });
    await expect(api.guilds.get('1').emojis.get('e1').name).toBe('old');
    await expect(api.guilds.get('1').emojis.update('e1', { name: 'updated' })).resolves.toMatchObject({ updated: true });
    await expect(api.guilds.get('1').emojis.delete('e1')).resolves.toEqual({ id: 'e1', deleted: true });
    await expect(api.guilds.get('1').stickers.create({ name: 'new', file: '/tmp/a.png', tags: '😀' })).resolves.toMatchObject({ created: true });
    await expect(api.guilds.get('1').stickers.update('s1', { name: 'updated' })).resolves.toMatchObject({ updated: true });
    await expect(api.guilds.get('1').stickers.delete('s1')).resolves.toEqual({ id: 's1', deleted: true });
    expect(emojiCreate).toHaveBeenCalledWith({ attachment: '/tmp/a.png', name: 'new', reason: undefined });
    expect(stickerCreate).toHaveBeenCalledWith({ file: '/tmp/a.png', name: 'new', description: undefined, tags: '😀', reason: undefined });
  });

  test('previews expression mutations without calling Discord', async () => {
    const emojiCreate = jest.fn();
    const stickerCreate = jest.fn();
    const guild = {
      id: '1', members: { me: { permissions: { has: () => true } } },
      emojis: { cache: new Map([['e1', { id: 'e1', name: 'old' }]]), create: emojiCreate },
      stickers: { cache: new Map([['s1', { id: 's1', name: 'old' }]]), create: stickerCreate },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { dryRun: true });
    await expect(api.guilds.get('1').emojis.create({ name: 'new', attachment: '/tmp/a.png' })).resolves.toMatchObject({ dryRun: true });
    await expect(api.guilds.get('1').stickers.create({ name: 'new', file: '/tmp/a.png', tags: '😀' })).resolves.toMatchObject({ dryRun: true });
    expect(emojiCreate).not.toHaveBeenCalled();
    expect(stickerCreate).not.toHaveBeenCalled();
  });

  test('requires ManageExpressions for expression mutations', async () => {
    const guild = {
      id: '1', members: { me: { permissions: { has: () => false } } },
      emojis: { cache: new Map([['e1', { id: 'e1', name: 'old' }]]), create: jest.fn() },
      stickers: { cache: new Map([['s1', { id: 's1', name: 'old' }]]), create: jest.fn() },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').emojis.create({ name: 'new', attachment: '/tmp/a.png' })).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
    await expect(api.guilds.get('1').stickers.create({ name: 'new', file: '/tmp/a.png', tags: '😀' })).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
  });

  test('fails closed when Discord permission state is unavailable', async () => {
    const guild = { id: '1', members: { me: undefined }, emojis: { cache: new Map(), create: jest.fn() } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').emojis.create({ name: 'new', attachment: '/tmp/a.png' })).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
  });

  test('supports guarded channel webhook operations', async () => {
    const createWebhook = jest.fn(async settings => ({ id: 'w2', name: settings.name, channelId: '1', delete: jest.fn() }));
    const fetchedWebhook = { id: 'w1', name: 'old', channelId: '1', delete: jest.fn(async () => undefined) };
    const channel = {
      id: '1', name: 'general', type: 0,
      guild: { id: 'g1', members: { me: { permissions: { has: () => true } } } },
      fetchWebhooks: jest.fn(async () => new Map([['w1', fetchedWebhook]])), createWebhook,
    };
    const client = { channels: { cache: new Map([['1', channel]]) }, fetchWebhook: jest.fn(async () => fetchedWebhook) };
    const api = createDiscordApi(client, { yes: true });
    await expect(api.channels.get('1').webhooks.list()).resolves.toEqual([{ id: 'w1', name: 'old', channelId: '1', type: null }]);
    await expect(api.channels.get('1').webhooks.create('new')).resolves.toMatchObject({ id: 'w2', created: true });
    await expect(api.channels.get('1').webhooks.delete('w1')).resolves.toEqual({ id: 'w1', deleted: true });
    expect(createWebhook).toHaveBeenCalledWith({ name: 'new', reason: undefined });
    expect(fetchedWebhook.delete).toHaveBeenCalledWith(undefined);
  });

  test('requires ManageWebhooks and previews webhook mutations', async () => {
    const channel = { id: '1', guild: { members: { me: { permissions: { has: () => false } } } }, createWebhook: jest.fn() };
    const denied = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { yes: true });
    await expect(denied.channels.get('1').webhooks.create('new')).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
    const preview = createDiscordApi({ channels: { cache: new Map([['1', { ...channel, guild: { members: { me: { permissions: { has: () => true } } } } }]]) } }, { dryRun: true });
    await expect(preview.channels.get('1').webhooks.create('new')).resolves.toMatchObject({ dryRun: true, created: true });
  });

  test('supports guarded channel permission overwrites', async () => {
    const overwriteEdit = jest.fn(async (id, changes) => ({ id, type: 0, allow: { toArray: () => changes.allow ?? [] }, deny: { toArray: () => changes.deny ?? [] } }));
    const overwriteDelete = jest.fn(async () => undefined);
    const channel = {
      id: '1', guild: { members: { me: { permissions: { has: () => true } } } },
      permissionOverwrites: { cache: new Map([['2', { id: '2', type: 1, allow: { toArray: () => ['ViewChannel'] }, deny: { toArray: () => [] } }]]), edit: overwriteEdit, delete: overwriteDelete },
    };
    const api = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { yes: true });
    expect(api.channels.get('1').permissions.list()).toEqual([{ id: '2', type: 1, allow: ['ViewChannel'], deny: [] }]);
    await expect(api.channels.get('1').permissions.set('2', { allow: ['SendMessages'], deny: [] })).resolves.toMatchObject({ channelId: '1', id: '2', updated: true });
    await expect(api.channels.get('1').permissions.delete('2')).resolves.toEqual({ channelId: '1', targetId: '2', deleted: true });
    expect(overwriteEdit).toHaveBeenCalledWith('2', { allow: ['SendMessages'], deny: [] }, { reason: undefined });
  });

  test('requires ManageChannels and previews permission overwrites', async () => {
    const channel = { id: '1', guild: { members: { me: { permissions: { has: () => false } } } }, permissionOverwrites: { cache: new Map(), edit: jest.fn() } };
    const denied = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { yes: true });
    await expect(denied.channels.get('1').permissions.set('2', { allow: ['ViewChannel'] })).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
    const preview = createDiscordApi({ channels: { cache: new Map([['1', { ...channel, guild: { members: { me: { permissions: { has: () => true } } } } }]]) } }, { dryRun: true });
    await expect(preview.channels.get('1').permissions.set('2', { allow: ['ViewChannel'] })).resolves.toMatchObject({ dryRun: true, targetId: '2', updated: true });
  });
});
