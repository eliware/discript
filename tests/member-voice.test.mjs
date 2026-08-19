import { jest } from '@jest/globals';
import { createDiscordApi } from '../src/discord.mjs';

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
