import { describe, expect, jest, test } from '@jest/globals';
import { createRestDiscordApi, executeRestOperation, executeRestRead } from '../src/rest-api.mjs';

describe('REST Discord API adapter', () => {
  test('maps guild listing and channel listing to REST routes', async () => {
    const request = jest.fn(async route => route === '/users/@me/guilds' ? [{ id: '1' }] : route === '/guilds/1' ? { id: '1', name: 'test' } : [{ id: '2' }]);
    const api = createRestDiscordApi({ request });
    await expect(api.guilds.list()).resolves.toEqual([{ id: '1' }]);
    await expect(api.guilds.get('1').channels()).resolves.toEqual([{ id: '2' }]);
    await expect(api.guilds.get('1').info()).resolves.toEqual({ id: '1', name: 'test' });
    expect(request).toHaveBeenNthCalledWith(1, '/users/@me/guilds');
    expect(request).toHaveBeenNthCalledWith(2, '/guilds/1/channels');
    expect(request).toHaveBeenNthCalledWith(3, '/guilds/1');
  });

  test('maps read-only resource commands to REST routes', async () => {
    const request = jest.fn(async route => ({ route }));
    await expect(executeRestRead(['members', 'list'], { guild: '1' }, { request })).resolves.toEqual({ route: '/guilds/1/members' });
    await expect(executeRestRead(['messages', 'get'], { channel: '2', message: '3' }, { request })).resolves.toEqual({ route: '/channels/2/messages/3' });
    await expect(executeRestRead(['webhooks', 'list'], { channel: '2' }, { request })).resolves.toEqual({ route: '/channels/2/webhooks' });
  });

  test('previews and approves REST mutations', async () => {
    const request = jest.fn(async () => ({ id: '9' }));
    await expect(executeRestOperation(['channels', 'create'], { guild: '1', name: 'voice', type: 'voice', dry_run: true }, { request })).resolves.toMatchObject({ dryRun: true, method: 'POST', route: '/guilds/1/channels', body: { type: 2 } });
    await expect(executeRestOperation(['channels', 'delete'], { channel: '2' }, { request })).rejects.toMatchObject({ code: 'APPROVAL_REQUIRED' });
    await expect(executeRestOperation(['channels', 'delete'], { channel: '2', yes: true }, { request })).resolves.toEqual({ id: '9' });
    expect(request).toHaveBeenCalledWith('/channels/2', { method: 'DELETE' });
  });
});
