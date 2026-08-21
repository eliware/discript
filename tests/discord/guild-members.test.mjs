import { describe, expect, jest, test } from '@jest/globals';

import { createDiscordApi } from '../../src/discord.mjs';





describe('member voice operations', () => {
  function setup(permission = () => true, options = { yes: true }) {
    const setMute = jest.fn(async () => undefined);
    const setDeaf = jest.fn(async () => undefined);
    const setChannel = jest.fn(async () => undefined);
    const member = { id: '2', user: { username: 'user' }, voice: { channelId: '3', serverMute: false, serverDeaf: false, setMute, setDeaf, setChannel }, roles: { highest: { position: 1 } } };
    const voiceChannel = { id: '4', type: 'voice' };
    const guild = { id: '1', members: { cache: new Map([['2', member]]), me: { permissions: { has: permission }, roles: { highest: { position: 10 } } } }, channels: { cache: new Map([['4', voiceChannel]]) } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, options);
    return { api, member, setMute, setDeaf, setChannel };
  }

  test('reports status and performs guarded voice controls', async () => {
    const { api, setMute, setDeaf, setChannel } = setup();
    const voice = api.guilds.get('1').members.get('2').voice;
    expect(voice.status()).toEqual({ memberId: '2', channelId: '3', muted: false, deafened: false });
    await expect(voice.mute(true)).resolves.toEqual({ memberId: '2', muted: true });
    await expect(voice.deafen(true)).resolves.toEqual({ memberId: '2', deafened: true });
    await expect(voice.move('4')).resolves.toEqual({ memberId: '2', channelId: '4', moved: true });
    await expect(voice.disconnect()).resolves.toEqual({ memberId: '2', disconnected: true });
    expect(setMute).toHaveBeenCalledWith(true, undefined);
    expect(setDeaf).toHaveBeenCalledWith(true, undefined);
    expect(setChannel).toHaveBeenNthCalledWith(1, '4', undefined);
    expect(setChannel).toHaveBeenNthCalledWith(2, null, undefined);
  });

  test('enforces voice permissions and previews without mutation', async () => {
    const { api: deniedApi } = setup(() => false);
    await expect(deniedApi.guilds.get('1').members.get('2').voice.mute()).rejects.toMatchObject({ code: 'MISSING_PERMISSION', exitCode: 5 });
    const { api: previewApi, setMute } = setup(() => true, { dryRun: true });
    await expect(previewApi.guilds.get('1').members.get('2').voice.mute()).resolves.toMatchObject({ dryRun: true, muted: true });
    expect(setMute).not.toHaveBeenCalled();
  });
});

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

describe('member edge cases', () => {
  test('rejects an unknown member', () => {
    const guild = { id: '1', members: { cache: new Map() }, roles: { cache: new Map() }, channels: { cache: new Map() } };
    expect(() => createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }).guilds.get('1').members.get('x')).toThrow(expect.objectContaining({ code: 'MEMBER_NOT_FOUND' }));
  });
  test('kicks a member with approval', async () => {
    const kick = jest.fn(); const member = { id: '2', user: { username: 'u' }, roles: { cache: new Map() }, kick };
    const guild = { id: '1', members: { cache: new Map([['2', member]]), me: { id: 'bot', roles: { highest: { position: 10 } }, permissions: { has: () => true } } }, roles: { cache: new Map() }, channels: { cache: new Map() } };
    await expect(createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true }).guilds.get('1').members.get('2').kick('bye')).resolves.toMatchObject({ kicked: true });
    expect(kick).toHaveBeenCalledWith('bye');
  });
  test('bans a member with approval', async () => {
    const ban = jest.fn(); const member = { id: '2', user: { username: 'u' }, roles: { cache: new Map() }, ban };
    const guild = { id: '1', members: { cache: new Map([['2', member]]), me: { id: 'bot', roles: { highest: { position: 10 } }, permissions: { has: () => true } } }, roles: { cache: new Map() }, channels: { cache: new Map() } };
    await expect(createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true }).guilds.get('1').members.get('2').ban('bad')).resolves.toMatchObject({ banned: true });
    expect(ban).toHaveBeenCalled();
  });
  test('previews kick and ban', async () => {
    const member = { id: '2', user: { username: 'u' }, roles: { cache: new Map() }, kick: jest.fn(), ban: jest.fn() };
    const guild = { id: '1', members: { cache: new Map([['2', member]]), me: { id: 'bot', roles: { highest: { position: 10 } }, permissions: { has: () => true } } }, roles: { cache: new Map() }, channels: { cache: new Map() } };
    const api = createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { dryRun: true });
    await expect(api.guilds.get('1').members.get('2').kick()).resolves.toMatchObject({ dryRun: true });
    await expect(api.guilds.get('1').members.get('2').ban()).resolves.toMatchObject({ dryRun: true });
    expect(member.kick).not.toHaveBeenCalled();
  });
  test('rejects moderation without approval', async () => {
    const member = { id: '2', user: { username: 'u' }, roles: { cache: new Map() }, kick: jest.fn() };
    const guild = { id: '1', members: { cache: new Map([['2', member]]), me: { id: 'bot', roles: { highest: { position: 10 } }, permissions: { has: () => true } } }, roles: { cache: new Map() }, channels: { cache: new Map() } };
    await expect(createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }).guilds.get('1').members.get('2').kick()).rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED' });
  });
  test('rejects invalid timeout duration', async () => {
    const member = { id: '2', user: { username: 'u' }, roles: { cache: new Map() }, timeout: jest.fn() };
    const guild = { id: '1', members: { cache: new Map([['2', member]]), me: { id: 'bot', roles: { highest: { position: 10 } }, permissions: { has: () => true } } }, roles: { cache: new Map() }, channels: { cache: new Map() } };
    await expect(createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }, { yes: true }).guilds.get('1').members.get('2').timeout(0)).rejects.toMatchObject({ code: 'INVALID_DURATION' });
  });
  test('reports a member with no voice channel', () => {
    const member = { id: '2', user: { username: 'u' }, voice: { channelId: null, serverMute: true, serverDeaf: true }, roles: { cache: new Map() } };
    const guild = { id: '1', members: { cache: new Map([['2', member]]) }, roles: { cache: new Map() }, channels: { cache: new Map() } };
    expect(createDiscordApi({ guilds: { cache: new Map([['1', guild]]) } }).guilds.get('1').members.get('2').voice.status()).toEqual({ memberId: '2', channelId: null, muted: true, deafened: true });
  });
});
