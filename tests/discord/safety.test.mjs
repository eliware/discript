import { describe, expect, jest, test } from '@jest/globals';

import { createDiscordApi } from '../../src/discord.mjs';



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
