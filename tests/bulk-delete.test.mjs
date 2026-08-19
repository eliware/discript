import { describe, expect, test, jest } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

describe('bulk message deletion', () => {
  test('previews and executes bulk deletion', async () => {
    const bulkDelete = jest.fn(async ids => new Map(ids.map(id => [id, {}])));
    const channel = { guild: { members: { me: { permissions: { has: () => true } } } }, bulkDelete };
    const api = createDiscordApi({ channels: { cache: new Map([['1', channel]]) } }, { yes: true });
    await expect(api.messages.bulkDelete('1', '2,3')).resolves.toEqual({ channelId: '1', deleted: 2 });
    await expect(api.messages.bulkDelete('1', ['2', '3'], { dryRun: true })).resolves.toMatchObject({ dryRun: true, deleted: 2 });
  });
});
