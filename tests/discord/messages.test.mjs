import { describe, expect, jest, test } from '@jest/globals';

import { createDiscordApi } from '../../src/discord.mjs';




describe('bulk message deletion', () => {
  test('previews and executes bulk deletion', async () => {
    const bulkDelete = jest.fn(async ids => new Map(ids.map(id => [id, {}])));
    const channel = { guild: { members: { me: { permissions: { has: () => true } } } }, bulkDelete };
    const api = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { yes: true });
    await expect(api.messages.bulkDelete('1', '2,3')).resolves.toEqual({ channelId: '1', deleted: 2 });
    await expect(api.messages.bulkDelete('1', ['2', '3'], { dryRun: true })).resolves.toMatchObject({ dryRun: true, deleted: 2 });
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
