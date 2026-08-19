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

  test('updates channels with approval and dry-run support', async () => {
    const edit = jest.fn(async changes => ({ id: '1', name: changes.name, type: 0 }));
    const channel = { id: '1', name: 'general', type: 0, edit };
    const api = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { yes: true });
    await expect(api.channels.get('1').update({ name: 'renamed' })).resolves.toMatchObject({ updated: true, name: 'renamed' });
    expect(edit).toHaveBeenCalledWith({ name: 'renamed' }, undefined);
    const preview = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { dryRun: true });
    await expect(preview.channels.get('1').update({ topic: 'preview' })).resolves.toMatchObject({ dryRun: true, topic: 'preview' });
  });

  test('guards channel updates with ManageChannels', async () => {
    const channel = { id: '1', name: 'general', type: 0, guild: { members: { me: { permissions: { has: () => false } } } }, edit: jest.fn() };
    const api = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { yes: true });
    await expect(api.channels.get('1').update({ name: 'blocked' })).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
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


describe('bulk message deletion', () => {
  test('previews and executes bulk deletion', async () => {
    const bulkDelete = jest.fn(async ids => new Map(ids.map(id => [id, {}])));
    const channel = { guild: { members: { me: { permissions: { has: () => true } } } }, bulkDelete };
    const api = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { yes: true });
    await expect(api.messages.bulkDelete('1', '2,3')).resolves.toEqual({ channelId: '1', deleted: 2 });
    await expect(api.messages.bulkDelete('1', ['2', '3'], { dryRun: true })).resolves.toMatchObject({ dryRun: true, deleted: 2 });
  });
});


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


describe('internal mutation safety', () => {
  test('supports force and dry-run on channel creation', async () => {
    const create = jest.fn(async settings => ({ id: '2', name: settings.name, type: settings.type }));
    const guild = { id: '1', name: 'test', channels: { cache: new Map(), create } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } });
    await expect(api.guilds.get('1').channels.create('x')).rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED' });
    await expect(api.guilds.get('1').channels.create('x', { dryRun: true })).resolves.toMatchObject({ dryRun: true });
    await expect(api.guilds.get('1').channels.create('x', { force: true })).resolves.toMatchObject({ id: '2' });
  });
});


describe('invite operations', () => {
  test('lists, creates, and deletes invites with safety controls', async () => {
    const createInvite = jest.fn(async options => ({ code: 'new', url: 'https://discord.gg/new', channelId: '2', ...options }));
    const deleteInvite = jest.fn(async () => undefined);
    const guild = {
      id: '1',
      channels: { cache: new Map([['2', { id: '2', createInvite }]]) },
      invites: { fetch: async () => new Map([['old', { code: 'old', url: 'x', uses: 2, channelId: '2' }]]) },
      members: { me: { permissions: { has: () => true } } },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) }, invites: { delete: deleteInvite } }, { yes: true });
    await expect(api.guilds.get('1').invites.list()).resolves.toEqual([{ code: 'old', url: 'x', uses: 2, channelId: '2' }]);
    await expect(api.guilds.get('1').invites.create('2', { maxAge: 60 })).resolves.toMatchObject({ code: 'new', created: true });
    expect(createInvite).toHaveBeenCalledWith({ maxAge: 60 });
    await expect(api.guilds.get('1').invites.delete('old')).resolves.toEqual({ code: 'old', deleted: true });
    expect(deleteInvite).toHaveBeenCalledWith('old');
  });

  test('dry-run previews invite mutations without calling Discord', async () => {
    const createInvite = jest.fn();
    const deleteInvite = jest.fn();
    const guild = { id: '1', channels: { cache: new Map([['2', { createInvite }]]) }, members: { me: { permissions: { has: () => true } } } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) }, invites: { delete: deleteInvite } }, { dryRun: true });
    await expect(api.guilds.get('1').invites.create('2', { maxUses: 1 })).resolves.toMatchObject({ dryRun: true });
    await expect(api.guilds.get('1').invites.delete('old')).resolves.toMatchObject({ dryRun: true });
    expect(createInvite).not.toHaveBeenCalled();
    expect(deleteInvite).not.toHaveBeenCalled();
  });

  test('requires ManageGuild permission to delete invites', async () => {
    const deleteInvite = jest.fn();
    const guild = { id: '1', members: { me: { permissions: { has: () => false } } } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) }, invites: { delete: deleteInvite } }, { yes: true });
    await expect(api.guilds.get('1').invites.delete('old'))
      .rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
  });
});


