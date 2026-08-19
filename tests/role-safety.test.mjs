import { describe, expect, test } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

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
