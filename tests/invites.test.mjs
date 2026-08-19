import { jest } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

describe('invite operations', () => {
  test('lists, creates, and deletes invites with safety controls', async () => {
    const createInvite = jest.fn(async options => ({ code: 'new', url: 'https://discord.gg/new', channelId: '2', ...options }));
    const deleteInvite = jest.fn(async () => undefined);
    const guild = {
      id: '1',
      channels: { cache: new Map([['2', { id: '2', createInvite }]]) },
      invites: { fetch: async () => new Map([['old', { code: 'old', url: 'x', uses: 2, channelId: '2' }]]) },
      members: { me: { permissions: { has: () => true } } },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) }, invites: { delete: deleteInvite } }, { yes: true });
    await expect(api.guilds.get('1').invites.list()).resolves.toEqual([{ code: 'old', url: 'x', uses: 2, channelId: '2' }]);
    await expect(api.guilds.get('1').invites.create('2', { maxAge: 60 })).resolves.toMatchObject({ code: 'new', created: true });
    expect(createInvite).toHaveBeenCalledWith({ maxAge: 60 });
    await expect(api.guilds.get('1').invites.delete('old')).resolves.toEqual({ code: 'old', deleted: true });
    expect(deleteInvite).toHaveBeenCalledWith('old');
  });

  test('dry-run previews invite mutations without calling Discord', async () => {
    const createInvite = jest.fn();
    const deleteInvite = jest.fn();
    const guild = { id: '1', channels: { cache: new Map([['2', { createInvite }]]) }, members: { me: { permissions: { has: () => true } } } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) }, invites: { delete: deleteInvite } }, { dryRun: true });
    await expect(api.guilds.get('1').invites.create('2', { maxUses: 1 })).resolves.toMatchObject({ dryRun: true });
    await expect(api.guilds.get('1').invites.delete('old')).resolves.toMatchObject({ dryRun: true });
    expect(createInvite).not.toHaveBeenCalled();
    expect(deleteInvite).not.toHaveBeenCalled();
  });

  test('requires ManageGuild permission to delete invites', async () => {
    const deleteInvite = jest.fn();
    const guild = { id: '1', members: { me: { permissions: { has: () => false } } } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) }, invites: { delete: deleteInvite } }, { yes: true });
    await expect(api.guilds.get('1').invites.delete('old'))
      .rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
  });
});
