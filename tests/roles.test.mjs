import { describe, expect, test, jest } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

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
