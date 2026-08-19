import { describe, expect, jest, test } from '@jest/globals';

import { createDiscordApi } from '../../src/discord.mjs';




describe('role assignment', () => {
  test('adds and removes roles with approval', async () => {
    const add = jest.fn();
    const remove = jest.fn();
    const member = { id: '2', user: { username: 'user' }, roles: { cache: new Map(), add, remove } };
    const guild = { id: '1', name: 'test', members: { cache: new Map([['2', member]]) }, roles: { cache: new Map() }, channels: { cache: new Map() } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').members.get('2').addRole('3')).resolves.toMatchObject({ added: true });
    await expect(api.guilds.get('1').members.get('2').removeRole('3')).resolves.toMatchObject({ removed: true });
    expect(add).toHaveBeenCalledWith('3');
    expect(remove).toHaveBeenCalledWith('3');
  });
});

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

describe('role safety', () => {
  test('rejects protected roles', async () => {
    const member = { id: '2', roles: { cache: new Map(), add: async () => {}, remove: async () => {} } };
    const guild = {
      id: '1', name: 'test', channels: { cache: new Map() },
      members: { cache: new Map([['2', member]]) },
      roles: { cache: new Map([['3', { id: '3', name: '@everyone', managed: false }]]) },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').members.get('2').addRole('3')).rejects.toMatchObject({ code: 'ROLE_PROTECTED', exitCode: 5 });
  });

  test('rejects roles at or above the bot role', async () => {
    const member = { id: '2', roles: { cache: new Map(), add: async () => {}, remove: async () => {} } };
    const guild = {
      id: '1', name: 'test', channels: { cache: new Map() },
      members: { me: { permissions: { has: () => true }, roles: { highest: { position: 2 } } }, cache: new Map([['2', member]]) },
      roles: { cache: new Map([['3', { id: '3', name: 'Admin', position: 2, managed: false }]]) },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').members.get('2').addRole('3')).rejects.toMatchObject({ code: 'ROLE_HIERARCHY', exitCode: 5 });
  });
});
