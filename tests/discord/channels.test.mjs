import { describe, expect, test } from '@jest/globals';
import { jest } from '@jest/globals';
import { createDiscordApi } from '../../src/discord.mjs';

function apiFor(channel, options = {}, clientExtras = {}) {
  return createDiscordApi({ channels: { cache: new Map([[String(channel.id), channel]]) }, ...clientExtras }, options);
}

describe('discord/channels', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/channels.mjs')).resolves.toBeDefined();
  });

  test('updates, sends, and deletes a channel', async () => {
    const edit = jest.fn(async changes => ({ ...channel, ...changes }));
    const remove = jest.fn();
    const send = jest.fn(async content => ({ id: 'm1', channelId: '1', content }));
    const channel = { id: '1', name: 'general', type: 0, edit, delete: remove, send };
    const target = apiFor(channel, { yes: true }).channels.get('1');
    await expect(target.update({ name: 'welcome', topic: 'Read first', position: 2 })).resolves.toMatchObject({ updated: true, name: 'welcome', position: 2 });
    await expect(target.send('hello')).resolves.toMatchObject({ id: 'm1', content: 'hello' });
    await expect(target.delete()).resolves.toEqual({ id: '1', deleted: true });
    expect(edit).toHaveBeenCalledWith({ name: 'welcome', topic: 'Read first', position: 2 }, undefined);
    expect(remove).toHaveBeenCalled();
  });

  test('supports webhook lifecycle and permission overwrites', async () => {
    const webhook = { id: 'w1', name: 'old', channelId: '1', edit: jest.fn(async settings => ({ id: 'w1', name: settings.name })), delete: jest.fn() };
    const channel = { id: '1', name: 'general', type: 0,
      fetchWebhooks: jest.fn(async () => new Map([['w1', webhook]])),
      createWebhook: jest.fn(async settings => ({ id: 'w2', name: settings.name, channelId: '1' })),
      permissionOverwrites: { cache: new Map(), edit: jest.fn(async id => ({ id, allow: { toArray: () => ['ViewChannel'] }, deny: { toArray: () => [] } })), delete: jest.fn() },
    };
    const target = apiFor(channel, { yes: true }).channels.get('1');
    await expect(target.webhooks.list()).resolves.toEqual([{ id: 'w1', name: 'old', channelId: '1', type: null }]);
    await expect(target.webhooks.create('new')).resolves.toMatchObject({ id: 'w2', created: true });
    await expect(target.webhooks.update('w1', { name: 'updated' })).rejects.toMatchObject({ code: 'WEBHOOKS_UNSUPPORTED' });
    await expect(target.permissions.set('role', { allow: ['ViewChannel'] })).resolves.toMatchObject({ updated: true, id: 'role' });
    await expect(target.permissions.delete('role')).resolves.toMatchObject({ deleted: true });
  });

  test('previews all channel mutations without calling Discord methods', async () => {
    const methods = { edit: jest.fn(), delete: jest.fn(), send: jest.fn(), createWebhook: jest.fn() };
    const channel = { id: '1', name: 'general', type: 0, ...methods, permissionOverwrites: { cache: new Map(), edit: jest.fn(), delete: jest.fn() }, threads: { cache: new Map(), create: jest.fn() } };
    const target = apiFor(channel, { dryRun: true }).channels.get('1');
    await expect(target.update({ name: 'preview' })).resolves.toMatchObject({ dryRun: true });
    await expect(target.send('preview')).resolves.toMatchObject({ dryRun: true });
    await expect(target.webhooks.create('preview')).resolves.toMatchObject({ dryRun: true });
    await expect(target.permissions.set('role', { deny: ['SendMessages'] })).resolves.toMatchObject({ dryRun: true });
    await expect(target.delete()).resolves.toMatchObject({ dryRun: true });
    for (const method of Object.values(methods)) expect(method).not.toHaveBeenCalled();
  });

  test('executes webhook and thread updates through the client adapters', async () => {
    const webhook = { id: 'w1', name: 'old', edit: jest.fn(async settings => ({ id: 'w1', name: settings.name })), delete: jest.fn() };
    const thread = { id: 't1', name: 'old', archived: false, setArchived: jest.fn(), edit: jest.fn(async settings => ({ id: 't1', name: settings.name })), delete: jest.fn() };
    const channel = { id: '1', name: 'general', type: 0, fetchWebhooks: jest.fn(async () => new Map([['w1', webhook]])), createWebhook: jest.fn(async settings => ({ id: 'w2', name: settings.name })), permissionOverwrites: { cache: new Map(), edit: jest.fn(), delete: jest.fn() }, threads: { cache: new Map([['t1', thread]]), create: jest.fn(async settings => ({ id: 't2', name: settings.name })) } };
    const target = apiFor(channel, { yes: true }, { fetchWebhook: jest.fn(async () => webhook) }).channels.get('1');
    await expect(target.webhooks.update('w1', { name: 'updated' })).resolves.toEqual({ id: 'w1', name: 'updated', channelId: '1', updated: true });
    await expect(target.webhooks.delete('w1')).resolves.toEqual({ id: 'w1', deleted: true });
    await expect(target.threads.create('new')).resolves.toMatchObject({ id: 't2', created: true });
    await expect(target.threads.archive('t1')).resolves.toEqual({ id: 't1', archived: true });
    await expect(target.threads.update('t1', { name: 'updated' })).resolves.toEqual({ id: 't1', name: 'updated', updated: true });
    await expect(target.threads.delete('t1')).resolves.toEqual({ id: 't1', deleted: true });
  });

  test('reports missing fields and unavailable operations', async () => {
    const channel = { id: '1', name: 'general', type: 0, permissionOverwrites: { cache: new Map() }, threads: { cache: new Map() } };
    const target = apiFor(channel, { yes: true }).channels.get('1');
    await expect(target.update({})).rejects.toMatchObject({ code: 'CHANNEL_FIELDS_REQUIRED' });
    await expect(target.webhooks.list()).rejects.toMatchObject({ code: 'WEBHOOKS_UNSUPPORTED' });
    await expect(target.webhooks.create('')).rejects.toMatchObject({ code: 'NAME_REQUIRED' });
    await expect(target.permissions.set('role', {})).rejects.toMatchObject({ code: 'PERMISSIONS_REQUIRED' });
  });
});
