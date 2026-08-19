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
});
