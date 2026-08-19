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
});
