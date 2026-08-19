import { describe, expect, test } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

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
