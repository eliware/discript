import { describe, expect, test } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

describe('member and role discovery', () => {
  test('normalizes members and roles', () => {
    const guild = {
      id: '1',
      name: 'test',
      members: { cache: new Map([['2', { id: '2', displayName: 'Eli', user: { username: 'eli' } }]]) },
      roles: { cache: new Map([['3', { id: '3', name: 'Moderator', position: 2, managed: false }]]) },
      channels: { cache: new Map() },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } });
    expect(api.guilds.get('1').members.list()).toEqual([{ id: '2', username: 'eli', displayName: 'Eli' }]);
    expect(api.guilds.get('1').roles.list()).toEqual([{ id: '3', name: 'Moderator', position: 2, managed: false }]);
  });
});