describe('member voice operations', () => {
  function setup(permission = () => true, options = { yes: true }) {
    const setMute = jest.fn(async () => undefined);
    const setDeaf = jest.fn(async () => undefined);
    const setChannel = jest.fn(async () => undefined);
    const member = { id: '2', user: { username: 'user' }, voice: { channelId: '3', serverMute: false, serverDeaf: false, setMute, setDeaf, setChannel }, roles: { highest: { position: 1 } } };
    const voiceChannel = { id: '4', type: 'voice' };
    const guild = { id: '1', members: { cache: new Map([['2', member]]), me: { permissions: { has: permission }, roles: { highest: { position: 10 } } } }, channels: { cache: new Map([['4', voiceChannel]]) } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, options);
    return { api, member, setMute, setDeaf, setChannel };
  }

  test('reports status and performs guarded voice controls', async () => {
    const { api, setMute, setDeaf, setChannel } = setup();
    const voice = api.guilds.get('1').members.get('2').voice;
    expect(voice.status()).toEqual({ memberId: '2', channelId: '3', muted: false, deafened: false });
    await expect(voice.mute(true)).resolves.toEqual({ memberId: '2', muted: true });
    await expect(voice.deafen(true)).resolves.toEqual({ memberId: '2', deafened: true });
    await expect(voice.move('4')).resolves.toEqual({ memberId: '2', channelId: '4', moved: true });
    await expect(voice.disconnect()).resolves.toEqual({ memberId: '2', disconnected: true });
    expect(setMute).toHaveBeenCalledWith(true, undefined);
    expect(setDeaf).toHaveBeenCalledWith(true, undefined);
    expect(setChannel).toHaveBeenNthCalledWith(1, '4', undefined);
    expect(setChannel).toHaveBeenNthCalledWith(2, null, undefined);
  });

  test('enforces voice permissions and previews without mutation', async () => {
    const { api: deniedApi } = setup(() => false);
    await expect(deniedApi.guilds.get('1').members.get('2').voice.mute()).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
    const { api: previewApi, setMute } = setup(() => true, { dryRun: true });
    await expect(previewApi.guilds.get('1').members.get('2').voice.mute()).resolves.toMatchObject({ dryRun: true, muted: true });
    expect(setMute).not.toHaveBeenCalled();
  });
});


describe('member and role discovery', () => {
  test('normalizes members and roles', () => {
    const guild = {
      id: '1',
      name: 'test',
      members: { cache: new Map([['2', { id: '2', displayName: 'Eli', user: { username: 'eli' } }]]) },
      roles: { cache: new Map([['3', { id: '3', name: 'Moderator', position: 2, managed: false }]]) },
      channels: { cache: new Map() },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } });
    expect(api.guilds.get('1').members.list()).toEqual([{ id: '2', username: 'eli', displayName: 'Eli' }]);
    expect(api.guilds.get('1').roles.list()).toEqual([{ id: '3', name: 'Moderator', position: 2, managed: false }]);
  });
});


describe('message actions', () => {
  test('reacts and manages pins with approval', async () => {
    const message = { id: '2', channelId: '1', react: jest.fn(), pin: jest.fn(), unpin: jest.fn() };
    const channel = { guild: { members: { me: { permissions: { has: () => true } } } }, messages: { fetch: async () => message } };
    const api = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { yes: true });
    await expect(api.messages.react('1', '2', '👍')).resolves.toMatchObject({ reacted: true });
    await expect(api.messages.pin('1', '2')).resolves.toMatchObject({ pinned: true });
    await expect(api.messages.unpin('1', '2')).resolves.toMatchObject({ pinned: false });
    expect(message.react).toHaveBeenCalledWith('👍');
  });
});


describe('message permissions', () => {
  test('rejects message mutation without ManageMessages', async () => {
    const channel = {
      guild: { members: { me: { permissions: { has: () => false } } } },
      messages: { fetch: async () => ({ id: '2', channelId: '1', delete: async () => {} }) },
    };
    const api = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { yes: true });
    await expect(api.messages.delete('1', '2')).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
  });

  test('rejects message send without SendMessages', async () => {
    const channel = { id: '1', guild: { members: { me: { permissions: { has: permission => permission !== 'SendMessages' } } } }, send: async () => ({ id: '2', channelId: '1', content: 'x' }) };
    const api = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { yes: true });
    await expect(api.channels.get('1').send('x')).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
  });
});


function apiFor(message) {
  return createDiscordApi({ channels: { cache: new Map([['1', { messages: { fetch: jest.fn(async () => message) } }]]) } }, { yes: true });
}

