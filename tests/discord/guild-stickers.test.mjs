import { describe, expect, jest, test } from '@jest/globals';
import { createGuildStickersApi } from '../../src/discord/guild-stickers.mjs';

function setup(options = {}) {
  const sticker = { id: 's1', name: 'old', description: 'old desc', edit: jest.fn(async value => ({ id: 's1', ...value })), delete: jest.fn() };
  const guild = { stickers: { cache: new Map([['s1', sticker]]), create: jest.fn(async value => ({ id: 's2', ...value })) } };
  const api = createGuildStickersApi({ guild, dryRun: options.dryRun ?? false, mapCache: (cache, map) => [...cache.values()].map(map), settingsReason: value => value?.reason, requireApproval: options.requireApproval ?? (() => {}), requirePermission: options.requirePermission ?? (() => {}) });
  return { api, guild, sticker };
}

describe('discord/guild-stickers', () => {
  test('module loads', async () => {
    await expect(import('../../src/discord/guild-stickers.mjs')).resolves.toBeDefined();
  });

  test('lists and gets stickers', () => {
    const { api } = setup();
    expect(api.list()).toEqual([{ id: 's1', name: 'old', description: 'old desc' }]);
    expect(api.get('s1')).toEqual({ id: 's1', name: 'old', description: 'old desc' });
  });

  test('rejects missing sticker', () => {
    expect(() => setup().api.get('missing')).toThrow(expect.objectContaining({ code: 'STICKER_NOT_FOUND' }));
  });

  test('validates sticker creation fields', async () => {
    await expect(setup().api.create({ name: 'x' })).rejects.toMatchObject({ code: 'STICKER_FIELDS_REQUIRED' });
  });

  test('creates a sticker', async () => {
    const { api, guild } = setup();
    await expect(api.create({ name: 'new', file: '/tmp/a.png', tags: '🙂' })).resolves.toMatchObject({ id: 's2', created: true });
    expect(guild.stickers.create).toHaveBeenCalled();
  });

  test('previews sticker creation', async () => {
    const { api, guild } = setup({ dryRun: true });
    await expect(api.create({ name: 'new', file: '/tmp/a.png', tags: '🙂' })).resolves.toMatchObject({ dryRun: true });
    expect(guild.stickers.create).not.toHaveBeenCalled();
  });

  test('validates sticker updates', async () => {
    await expect(setup().api.update('s1', {})).rejects.toMatchObject({ code: 'STICKER_FIELDS_REQUIRED' });
    await expect(setup().api.update('missing', { name: 'x' })).rejects.toMatchObject({ code: 'STICKER_NOT_FOUND' });
  });

  test('updates a sticker and forwards reason', async () => {
    const { api, sticker } = setup();
    await expect(api.update('s1', { name: 'new', reason: 'rename' })).resolves.toMatchObject({ updated: true, name: 'new' });
    expect(sticker.edit).toHaveBeenCalledWith({ name: 'new', description: undefined, tags: undefined, reason: 'rename' });
  });

  test('previews and deletes a sticker', async () => {
    const preview = setup({ dryRun: true });
    await expect(preview.api.delete('s1')).resolves.toMatchObject({ dryRun: true, deleted: true });
    const active = setup();
    await expect(active.api.delete('s1', { reason: 'cleanup' })).resolves.toEqual({ id: 's1', deleted: true });
    expect(active.sticker.delete).toHaveBeenCalledWith('cleanup');
  });
});
