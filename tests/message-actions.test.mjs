import { describe, expect, test, jest } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

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