describe('message capabilities', () => {
  test('gets and edits a message', async () => {
    const message = { id: '2', channelId: '1', content: 'old', edit: jest.fn(async content => ({ ...message, content })) };
    const api = apiFor(message);
    await expect(api.messages.get('1', '2')).resolves.toMatchObject({ id: '2', content: 'old' });
    await expect(api.messages.edit('1', '2', 'new')).resolves.toMatchObject({ content: 'new' });
    expect(message.edit).toHaveBeenCalledWith('new');
  });

  test('deletes a message with approval', async () => {
    const message = { id: '2', channelId: '1', content: 'old', delete: jest.fn() };
    await expect(apiFor(message).messages.delete('1', '2')).resolves.toEqual({ id: '2', deleted: true });
    expect(message.delete).toHaveBeenCalled();
  });

  test('accepts script-level force and dry-run options', async () => {
    const message = { id: '2', channelId: '1', content: 'old', delete: jest.fn() };
    const api = createDiscordApi({ channels: { cache: new Map([['1', { messages: { fetch: jest.fn(async () => message) } }]]) } });
    await expect(api.messages.delete('1', '2', { dryRun: true })).resolves.toMatchObject({ dryRun: true });
    await expect(api.messages.delete('1', '2', { force: true })).resolves.toEqual({ id: '2', deleted: true });
  });
});


