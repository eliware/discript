import { describe, expect, test, jest } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

describe('role lifecycle', () => {
  test('creates, updates, and deletes roles with approval', async () => {
    const role = { id: '3', name: 'Old', position: 1, managed: false, edit: jest.fn(async settings => ({ ...role, ...settings })), delete: jest.fn() };
    const guild = { id: '1', name: 'test', channels: { cache: new Map() }, members: { cache: new Map() }, roles: { cache: new Map([['3', role]]), create: jest.fn(async () => ({ id: '4', name: 'New' })) } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').roles.create('New')).resolves.toMatchObject({ id: '4', created: true });
    await expect(api.guilds.get('1').roles.get('3').update({ name: 'Updated' })).resolves.toMatchObject({ updated: true });
    await expect(api.guilds.get('1').roles.get('3').delete()).resolves.toEqual({ id: '3', deleted: true });
  });
});
