import { describe, expect, test, jest } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

describe('moderation capabilities', () => {
  test('validates and executes a timeout', async () => {
    const timeout = jest.fn();
    const member = { id: '2', user: { username: 'user' }, roles: { cache: new Map() }, timeout };
    const guild = { id: '1', name: 'test', members: { cache: new Map([['2', member]]) }, roles: { cache: new Map() }, channels: { cache: new Map() } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').members.get('2').timeout(60000, 'test')).resolves.toMatchObject({ timedOut: true, timeoutMs: 60000 });
    expect(timeout).toHaveBeenCalledWith(60000, 'test');
    await expect(api.guilds.get('1').members.get('2').timeout(0)).rejects.toMatchObject({ code: 'INVALID_DURATION' });
  });

  test('rejects protected and higher-ranked moderation targets', async () => {
    const moderate = { id: '2', roles: { cache: new Map(), highest: { position: 3 } }, timeout: jest.fn() };
    const owner = { id: '3', roles: { cache: new Map() }, timeout: jest.fn() };
    const guild = {
      id: '1', ownerId: '3',
      members: { me: { id: 'bot', roles: { highest: { position: 2 } }, permissions: { has: () => true } }, cache: new Map([['2', moderate], ['3', owner]]) },
      roles: { cache: new Map() }, channels: { cache: new Map() },
    };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true });
    await expect(api.guilds.get('1').members.get('2').timeout(1000)).rejects.toMatchObject({ code: 'MEMBER_HIERARCHY', exitCode: 5 });
    await expect(api.guilds.get('1').members.get('3').timeout(1000)).rejects.toMatchObject({ code: 'MEMBER_PROTECTED', exitCode: 5 });
  });
});