describe('moderation capabilities', () => {
  test('validates and executes a timeout', async () => {
    const timeout = jest.fn();
    const member = { id: '2', user: { username: 'user' }, roles: { cache: new Map() }, timeout };
    const guild = { id: '1', name: 'test', members: { cache: new Map([['2', member]]) }, roles: { cache: new Map() }, channels: { cache: new Map() } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').members.get('2').timeout(60000, 'test')).resolves.toMatchObject({ timedOut: true, timeoutMs: 60000 });
    expect(timeout).toHaveBeenCalledWith(60000, 'test');
    await expect(api.guilds.get('1').members.get('2').timeout(0)).rejects.toMatchObject({ code: 'INVALID_DURATION' });
  });

  test('rejects protected and higher-ranked moderation targets', async () => {
    const moderate = { id: '2', roles: { cache: new Map(), highest: { position: 3 } }, timeout: jest.fn() };
    const owner = { id: '3', roles: { cache: new Map() }, timeout: jest.fn() };
    const guild = {
      id: '1', ownerId: '3',
      members: { me: { id: 'bot', roles: { highest: { position: 2 } }, permissions: { has: () => true } }, cache: new Map([['2', moderate], ['3', owner]]) },
      roles: { cache: new Map() }, channels: { cache: new Map() },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').members.get('2').timeout(1000)).rejects.toMatchObject({ code: 'MEMBER_HIERARCHY', exitCode: 5 });
    await expect(api.guilds.get('1').members.get('3').timeout(1000)).rejects.toMatchObject({ code: 'MEMBER_PROTECTED', exitCode: 5 });
  });
});


describe('role lifecycle', () => {
  test('creates, updates, and deletes roles with approval', async () => {
    const role = { id: '3', name: 'Old', position: 1, managed: false, edit: jest.fn(async settings => ({ ...role, ...settings })), delete: jest.fn() };
    const guild = { id: '1', name: 'test', channels: { cache: new Map() }, members: { cache: new Map() }, roles: { cache: new Map([['3', role]]), create: jest.fn(async () => ({ id: '4', name: 'New' })) } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').roles.create('New')).resolves.toMatchObject({ id: '4', created: true });
    await expect(api.guilds.get('1').roles.get('3').update({ name: 'Updated' })).resolves.toMatchObject({ updated: true });
    await expect(api.guilds.get('1').roles.get('3').delete()).resolves.toEqual({ id: '3', deleted: true });
  });
});


describe('role safety', () => {
  test('rejects protected roles', async () => {
    const member = { id: '2', roles: { cache: new Map(), add: async () => {}, remove: async () => {} } };
    const guild = {
      id: '1', name: 'test', channels: { cache: new Map() },
      members: { cache: new Map([['2', member]]) },
      roles: { cache: new Map([['3', { id: '3', name: '@everyone', managed: false }]]) },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').members.get('2').addRole('3')).rejects.toMatchObject({ code: 'ROLE_PROTECTED', exitCode: 5 });
  });

  test('rejects roles at or above the bot role', async () => {
    const member = { id: '2', roles: { cache: new Map(), add: async () => {}, remove: async () => {} } };
    const guild = {
      id: '1', name: 'test', channels: { cache: new Map() },
      members: { me: { permissions: { has: () => true }, roles: { highest: { position: 2 } } }, cache: new Map([['2', member]]) },
      roles: { cache: new Map([['3', { id: '3', name: 'Admin', position: 2, managed: false }]]) },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').members.get('2').addRole('3')).rejects.toMatchObject({ code: 'ROLE_HIERARCHY', exitCode: 5 });
  });
});


describe('role assignment', () => {
  test('adds and removes roles with approval', async () => {
    const add = jest.fn();
    const remove = jest.fn();
    const member = { id: '2', user: { username: 'user' }, roles: { cache: new Map(), add, remove } };
    const guild = { id: '1', name: 'test', members: { cache: new Map([['2', member]]) }, roles: { cache: new Map() }, channels: { cache: new Map() } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').members.get('2').addRole('3')).resolves.toMatchObject({ added: true });
    await expect(api.guilds.get('1').members.get('2').removeRole('3')).resolves.toMatchObject({ removed: true });
    expect(add).toHaveBeenCalledWith('3');
    expect(remove).toHaveBeenCalledWith('3');
  });
});


describe('scheduled events', () => {
  test('lists and performs guarded lifecycle operations', async () => {
    const edit = jest.fn(async settings => ({ id: 'e1', name: settings.name ?? 'Town hall' }));
    const remove = jest.fn(async () => undefined);
    const create = jest.fn(async settings => ({ id: 'e2', name: settings.name }));
    const guild = {
      id: '1',
      scheduledEvents: { cache: new Map([['e1', { id: 'e1', name: 'Town hall', status: 1, edit, delete: remove }]]), create },
      members: { me: { permissions: { has: () => true } } },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    expect(api.guilds.get('1').scheduledEvents.list()).toMatchObject([{ id: 'e1', name: 'Town hall' }]);
    await expect(api.guilds.get('1').scheduledEvents.create({ name: 'Launch', scheduledStartTime: '2030-01-01T00:00:00.000Z' })).resolves.toEqual({ id: 'e2', name: 'Launch', created: true });
    await expect(api.guilds.get('1').scheduledEvents.get('e1').update({ name: 'Updated' })).resolves.toEqual({ id: 'e1', name: 'Updated', updated: true });
    await expect(api.guilds.get('1').scheduledEvents.get('e1').delete()).resolves.toEqual({ id: 'e1', deleted: true });
    expect(create).toHaveBeenCalled();
    expect(edit).toHaveBeenCalledWith({ name: 'Updated' });
    expect(remove).toHaveBeenCalled();
  });

  test('dry-run previews event mutations', async () => {
    const create = jest.fn();
    const edit = jest.fn();
    const remove = jest.fn();
    const guild = { id: '1', scheduledEvents: { cache: new Map([['e1', { id: 'e1', name: 'Town hall', edit, delete: remove }]]), create }, members: { me: { permissions: { has: () => true } } } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { dryRun: true });
    await expect(api.guilds.get('1').scheduledEvents.create({ name: 'Launch', scheduledStartTime: '2030-01-01T00:00:00.000Z' })).resolves.toMatchObject({ dryRun: true });
    await expect(api.guilds.get('1').scheduledEvents.get('e1').update({ name: 'Updated' })).resolves.toMatchObject({ dryRun: true });
    await expect(api.guilds.get('1').scheduledEvents.get('e1').delete()).resolves.toMatchObject({ dryRun: true });
    expect(create).not.toHaveBeenCalled();
    expect(edit).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  test('requires ManageEvents for event creation', async () => {
    const guild = {
      id: '1',
      scheduledEvents: { cache: new Map(), create: jest.fn() },
      members: { me: { permissions: { has: () => false } } },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').scheduledEvents.create({ name: 'Launch' }))
      .rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
  });
});


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


describe('voice operations', () => {
  test('previews voice join and leave without connecting', async () => {
    const channel = { id: '2', type: 'voice', guild: { id: '1', members: { me: { permissions: { has: () => true } } } } };
    const api = createDiscordApi({ channels: { cache: new Map([['2', channel]]) } }, { dryRun: true, voiceModule: { getVoiceConnection: () => undefined } });
    await expect(api.voice.join('2')).resolves.toMatchObject({ dryRun: true, guildId: '1', joined: true });
    await expect(api.voice.leave('1')).resolves.toMatchObject({ dryRun: true, guildId: '1', left: true });
  });

  test('reports disconnected voice status', async () => {
    const api = createDiscordApi({ channels: { cache: new Map() } }, { voiceModule: { getVoiceConnection: () => undefined } });
    await expect(api.voice.status('1')).resolves.toEqual({ guildId: '1', connected: false });
  });

  test('requires Connect permission to join voice', async () => {
    const channel = { id: '2', type: 'voice', guild: { id: '1', members: { me: { permissions: { has: () => false } } } } };
    const api = createDiscordApi({ channels: { cache: new Map([['2', channel]]) } }, { yes: true, voiceModule: {} });
    await expect(api.voice.join('2')).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
  });
});
